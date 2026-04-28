'use client';

import { useState, useRef, useCallback } from 'react';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { fetchDashboard, fetchPatients } from '../utils/api';
import { FormData, LogEntry, RunnerStats } from '../types';

const MAX_CONCURRENCY = 20;
type RunnerMode = 'dashboard' | 'patient';

export const useRunner = () => {
  const [stats, setStats] = useState<RunnerStats>({
    mode: null,
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    isRunning: false,
    logs: [],
    lastResponse: null,
    startedAt: null,
    elapsed: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef(false);
  const logIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const addLog = useCallback(
    (status: LogEntry['status'], message: string, duration?: number) => {
      const entry: LogEntry = {
        id: logIdRef.current++,
        timestamp: dayjs().format('HH:mm:ss.SSS'),
        status,
        message,
        duration,
      };
      setStats((prev) => ({
        ...prev,
        logs: [entry, ...prev.logs].slice(0, 500),
      }));
    },
    []
  );

  const startElapsedTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        elapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runBatch = useCallback(
    async (
      formData: FormData,
      signal: AbortSignal,
      runRequest: (signal: AbortSignal) => Promise<AxiosResponse>
    ) => {
      const concurrency = Math.min(formData.concurrency, MAX_CONCURRENCY);
      const promises = Array.from({ length: concurrency }).map(async () => {
        const startTime = performance.now();
        try {
          const res = await runRequest(signal);
          const duration = Math.round(performance.now() - startTime);
          setStats((prev) => ({
            ...prev,
            totalRequests: prev.totalRequests + 1,
            successCount: prev.successCount + 1,
            lastResponse: JSON.stringify(res.data).slice(0, 300),
          }));
          addLog('success', `✓ 200 OK (${duration}ms)`, duration);
        } catch (err: unknown) {
          const duration = Math.round(performance.now() - startTime);
          if (signal.aborted) return;
          const errorMsg =
            err instanceof Error ? err.message : 'Unknown error';
          setStats((prev) => ({
            ...prev,
            totalRequests: prev.totalRequests + 1,
            failureCount: prev.failureCount + 1,
            lastResponse: errorMsg,
          }));
          addLog('error', `✗ Failed: ${errorMsg} (${duration}ms)`, duration);
        }
      });
      await Promise.allSettled(promises);
    },
    [addLog]
  );

  const startRunner = useCallback(
    async ({
      formData,
      mode,
      authLabel,
      runRequest,
    }: {
      formData: FormData;
      mode: RunnerMode;
      authLabel: string;
      runRequest: (signal: AbortSignal) => Promise<AxiosResponse>;
    }) => {
      const endTime = dayjs(formData.end_time);
      const startTime = dayjs(formData.start_time);
      const now = dayjs();

      if (endTime.isBefore(startTime)) {
        addLog('error', 'End time must be after start time');
        return;
      }

      if (endTime.isBefore(now)) {
        addLog('error', 'End time is in the past');
        return;
      }

      // Wait until start_time if it's in the future
      if (startTime.isAfter(now)) {
        const waitMs = startTime.diff(now);
        addLog('info', `⏳ Waiting ${Math.round(waitMs / 1000)}s until start time...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      abortControllerRef.current = new AbortController();
      isRunningRef.current = true;

      setStats({
        mode,
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        isRunning: true,
        logs: [],
        lastResponse: null,
        startedAt: dayjs().format('HH:mm:ss'),
        elapsed: 0,
      });

      startElapsedTimer();
      addLog(
        'info',
        `🚀 ${mode} runner started — concurrency: ${Math.min(formData.concurrency, MAX_CONCURRENCY)}, interval: ${formData.concurrency_interval}ms, auth: ${authLabel}`
      );

      const signal = abortControllerRef.current.signal;

      while (isRunningRef.current && dayjs().isBefore(endTime)) {
        if (signal.aborted) break;

        await runBatch(formData, signal, runRequest);

        if (!isRunningRef.current || signal.aborted) break;

        // Wait for concurrency_interval
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, formData.concurrency_interval);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }

      isRunningRef.current = false;
      stopElapsedTimer();
      setStats((prev) => ({ ...prev, isRunning: false }));
      addLog('info', '🛑 Runner stopped');
    },
    [addLog, runBatch, startElapsedTimer, stopElapsedTimer]
  );

  const startDashboard = useCallback(
    async (formData: FormData) => {
      const authLabel = formData.manual_encrypted_password
        ? 'captured encrypted password'
        : 'local AES encryption';

      await startRunner({
        formData,
        mode: 'dashboard',
        authLabel,
        runRequest: (signal) =>
          fetchDashboard({
            base_url: formData.base_url,
            username: formData.username,
            password: formData.password,
            signal,
            manualEncryptedPassword: formData.manual_encrypted_password,
          }),
      });
    },
    [startRunner]
  );

  const startPatient = useCallback(
    async (formData: FormData, token: string) => {
      await startRunner({
        formData,
        mode: 'patient',
        authLabel: 'bearer token',
        runRequest: (signal) =>
          fetchPatients({
            base_url: formData.base_url,
            token,
            signal,
          }),
      });
    },
    [startRunner]
  );

  const stop = useCallback(() => {
    isRunningRef.current = false;
    abortControllerRef.current?.abort();
    stopElapsedTimer();
    setStats((prev) => ({ ...prev, isRunning: false }));
    addLog('warning', '⚠️ Execution stopped by user');
  }, [addLog, stopElapsedTimer]);

  const exportLogs = useCallback(() => {
    const blob = new Blob([JSON.stringify(stats.logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-logs-${dayjs().format('YYYY-MM-DD-HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats.logs]);

  return { stats, startDashboard, startPatient, stop, exportLogs };
};
