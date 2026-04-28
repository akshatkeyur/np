import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CapturePatientTokenBody {
  frontend_login_url: string;
  username: string;
  password: string;
}

interface PatientUser {
  token?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

interface PatientLoginResponse {
  responseData?: {
    token?: string;
    user?: PatientUser;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface DebugLog {
  time: string;
  level: LogLevel;
  message: string;
}

function nowMs() {
  return new Date().toISOString().slice(11, 23);
}

function extractToken(data: PatientLoginResponse) {
  const responseData = data.responseData;
  const token = responseData?.token || responseData?.user?.token;

  if (!token) return null;

  return {
    token,
    user: responseData?.user,
  };
}

export async function POST(request: NextRequest) {
  const debugLogs: DebugLog[] = [];

  const log = (level: LogLevel, message: string) => {
    debugLogs.push({ time: nowMs(), level, message });
    console[level === 'success' ? 'log' : level](`[patient-token] ${message}`);
  };

  const fail = (error: string, status = 500) =>
    Response.json({ success: false, error, debugLogs }, { status });

  let body: CapturePatientTokenBody;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const { frontend_login_url, username, password } = body;

  if (!frontend_login_url || !username || !password) {
    return fail('frontend_login_url, username, and password are required', 400);
  }

  log('info', `Starting patient token capture for URL: ${frontend_login_url}`);

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
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });
    log('success', 'Browser launched successfully');

    const page = await browser.newPage();
    log('info', 'New page created');

    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      log('info', `[browser console] ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', (err) => {
      log('warn', `[page error] ${err instanceof Error ? err.message : String(err)}`);
    });

    page.on('request', (req) => {
      log('info', `[request] ${req.method()} ${req.url().slice(0, 120)}`);
    });

    page.on('response', (res) => {
      log('info', `[response] ${res.status()} ${res.url().slice(0, 120)}`);
    });

    let capturedAuthUrl = '';
    let resolveCapture: (value: { token: string; user?: PatientUser } | null) => void;
    let settled = false;
    const settleCapture = (value: { token: string; user?: PatientUser } | null) => {
      if (settled) return;
      settled = true;
      resolveCapture(value);
    };

    const capturePromise = new Promise<{ token: string; user?: PatientUser } | null>((resolve) => {
      resolveCapture = resolve;
    });

    page.on('response', async (res) => {
      const url = res.url();
      const method = res.request().method();

      if (method !== 'POST' || !url.includes('/auth/login')) {
        return;
      }

      log('success', `🎯 Intercepted POST response from: ${url}`);
      capturedAuthUrl = url;

      try {
        const raw = await res.text();
        log('info', `Auth response body preview: ${raw.slice(0, 500)}`);
        const parsed = JSON.parse(raw) as PatientLoginResponse;
        const extracted = extractToken(parsed);

        if (!extracted) {
          log('warn', 'Auth response did not include responseData.token or responseData.user.token');
          return;
        }

        log('success', `Token extracted successfully (length: ${extracted.token.length})`);
        settleCapture(extracted);
      } catch (error) {
        log(
          'warn',
          `Failed to parse /auth/login response body: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });

    log('info', `Navigating to: ${frontend_login_url}`);
    try {
      const response = await page.goto(frontend_login_url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      });
      const status = response?.status() ?? 'unknown';
      log('info', `Page loaded — HTTP status: ${status}`);
      log('info', `Final URL after navigation: ${page.url()}`);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      log('info', 'Waited 2s for JS rendering');

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
      inputSelectors.forEach((input, index) => {
        log(
          'info',
          `  [${index}] type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder}"`
        );
      });
    } catch (navErr) {
      log(
        'warn',
        `Navigation wait failed/timed out: ${
          navErr instanceof Error ? navErr.message : String(navErr)
        }`
      );
      log('info', 'Attempting to continue with the available DOM...');
    }

    log('info', 'Trying to focus & fill username...');
    try {
      await page.evaluate(() => {
        const el =
          document.querySelector('input[name="username"]')
          || document.querySelector('input[name="email"]')
          || document.querySelector('input[type="email"]')
          || document.querySelector('input[type="text"]');
        if (el) (el as HTMLElement).focus();
      });
      await page.keyboard.type(username, { delay: 50 });
      log('success', 'Username filled via keyboard fallback');
    } catch (error) {
      log('error', `Failed to type username: ${error instanceof Error ? error.message : String(error)}`);
      await browser.close();
      return fail('Could not input username', 500);
    }

    log('info', 'Trying to focus & fill password...');
    try {
      await page.evaluate(() => {
        const el =
          document.querySelector('input[name="password"]')
          || document.querySelector('input[type="password"]');
        if (el) (el as HTMLElement).focus();
      });
      await page.keyboard.type(password, { delay: 50 });
      log('success', 'Password filled via keyboard fallback');
    } catch (error) {
      log('error', `Failed to type password: ${error instanceof Error ? error.message : String(error)}`);
      await browser.close();
      return fail('Could not input password', 500);
    }

    log('info', 'Trying to click submit...');
    try {
      await page.evaluate(() => {
        const el =
          document.querySelector('button[type="submit"]')
          || document.querySelector('button');
        if (el) (el as HTMLElement).click();
      });
      log('success', 'Submit button clicked via evaluation fallback');
    } catch (error) {
      log('error', `Submit button click failed: ${error instanceof Error ? error.message : String(error)}`);
      await browser.close();
      return fail('Submit button not found', 500);
    }

    log('info', 'Waiting up to 15s for POST /auth/login response interception...');
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 150000));
    const result = await Promise.race([capturePromise, timeoutPromise]);

    await browser.close();
    log('info', 'Browser closed');

    if (!result) {
      log('error', 'Timed out — /auth/login response was not captured');
      return fail('No /auth/login response with a token was intercepted within 15 seconds. Check debugLogs for captured traffic.');
    }

    let capturedBaseUrl = '';
    if (capturedAuthUrl) {
      try {
        const parsed = new URL(capturedAuthUrl);
        capturedBaseUrl = parsed.host;
        log('success', `Extracted base_url: ${capturedBaseUrl}`);
      } catch {
        log('warn', `Could not parse intercepted URL for base_url: ${capturedAuthUrl}`);
      }
    }

    return Response.json({
      success: true,
      token: result.token,
      user: result.user,
      capturedBaseUrl,
      debugLogs,
    });
  } catch (err: unknown) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore close failure
      }
    }

    const errMsg = err instanceof Error ? err.message : 'Unknown Puppeteer error';
    log('error', `Unhandled exception: ${errMsg}`);
    return fail(errMsg);
  }
}
