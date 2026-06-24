export type TestType = 'patient' | 'dashboard';

export interface CliOptions {
  type: TestType;
  concurrency: number;
  frontendUrl: string;
  baseUrl: string;
  username: string;
  password: string;
  token?: string;
  encryptedPassword?: string;
  interval: number;
}

export interface CapturedCredentials {
  encryptedPassword?: string;
  token?: string;
  plainPassword?: string;
  user: string;
  baseUrl: string;
}

export interface TestStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  startedAt: Date | null;
  elapsed: number;
  avgResponseTime: number;
}

export interface RequestLog {
  id: number;
  timestamp: string;
  status: 'success' | 'error' | 'info' | 'warn';
  message: string;
  duration?: number;
}

export const DEFAULT_OPTIONS: Partial<CliOptions> = {
  concurrency: 5,
  frontendUrl: 'https://app.subqdocs.ai/login',
  username: 'adrian.tinajero@yopmail.com',
  password: 'Dev@1234',
  interval: 2000,
};