import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

// Only runs on the server — Puppeteer is a Node.js library
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CaptureLoginBody {
  frontend_login_url: string;
  username: string;
  password: string;
  username_selector?: string;
  password_selector?: string;
  submit_selector?: string;
}

interface CapturedPayload {
  user?: string;
  password?: string;
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface DebugLog {
  time: string;
  level: LogLevel;
  message: string;
}

function nowMs() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

export async function POST(request: NextRequest) {
  const debugLogs: DebugLog[] = [];

  const log = (level: LogLevel, message: string) => {
    debugLogs.push({ time: nowMs(), level, message });
    console[level === 'success' ? 'log' : level](`[capture] ${message}`);
  };

  const fail = (error: string, status = 500) =>
    Response.json({ success: false, error, debugLogs }, { status });

  let body: CaptureLoginBody;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const {
    frontend_login_url,
    username,
    password,
    username_selector = 'input[name="username"]',
    password_selector = 'input[name="password"]',
    submit_selector = 'button[type="submit"]',
  } = body;

  if (!frontend_login_url || !username || !password) {
    return fail('frontend_login_url, username, and password are required', 400);
  }

  log('info', `Starting capture for URL: ${frontend_login_url}`);
  log('info', `Selectors — username: "${username_selector}", password: "${password_selector}", submit: "${submit_selector}"`);

  let browser;
  try {
    log('info', 'Launching Puppeteer (headless: true)...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--ignore-certificate-errors',        // allow self-signed / dev certs
        '--ignore-certificate-errors-spki-list',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });
    log('success', 'Browser launched successfully');

    const page = await browser.newPage();
    log('info', 'New page created');

    await page.setViewport({ width: 1280, height: 800 });

    // Log all browser console messages
    page.on('console', (msg) => {
      log('info', `[browser console] ${msg.type()}: ${msg.text()}`);
    });

    // Log page errors
    page.on('pageerror', (err) => {
      log('warn', `[page error] ${err instanceof Error ? err.message : String(err)}`);
    });

    // Log all requests (summary)
    page.on('request', (req) => {
      log('info', `[request] ${req.method()} ${req.url().slice(0, 120)}`);
    });

    // Log all responses
    page.on('response', (res) => {
      log('info', `[response] ${res.status()} ${res.url().slice(0, 120)}`);
    });

    // Enable request interception to sniff the login POST body
    await page.setRequestInterception(true);

    let capturedPayload: CapturedPayload | null = null;
    let capturedApiUrl: string | null = null; // full URL of the intercepted POST
    let captureResolve: (value: CapturedPayload | null) => void;

    const capturePromise = new Promise<CapturedPayload | null>((resolve) => {
      captureResolve = resolve;
    });

    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();

      if (method === 'POST' && url.includes('/admin/login')) {
        log('success', `🎯 Intercepted POST to: ${url}`);
        capturedApiUrl = url; // store the full URL for base_url extraction
        const postData = req.postData();
        log('info', `Raw postData: ${postData ?? '(empty)'}`);
        if (postData) {
          try {
            const parsed: CapturedPayload = JSON.parse(postData);
            log('success', `Parsed payload keys: ${Object.keys(parsed).join(', ')}`);
            capturedPayload = parsed;
            captureResolve(parsed);
          } catch (e) {
            log('warn', `Failed to parse postData as JSON: ${e}`);
            // Try form-encoded
            try {
              const params = new URLSearchParams(postData);
              const obj: CapturedPayload = {};
              params.forEach((v, k) => { obj[k] = v; });
              log('info', `Parsed as URLEncoded, keys: ${Object.keys(obj).join(', ')}`);
              capturedPayload = obj;
              captureResolve(obj);
            } catch {
              log('error', 'Could not parse postData as URLEncoded either');
            }
          }
        }
      }
      req.continue();
    });

    // Navigate to the login page
    log('info', `Navigating to: ${frontend_login_url}`);
    try {
      const response = await page.goto(frontend_login_url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000, 
      });
      const status = response?.status() ?? 'unknown';
      log('info', `Page loaded — HTTP status: ${status}`);
      log('info', `Final URL after navigation: ${page.url()}`);

      // Wait a moment for JS to render
      await new Promise((r) => setTimeout(r, 2000));
      log('info', 'Waited 2s for JS rendering');

      // Dump page title and visible input fields for debugging
      const title = await page.title();
      log('info', `Page title: "${title}"`);

      const inputSelectors = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map((el) => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className.slice(0, 60),
        }));
      });
      log('info', `Found ${inputSelectors.length} input(s) on page:`);
      inputSelectors.forEach((inp, i) => {
        log('info', `  [${i}] type="${inp.type}" name="${inp.name}" id="${inp.id}" placeholder="${inp.placeholder}"`);
      });

      const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.map((btn) => ({
          type: btn.type,
          text: btn.innerText.slice(0, 60),
          className: btn.className.slice(0, 60),
        }));
      });
      log('info', `Found ${buttons.length} button(s) on page:`);
      buttons.forEach((btn, i) => {
        log('info', `  [${i}] type="${btn.type}" text="${btn.text}"`);
      });
    } catch (navErr) {
      log('warn', `Navigation wait failed/timed out: ${navErr instanceof Error ? navErr.message : String(navErr)}`);
      log('info', 'Attempting to proceed anyway since the initial HTML was received...');
      // We do NOT return fail() here. We just continue and see if the inputs are ready.
    }

    // Fill username
    log('info', `Trying username selector: "${username_selector}"`);
    try {
      await page.waitForSelector(username_selector, { timeout: 8000 });
      await page.click(username_selector, { clickCount: 3 });
      await page.type(username_selector, username, { delay: 50 });
      log('success', `Username filled`);
    } catch (e) {
      log('error', `Username field not found: ${e instanceof Error ? e.message : String(e)}`);
      await browser.close();
      return fail(`Username field not found with selector: "${username_selector}"`, 500);
    }

    // Fill password
    log('info', `Trying password selector: "${password_selector}"`);
    try {
      await page.waitForSelector(password_selector, { timeout: 5000 });
      await page.click(password_selector, { clickCount: 3 });
      await page.type(password_selector, password, { delay: 50 });
      log('success', `Password filled`);
    } catch (e) {
      log('error', `Password field not found: ${e instanceof Error ? e.message : String(e)}`);
      await browser.close();
      return fail(`Password field not found with selector: "${password_selector}"`, 500);
    }

    // Click submit
    log('info', `Trying submit selector: "${submit_selector}"`);
    try {
      await page.waitForSelector(submit_selector, { timeout: 5000 });
      await page.click(submit_selector);
      log('success', 'Submit button clicked');
    } catch (e) {
      log('error', `Submit button not found: ${e instanceof Error ? e.message : String(e)}`);
      await browser.close();
      return fail(`Submit button not found with selector: "${submit_selector}"`, 500);
    }

    // Wait for intercepted /admin/login POST (10s timeout)
    log('info', 'Waiting up to 10s for POST /admin/login interception...');
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 10000)
    );

    const result = await Promise.race([capturePromise, timeoutPromise]);

    await browser.close();
    log('info', 'Browser closed');

    if (!result) {
      log('error', 'Timed out — /admin/login POST was NOT intercepted');
      return fail('No /admin/login POST request was intercepted within 10 seconds. Check debugLogs for all captured requests.');
    }

    const encryptedPassword = (result.password as string) ?? '';
    const capturedUser = (result.user as string) ?? username;

    if (!encryptedPassword) {
      log('error', 'Intercepted payload had no "password" field');
      return fail('Intercepted request did not contain a "password" field. See debugLogs.');
    }

    log('success', `Capture complete! User: ${capturedUser}, password length: ${encryptedPassword.length}`);

    // Extract base_url from the intercepted API URL
    // e.g. https://dev-api.subqdocs.ai/admin/login → dev-api.subqdocs.ai
    let capturedBaseUrl = '';
    if (capturedApiUrl) {
      try {
        const parsed = new URL(capturedApiUrl);
        capturedBaseUrl = parsed.host; // hostname:port (port omitted if default)
        log('success', `Extracted base_url: ${capturedBaseUrl}`);
      } catch {
        log('warn', `Could not parse intercepted URL for base_url: ${capturedApiUrl}`);
      }
    }

    return Response.json({
      success: true,
      encryptedPassword,
      user: capturedUser,
      capturedBaseUrl,
      rawPayload: result,
      debugLogs,
    });
  } catch (err: unknown) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const errMsg = err instanceof Error ? err.message : 'Unknown Puppeteer error';
    log('error', `Unhandled exception: ${errMsg}`);
    return fail(errMsg);
  }
}
