import axios, { AxiosResponse } from 'axios';
import { encryptPassword } from './encrypt';

const TIMEOUT = 30000;

const buildBackendUrl = (baseUrl: string, path: string) => {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
  const origin = /^https?:\/\//i.test(normalizedBase)
    ? normalizedBase
    : `https://${normalizedBase}`;

  return `${origin}${path}`;
};

export interface BrowserLoginPayload {
  frontend_login_url: string;
  username: string;
  password: string;
}

export interface DashboardPayload {
  base_url: string;
  username: string;
  password: string;
  signal?: AbortSignal;
  /** If set, skips local AES encryption and uses this value directly */
  manualEncryptedPassword?: string;
}

export interface PatientPayload {
  base_url: string;
  token: string;
  signal?: AbortSignal;
}

interface PatientTokenApiResponse {
  success: boolean;
  token?: string;
  user?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  capturedBaseUrl?: string;
  error?: string;
  debugLogs?: Array<{
    time: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
  }>;
}

export const getPatientToken = async (
  payload: BrowserLoginPayload
): Promise<PatientTokenApiResponse> => {
  const response = await axios.post<PatientTokenApiResponse>(
    '/api/capture-patient-token',
    payload,
    { timeout: 120000 }
  );
  return response.data;
};

export const fetchDashboard = async (
  payload: DashboardPayload
): Promise<AxiosResponse> => {
  // If a pre-captured encrypted password exists, use it directly
  // This avoids double-encryption and is the whole point of the capture flow
  const encryptedPassword = payload.manualEncryptedPassword
    ? payload.manualEncryptedPassword
    : encryptPassword(payload.password);

  return axios.post('/api/proxy', {
    method: 'GET',
    url: buildBackendUrl(payload.base_url, '/admin/dashboard'),
    params: {
      page: 1,
      limit: 100000,
      interval: 'daily',
      sort_by: 'organization_name',
      filter_by: 'organization',
      user: payload.username,
      password: encryptedPassword,
    }
  }, {
    timeout: TIMEOUT,
    signal: payload.signal,
  });
};

export const fetchPatients = async (
  payload: PatientPayload
): Promise<AxiosResponse> => {
  return axios.post('/api/proxy', {
    method: 'GET',
    url: buildBackendUrl(payload.base_url, '/patient/getAllPatients'),
    headers: {
      Authorization: `Bearer ${payload.token}`,
    },
    params: {
      page: '1',
      limit: '8',
    }
  }, {
    timeout: TIMEOUT,
    signal: payload.signal,
  });
};

export const fetchHealth = async (
  payload: { base_url: string; signal?: AbortSignal }
): Promise<AxiosResponse> => {
  return axios.post('/api/proxy', {
    method: 'GET',
    url: buildBackendUrl(payload.base_url, '/_health'),
  }, {
    timeout: TIMEOUT,
    signal: payload.signal,
  });
};
