import { UAParser } from 'ua-parser-js';

export function getAuditMetadata(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  const parser = new (UAParser as any)(ua);
  const result = parser.getResult();

  const ipAttr = req.headers.get('x-forwarded-for') || 'unknown';
  const ip = ipAttr.split(',')[0];

  return {
    ip,
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    deviceType: result.device.type || 'desktop',
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
  };
}
