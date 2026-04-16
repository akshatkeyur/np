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
}

export const login = async (payload: LoginPayload): Promise<AxiosResponse> => {
  const encryptedPassword = encryptPassword(payload.password);
  return axios.post(
    `https://${payload.base_url}/admin/login`,
    {
      user: payload.username,
      password: encryptedPassword,
    },
    { timeout: TIMEOUT }
  );
};

export const fetchDashboard = async (
  payload: DashboardPayload
): Promise<AxiosResponse> => {
  const encryptedPassword = encryptPassword(payload.password);
  return axios.get(
    `https://${payload.base_url}/admin/dashboard`,
    {
      params: {
        page: 1,
        limit: 100000,
        interval: 'daily',
        sort_by: 'organization_name',
        filter_by: 'organization',
        user: payload.username,
        password: encryptedPassword,
      },
      timeout: TIMEOUT,
      signal: payload.signal,
    }
  );
};
