export interface FormData {
  base_url: string;
  username: string;
  password: string;
  concurrency: number;
  concurrency_interval: number;
  start_time: string;
  end_time: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  status: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface RunnerStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  isRunning: boolean;
  logs: LogEntry[];
  lastResponse: string | null;
  startedAt: string | null;
  elapsed: number;
}
