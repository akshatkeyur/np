import dayjs from 'dayjs';

type LogLevel = 'success' | 'error' | 'info' | 'warn';

const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

const levelIcons: Record<LogLevel, string> = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warn: '⚠',
};

function formatTimestamp(): string {
  return dayjs().format('HH:mm:ss');
}

function log(level: LogLevel, message: string, showIcon = true): void {
  const color = colors[level];
  const icon = showIcon ? `${levelIcons[level]} ` : '';
  const timestamp = `${colors.dim}[${formatTimestamp()}]${colors.reset}`;
  console.log(`${timestamp} ${color}${icon}${message}${colors.reset}`);
}

export const logger = {
  success: (message: string) => log('success', message),
  error: (message: string) => log('error', message),
  info: (message: string) => log('info', message),
  warn: (message: string) => log('warn', message),

  step: (step: number, total: number, message: string) => {
    const label = `Step ${step}/${total}`;
    console.log(`\n${colors.dim}${'─'.repeat(50)}${colors.reset}`);
    log('info', `${colors.bold}${label}${colors.reset}: ${message}`);
  },

  section: (title: string) => {
    console.log('\n' + colors.bold);
    console.log(`  ${'═'.repeat(50)}`);
    console.log(`  ${title}`);
    console.log(`  ${'═'.repeat(50)}` + colors.reset);
  },

  config: (label: string, value: string) => {
    console.log(`  ${colors.dim}${label.padEnd(20)}${colors.reset} ${colors.info}${value}${colors.reset}`);
  },

  stats: (stats: {
    total: number;
    success: number;
    failed: number;
    rate: number;
    elapsed: string;
    avgResponse: string;
  }) => {
    console.clear();
    console.log(colors.bold + '\n╔══════════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.bold + '║' + colors.reset + colors.bold + ' API STRESS TESTER - LIVE STATS ' + colors.reset.padEnd(50) + colors.bold + '║' + colors.reset);
    console.log(colors.bold + '╚══════════════════════════════════════════════════════╝' + colors.reset);
    console.log('');
    console.log(`  ${'Total:'.padEnd(12)} ${colors.bold}${stats.total.toLocaleString()}${colors.reset}     ${'Success:'.padEnd(12)} ${colors.success}${stats.success.toLocaleString()}${colors.reset}     ${'Failed:'.padEnd(10)} ${colors.error}${stats.failed.toLocaleString()}${colors.reset}`);
    console.log('');
    console.log(`  ${'Success Rate:'.padEnd(12)} ${stats.rate >= 95 ? colors.success : stats.rate >= 80 ? colors.warn : colors.error}${stats.rate.toFixed(1)}%${colors.reset}     ${'Elapsed:'.padEnd(12)} ${stats.elapsed}     ${'Avg Response:'.padEnd(14)} ${stats.avgResponse}`);
    console.log('');
    console.log(colors.dim + '─'.repeat(60) + colors.reset);
  },

  finalSummary: (stats: {
    totalRequests: number;
    successCount: number;
    failureCount: number;
    duration: string;
    avgResponseTime: string;
  }) => {
    const successRate = stats.totalRequests > 0
      ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
      : '0.0';

    console.log('\n' + colors.bold);
    console.log('  ╔═══════════════════════════════════════════════════════╗');
    console.log('  ║              FINAL SUMMARY                            ║');
    console.log('  ╠═══════════════════════════════════════════════════════╣');
    console.log(`  ║  Total Requests: ${String(stats.totalRequests).padEnd(15)}              ║`);
    console.log(`  ║  Successful:     ${String(`${stats.successCount} (${successRate}%)`).padEnd(15)}              ║`);
    console.log(`  ║  Failed:        ${String(stats.failureCount).padEnd(15)}              ║`);
    console.log(`  ║  Duration:      ${stats.duration.padEnd(15)}              ║`);
    console.log(`  ║  Avg Response:  ${stats.avgResponseTime.padEnd(15)}              ║`);
    console.log('  ╚═══════════════════════════════════════════════════════╝' + colors.reset);
  },

  requestLog: (message: string, status: 'success' | 'error' | 'info' | 'warning', duration?: number) => {
    const color = colors[status];
    const icon = levelIcons[status];
    const timestamp = `${colors.dim}[${formatTimestamp()}]${colors.reset}`;
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`${timestamp} ${color}${icon} ${message}${durationStr}${colors.reset}`);
  },
};