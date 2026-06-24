import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import AES from 'crypto-js/aes';
import { CliOptions, CapturedCredentials, TestStats, RequestLog } from '../types';
import { logger } from './logger';

const TIMEOUT = 10000;

function encryptPassword(password: string): string {
  const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY as string || 'default-secret-key';
  return AES.encrypt(password, SECRET_KEY.trim()).toString();
}

function buildBackendUrl(baseUrl: string, path: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  const origin = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  return `${origin}${path}`;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export class StressRunner {
  private options: CliOptions;
  private credentials: CapturedCredentials;
  private stats: TestStats;
  private logs: RequestLog[];
  private isRunning: boolean;
  private startTime: number;
  private timerInterval: ReturnType<typeof setInterval> | null;
  private logId: number;
  private abortController: AbortController;

  constructor(options: CliOptions, credentials: CapturedCredentials) {
    this.options = options;
    this.credentials = credentials;
    this.stats = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      startedAt: null,
      elapsed: 0,
      avgResponseTime: 0,
    };
    this.logs = [];
    this.isRunning = false;
    this.startTime = 0;
    this.timerInterval = null;
    this.logId = 0;
    this.abortController = new AbortController();
  }

  private addLog(status: RequestLog['status'], message: string, duration?: number): void {
    const entry: RequestLog = {
      id: this.logId++,
      timestamp: dayjs().format('HH:mm:ss.SSS'),
      status,
      message,
      duration,
    };
    this.logs.push(entry);
    logger.requestLog(message, status, duration);
  }

  private startElapsedTimer(): void {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.stats.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  private stopElapsedTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private displayStats(): void {
    const successRate = this.stats.totalRequests > 0
      ? (this.stats.successCount / this.stats.totalRequests) * 100
      : 0;
    const avgResponse = this.stats.totalRequests > 0
      ? Math.round(this.stats.avgResponseTime)
      : 0;

    logger.stats({
      total: this.stats.totalRequests,
      success: this.stats.successCount,
      failed: this.stats.failureCount,
      rate: successRate,
      elapsed: formatElapsed(this.stats.elapsed),
      avgResponse: `${avgResponse}ms`,
    });
  }

  private async fetchDashboard(): Promise<void> {
    const startTime = performance.now();
    try {
      let password = this.credentials.encryptedPassword;
      if (!password && this.credentials.plainPassword) {
        password = encryptPassword(this.credentials.plainPassword);
      }
      
      await axios.get(buildBackendUrl(this.options.baseUrl, '/admin/dashboard'), {
        params: {
          page: 1,
          limit: 100000,
          interval: 'daily',
          sort_by: 'organization_name',
          filter_by: 'organization',
          user: this.credentials.user,
          password: password,
        },
        timeout: TIMEOUT,
        signal: this.abortController.signal,
      });
      const duration = Math.round(performance.now() - startTime);
      this.stats.totalRequests++;
      this.stats.successCount++;
      this.stats.avgResponseTime = ((this.stats.avgResponseTime * (this.stats.totalRequests - 1)) + duration) / this.stats.totalRequests;
      this.addLog('success', `dashboard 200 OK`, duration);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      if (this.abortController.signal.aborted) return;
      const axiosError = error as AxiosError;
      const message = axiosError.response
        ? `${axiosError.response.status} ${axiosError.response.statusText}`
        : axiosError.message;
      this.stats.totalRequests++;
      this.stats.failureCount++;
      this.stats.avgResponseTime = ((this.stats.avgResponseTime * (this.stats.totalRequests - 1)) + duration) / this.stats.totalRequests;
      this.addLog('error', `dashboard failed: ${message}`, duration);
    }
  }

  private async fetchPatients(): Promise<void> {
    const startTime = performance.now();
    try {
      await axios.get(buildBackendUrl(this.options.baseUrl, '/patient/getAllPatients'), {
        headers: {
          Authorization: `Bearer ${this.credentials.token}`,
        },
        params: {
          page: '1',
          limit: '200',
        },
        timeout: TIMEOUT,
        signal: this.abortController.signal,
      });
      const duration = Math.round(performance.now() - startTime);
      this.stats.totalRequests++;
      this.stats.successCount++;
      this.stats.avgResponseTime = ((this.stats.avgResponseTime * (this.stats.totalRequests - 1)) + duration) / this.stats.totalRequests;
      this.addLog('success', `patient 200 OK`, duration);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      if (this.abortController.signal.aborted) return;
      const axiosError = error as AxiosError;
      const message = axiosError.response
        ? `${axiosError.response.status} ${axiosError.response.statusText}`
        : axiosError.message;
      this.stats.totalRequests++;
      this.stats.failureCount++;
      this.stats.avgResponseTime = ((this.stats.avgResponseTime * (this.stats.totalRequests - 1)) + duration) / this.stats.totalRequests;
      this.addLog('error', `patient failed: ${message}`, duration);
    }
  }

  private async runBatch(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.options.concurrency; i++) {
      if (this.options.type === 'patient') {
        promises.push(this.fetchPatients());
      } else {
        promises.push(this.fetchDashboard());
      }
    }
    await Promise.allSettled(promises);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.stats.startedAt = new Date();
    const startedAt = dayjs().format('HH:mm:ss');

    logger.section('STRESS TEST RUNNING');
    logger.info(`Started at: ${startedAt}`);
    logger.info(`Type: ${this.options.type} | Concurrency: ${this.options.concurrency} | Interval: ${this.options.interval}ms`);
    logger.info(`Target: ${this.options.baseUrl}`);
    console.log('');

    this.startElapsedTimer();
    this.addLog('info', `Runner started — concurrency: ${this.options.concurrency}, interval: ${this.options.interval}ms`);

    const statsInterval = setInterval(() => {
      if (this.isRunning) {
        this.displayStats();
      }
    }, 1000);

    try {
      while (this.isRunning) {
        if (this.abortController.signal.aborted) break;
        await this.runBatch();
        if (!this.isRunning) break;

        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, this.options.interval);
          this.abortController.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
    } finally {
      clearInterval(statsInterval);
      this.isRunning = false;
      this.stopElapsedTimer();
      this.addLog('info', 'Runner stopped');
    }
  }

  stop(): void {
    this.isRunning = false;
    this.abortController.abort();
    this.stopElapsedTimer();
  }

  getStats(): TestStats {
    return { ...this.stats };
  }

  getFinalSummary(): {
    totalRequests: number;
    successCount: number;
    failureCount: number;
    duration: string;
    avgResponseTime: string;
  } {
    return {
      totalRequests: this.stats.totalRequests,
      successCount: this.stats.successCount,
      failureCount: this.stats.failureCount,
      duration: formatElapsed(this.stats.elapsed),
      avgResponseTime: `${Math.round(this.stats.avgResponseTime)}ms`,
    };
  }
}