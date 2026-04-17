import axios, { AxiosResponse } from 'axios';
import { encryptPassword } from './encrypt';

const TIMEOUT = 30000;

export interface LoginPayload {
  base_url: string;
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

export const login = async (payload: LoginPayload): Promise<AxiosResponse> => {
  const encryptedPassword = encryptPassword(payload.password);
  return axios.post('/api/proxy', {
    method: 'POST',
    url: `https://${payload.base_url}/admin/login`,
    body: {
      user: payload.username,
      password: encryptedPassword,
    }
  }, { timeout: TIMEOUT });
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
    url: `https://${payload.base_url}/admin/dashboard`,
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
