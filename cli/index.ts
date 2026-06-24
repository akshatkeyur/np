#!/usr/bin/env node

import { Command } from 'commander';
import { CliOptions, DEFAULT_OPTIONS } from './types';
import { captureCredentials } from './lib/capture';
import { StressRunner } from './lib/runner';
import { logger } from './lib/logger';

const program = new Command();

program
  .name('api-stress-tester')
  .description('CLI tool for API stress testing with Puppeteer credential capture')
  .version('1.0.0')
  .requiredOption('--type <type>', "Test type: 'patient' or 'dashboard'")
  .option('--concurrency <number>', 'Number of concurrent requests', String(DEFAULT_OPTIONS.concurrency))
  .option('--frontend-url <url>', 'Frontend login URL', DEFAULT_OPTIONS.frontendUrl)
  .option('--base-url <url>', 'API base URL')
  .option('--username <email>', 'Username', DEFAULT_OPTIONS.username)
  .option('--password <pass>', 'Password (for dashboard mode, will be encrypted automatically)')
  .option('--token <token>', 'Bearer token (skip browser capture for patient mode)')
  .option('--interval <ms>', 'Interval between batches in ms', String(DEFAULT_OPTIONS.interval));

program.parse(process.argv);

const options = program.opts<CliOptions>();

async function main(): Promise<void> {
  console.clear();

  logger.section('API STRESS TESTER CLI');
  logger.config('Type', options.type);
  logger.config('Concurrency', String(options.concurrency));
  logger.config('Interval', `${options.interval}ms`);
  console.log('');

  let capturedBaseUrl = options.baseUrl || '';
  let credentials: { token?: string; encryptedPassword?: string; plainPassword?: string; user: string };

  if (options.type === 'patient') {
    if (options.token) {
      logger.info('Using provided bearer token (skipping browser capture)');
      credentials = {
        token: options.token,
        user: options.username,
      };
      if (options.baseUrl) {
        capturedBaseUrl = options.baseUrl;
      }
    } else {
      logger.info('Starting credential capture via browser...');
      logger.config('Frontend URL', options.frontendUrl);
      logger.config('Username', options.username);
      console.log('');

      const captured = await captureCredentials(
        options.type,
        options.frontendUrl,
        options.username,
        options.password
      );

      credentials = {
        token: captured.token,
        user: captured.user,
      };
      capturedBaseUrl = captured.baseUrl;
    }
  } else {
    if (options.password) {
      logger.info('Using provided plain password (will be encrypted for API calls)');
      credentials = {
        plainPassword: options.password,
        user: options.username,
      };
      if (options.baseUrl) {
        capturedBaseUrl = options.baseUrl;
      }
    } else {
      logger.info('Starting credential capture via browser...');
      logger.config('Frontend URL', options.frontendUrl);
      logger.config('Username', options.username);
      console.log('');

      const captured = await captureCredentials(
        options.type,
        options.frontendUrl,
        options.username,
        options.password
      );

      credentials = {
        encryptedPassword: captured.encryptedPassword,
        user: captured.user,
      };
      capturedBaseUrl = captured.baseUrl;
    }
  }

  logger.success(`Credentials ready!`);
  if (credentials.token) {
    logger.info(`Token: ${credentials.token.slice(0, 20)}... (${credentials.token.length} chars)`);
  }
  if (credentials.encryptedPassword) {
    logger.info(`Password: ${credentials.encryptedPassword.slice(0, 20)}... (${credentials.encryptedPassword.length} chars)`);
  }
  if (credentials.plainPassword) {
    logger.info(`Password: ${credentials.plainPassword.slice(0, 3)}${'*'.repeat(Math.max(0, credentials.plainPassword.length - 3))}`);
  }
  logger.info(`User: ${credentials.user}`);
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

}

main();