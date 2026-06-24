import { Command } from 'commander';
import { CliOptions, DEFAULT_OPTIONS } from '../types';
import { captureCredentials } from '../lib/capture';
import { StressRunner } from '../lib/runner';
import { logger } from '../lib/logger';

export function createTestCommand(): Command {
  const command = new Command('test');
  command
    .description('Run API stress test (patient or dashboard mode)')
    .requiredOption('--type <type>', "Test type: 'patient' or 'dashboard'")
    .option('--concurrency <number>', 'Number of concurrent requests', String(DEFAULT_OPTIONS.concurrency))
    .option('--frontend-url <url>', 'Frontend login URL', DEFAULT_OPTIONS.frontendUrl)
    .option('--base-url <url>', 'API base URL (auto-captured if not provided)')
    .option('--username <email>', 'Username', DEFAULT_OPTIONS.username)
    .option('--password <pass>', 'Password', DEFAULT_OPTIONS.password)
    .option('--interval <ms>', 'Interval between batches in ms', String(DEFAULT_OPTIONS.interval))
    .action(async (options) => {
      await runTest(options as unknown as CliOptions);
    });

  return command;
}

async function runTest(options: CliOptions): Promise<void> {
  console.clear();

  logger.section('API STRESS TESTER CLI');
  logger.config('Type', options.type);
  logger.config('Concurrency', String(options.concurrency));
  logger.config('Interval', `${options.interval}ms`);
  logger.config('Frontend URL', options.frontendUrl);
  logger.config('Username', options.username);
  console.log('');

  let capturedBaseUrl = options.baseUrl;

  try {
    logger.info('Starting credential capture...');
    const credentials = await captureCredentials(
      options.type,
      options.frontendUrl,
      options.username,
      options.password
    );

    if (credentials.baseUrl) {
      capturedBaseUrl = credentials.baseUrl;
    }

    logger.success(`Credentials captured successfully!`);
    logger.info(`User: ${credentials.user}`);
    if (credentials.token) {
      logger.info(`Token: ${credentials.token.slice(0, 20)}... (${credentials.token.length} chars)`);
    }
    if (credentials.encryptedPassword) {
      logger.info(`Password: ${credentials.encryptedPassword.slice(0, 20)}... (${credentials.encryptedPassword.length} chars)`);
    }
    logger.info(`Base URL: ${capturedBaseUrl}`);
    console.log('');

    const runnerOptions: CliOptions = {
      ...options,
      baseUrl: capturedBaseUrl,
    };
    const runner = new StressRunner(runnerOptions, credentials);

    const shutdown = async () => {
      logger.warn('\nReceived shutdown signal, stopping gracefully...');
      runner.stop();

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.clear();
      const summary = runner.getFinalSummary();
      logger.finalSummary(summary);

      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    await runner.start();

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Test failed: ${message}`);
    process.exit(1);
  }
}