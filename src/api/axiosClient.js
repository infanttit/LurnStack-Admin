import axios from 'axios';

const DEFAULT_BASE_URL = process.env.NODE_ENV === 'development' ? '' : 'https://api.lurnstack.com';
const configuredApiBaseURL = String(process.env.REACT_APP_API_BASE_URL || '').trim();

export const apiBaseURL = configuredApiBaseURL || DEFAULT_BASE_URL;

export const authTokenStorage = {
  key: 'lurnstack_admin_token',
  get() {
    try {
      const storedToken = localStorage.getItem(this.key) || '';
      if (storedToken) return storedToken;
      return process.env.REACT_APP_ADMIN_BEARER_TOKEN || '';
    } catch {
      return process.env.REACT_APP_ADMIN_BEARER_TOKEN || '';
    }
  },
  set(token) {
    try {
      localStorage.setItem(this.key, token || '');
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // ignore
    }
  },
};

export const studentTokenStorage = {
  key: 'lurnstack_student_token',
  get() {
    try {
      const fromStorage = localStorage.getItem(this.key) || '';
      if (fromStorage) return fromStorage;
      const fromEnv =
        process.env.REACT_APP_STUDENT_BEARER_TOKEN ||
        process.env.REACT_APP_STUDENT_API_TOKEN ||
        '';
      return fromEnv || '';
    } catch {
      return process.env.REACT_APP_STUDENT_BEARER_TOKEN || process.env.REACT_APP_STUDENT_API_TOKEN || '';
    }
  },
  set(token) {
    try {
      localStorage.setItem(this.key, token || '');
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // ignore
    }
  },
};

export const trainerTokenStorage = {
  key: 'lurnstack_trainer_token',
  get() {
    try {
      const fromStorage = localStorage.getItem(this.key) || '';
      if (fromStorage) return fromStorage;
      return process.env.REACT_APP_TRAINER_BEARER_TOKEN || process.env.REACT_APP_TRAINER_API_TOKEN || '';
    } catch {
      return process.env.REACT_APP_TRAINER_BEARER_TOKEN || process.env.REACT_APP_TRAINER_API_TOKEN || '';
    }
  },
  set(token) {
    try {
      localStorage.setItem(this.key, token || '');
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // ignore
    }
  },
};

export const axiosClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
  headers: {},
});

const AUTH_FREE_PATHS = [
  process.env.REACT_APP_ADMIN_REGISTER_PATH || '/api/admin/register',
  process.env.REACT_APP_ADMIN_LOGIN_PATH || '/api/admin/login',
];

const isSameApiPath = (requestUrl, apiPath) => {
  const requestPath = String(requestUrl || '').split('?')[0].replace(/\/+$/, '');
  const cleanApiPath = String(apiPath || '').split('?')[0].replace(/\/+$/, '');
  return requestPath === cleanApiPath;
};

axiosClient.interceptors.request.use((config) => {
  const url = String(config?.url || '');
  const isAuthFreeRequest = AUTH_FREE_PATHS.some((path) => isSameApiPath(url, path));
  const isStudentRequest = url.includes('/api/student/');
  const isTrainerRequest = url.includes('/api/trainer/');
  const studentToken = isStudentRequest ? studentTokenStorage.get() : '';
  const trainerToken = isTrainerRequest ? trainerTokenStorage.get() : '';
  const token = isAuthFreeRequest
    ? ''
    : isTrainerRequest
      ? (trainerToken || authTokenStorage.get())
      : isStudentRequest
      ? (studentToken || authTokenStorage.get())
      : authTokenStorage.get();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers) {
    delete config.headers.Authorization;
    delete config.headers.authorization;
  }

  const isFormData =
    typeof FormData !== 'undefined' && config?.data && config.data instanceof FormData;
  if (isFormData && config.headers) {
    // Let the browser set `multipart/form-data` with boundary.
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const next = new Error('Unauthorized (401). Please login again.');
      next.response = error.response;
      return Promise.reject(next);
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;
  const safeMessage = typeof message === 'string' ? message : fallback;
  if (status) return `${safeMessage}`;
  return safeMessage;
};

export const resolveAssetUrl = (maybeUrl) => {
  if (!maybeUrl || typeof maybeUrl !== 'string') return '';
  const value = maybeUrl.trim();
  if (!value) return '';
  if (/^data:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  const prefix = apiBaseURL.replace(/\/+$/, '');
  const path = value.replace(/^\/+/, '');
  return `${prefix}/${path}`;
};
