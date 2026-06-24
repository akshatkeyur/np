import puppeteer, { Browser, Page } from 'puppeteer';
import { TestType, CapturedCredentials } from '../types';
import { logger } from './logger';
import dayjs from 'dayjs';

const TIMEOUT_NAVIGATION = 120000;
const TIMEOUT_CAPTURE = 30000;

interface DebugLog {
  time: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

function nowMs(): string {
  return dayjs().format('HH:mm:ss.SSS');
}

function addDebugLog(logs: DebugLog[], level: DebugLog['level'], message: string): void {
  logs.push({ time: nowMs(), level, message });
}

export async function captureCredentials(
  type: TestType,
  frontendUrl: string,
  username: string,
  password: string
): Promise<CapturedCredentials> {
  const debugLogs: DebugLog[] = [];
  let browser: Browser | null = null;

  const log = (level: DebugLog['level'], message: string) => {
    const prefix = type === 'patient' ? '[Patient Capture]' : '[Dashboard Capture]';
    const fullMessage = `${prefix} ${message}`;
    logger[level](fullMessage);
    addDebugLog(debugLogs, level, fullMessage);
  };

  try {
    log('info', 'Starting credential capture via headless browser...');
    log('step', 1, 6, 'Launching headless browser');

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

    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    log('step', 2, 6, 'Navigating to login page');
    log('info', `URL: ${frontendUrl}`);

    const response = await page.goto(frontendUrl, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_NAVIGATION,
    });
    const status = response?.status() ?? 'unknown';
    log('info', `Page loaded — HTTP status: ${status}`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    log('step', 3, 6, 'Detecting input fields');
    const inputSelectors = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map((el) => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
      }));
    });
    log('info', `Found ${inputSelectors.length} input(s): ${inputSelectors.map((i) => i.name || i.type).join(', ')}`);

    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((btn) => ({
        type: btn.type,
        text: btn.innerText.slice(0, 30),
      }));
    });
    log('info', `Found ${buttons.length} button(s): ${buttons.map((b) => b.type || 'no-type').join(', ')}`);

    log('step', 4, 6, 'Filling credentials');

    const usernameSelectors = [
      'input[name="email"]',
      'input[name="username"]',
      'input[type="email"]',
      'input[type="text"]',
    ];
    let usernameFilled = false;
    for (const selector of usernameSelectors) {
      try {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel) as HTMLInputElement | null;
          if (el) el.focus();
        }, selector);
        await page.keyboard.type(username, { delay: 50 });
        log('success', `Username filled using selector: ${selector}`);
        usernameFilled = true;
        break;
      } catch {
        continue;
      }
    }
    if (!usernameFilled) {
      throw new Error('Could not fill username field');
    }

    log('step', 5, 6, 'Filling password');
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
    ];
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel) as HTMLInputElement | null;
          if (el) el.focus();
        }, selector);
        await page.keyboard.type(password, { delay: 50 });
        log('success', `Password filled using selector: ${selector}`);
        passwordFilled = true;
        break;
      } catch {
        continue;
      }
    }
    if (!passwordFilled) {
      throw new Error('Could not fill password field');
    }

    log('step', 6, 6, 'Submitting and intercepting response');

    let capturedApiUrl = '';
    let capturedPayload: Record<string, unknown> | null = null;
    let capturedToken = '';
    let capturedUser: string = username;

    if (type === 'dashboard') {
      await page.setRequestInterception(true);
      const capturePromise = new Promise<Record<string, unknown> | null>((resolve) => {
        page.on('request', async (req) => {
          const url = req.url();
          const method = req.method();
          if (method === 'POST' && url.includes('/admin/login')) {
            log('success', `Intercepted POST to: ${url}`);
            capturedApiUrl = url;
            const postData = req.postData();
            if (postData) {
              try {
                const parsed = JSON.parse(postData);
                resolve(parsed);
              } catch {
                const params = new URLSearchParams(postData);
                const obj: Record<string, unknown> = {};
                params.forEach((v, k) => { obj[k] = v; });
                resolve(obj);
              }
            }
          }
          req.continue();
        });
      });

      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
        if (btn) (btn as HTMLButtonElement).click();
      });
      log('info', 'Submit button clicked');

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_CAPTURE));
      capturedPayload = await Promise.race([capturePromise, timeoutPromise]) ?? null;

      if (!capturedPayload) {
        throw new Error('Timed out waiting for /admin/login POST interception');
      }
    } else {
      const capturePromise = new Promise<{ token: string; user?: Record<string, unknown> } | null>((resolve) => {
        page.on('response', async (res) => {
          const url = res.url();
          const method = res.request().method();
          if (method === 'POST' && (url.includes('/auth') || url.includes('/login') || url.includes('/signin') || url.includes('/api'))) {
            log('success', `Intercepted POST response from: ${url}`);
            capturedApiUrl = url;
            try {
              const raw = await res.text();
              const parsed = JSON.parse(raw);
              const token = parsed.responseData?.token 
                || parsed.responseData?.user?.token 
                || parsed.token 
                || parsed.data?.token
                || parsed.accessToken
                || parsed.access_token;
              if (token) {
                log('info', `Token found in response, length: ${String(token).length}`);
                resolve({
                  token,
                  user: parsed.responseData?.user || parsed.user,
                });
              } else {
                log('warn', `Response did not contain token. Keys: ${Object.keys(parsed).join(', ')}`);
              }
            } catch {
              log('warn', 'Failed to parse login response');
            }
          }
        });
      });

      const navigationPromise = new Promise<string>((resolve) => {
        page.on('navigation', (nav) => {
          resolve(nav.url());
        });
      });

      log('info', 'Attempting to submit form...');
      
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
        if (btn) {
          console.log('Clicking button...');
          (btn as HTMLButtonElement).click();
        }
      });

      log('info', 'Waiting for navigation or response...');
      
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_CAPTURE));
      const navPromise = new Promise<string>((resolve) => setTimeout(() => resolve(''), 10000));
      
      let capturedRedirectUrl = '';
      page.on('navigation', (nav) => {
        capturedRedirectUrl = nav.url();
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const urlAfterClick = await page.url();
      log('info', `URL after submit: ${urlAfterClick}`);
      
      if (urlAfterClick.includes('dashboard') || urlAfterClick.includes('home') || urlAfterClick.includes('patient') || urlAfterClick === urlAfterClick.replace('/login', '/dashboard')) {
        log('success', 'Navigation to dashboard detected!');
      }

      const result = await Promise.race([capturePromise, timeoutPromise]);

      if (!result) {
        throw new Error('Timed out waiting for /auth/login response interception');
      }
      capturedToken = result.token;
      capturedUser = (result.user as Record<string, string>)?.first_name && (result.user as Record<string, string>)?.last_name
        ? `${(result.user as Record<string, string>).first_name} ${(result.user as Record<string, string>).last_name}`
        : username;
    }

    await browser.close();
    log('success', 'Browser closed');

    let baseUrl = '';
    if (capturedApiUrl) {
      try {
        const parsed = new URL(capturedApiUrl);
        baseUrl = parsed.host;
        log('success', `Base URL extracted: ${baseUrl}`);
      } catch {
        log('warn', 'Could not parse intercepted URL for base URL');
      }
    }

    if (type === 'dashboard' && capturedPayload) {
      const encryptedPassword = capturedPayload.password as string;
      if (!encryptedPassword) {
        throw new Error('Intercepted payload missing "password" field');
      }
      log('success', `Encrypted password captured (length: ${encryptedPassword.length})`);

      return {
        encryptedPassword,
        user: capturedPayload.user as string || username,
        baseUrl,
      };
    } else {
      if (!capturedToken) {
        throw new Error('No token captured');
      }
      log('success', `Bearer token captured (length: ${capturedToken.length})`);

      return {
        token: capturedToken,
        user: capturedUser,
        baseUrl,
      };
    }
  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    log('error', `Capture failed: ${message}`);
    throw error;
  }
}