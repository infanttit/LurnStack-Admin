import { axiosClient } from './axiosClient';

const LIVE_CLASSES_BASE_PATH = process.env.REACT_APP_LIVE_CLASSES_BASE_PATH || '/api/admin/live-classes';
// Keep the admin Live Classes page scoped to classes created by admins.
// Course/student session listings should be handled by the course module, not this page.
const configuredLiveClassListPath = process.env.REACT_APP_LIVE_CLASS_LIST_PATH || '';
const LIVE_CLASSES_LIST_PATHS = configuredLiveClassListPath
  ? [configuredLiveClassListPath]
  : [
      '/api/admin/get-live-classes',
      '/api/admin/list-live-classes',
      LIVE_CLASSES_BASE_PATH,
    ];

const normalizeId = (id) => encodeURIComponent(String(id));

const isFileLike = (value) => {
  if (!value) return false;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  return typeof value === 'object' && typeof value.arrayBuffer === 'function';
};

const toFormData = (payload) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'thumbnailFile') return;

    if (key === 'materials') {
      if (Array.isArray(value) && value.length) fd.append(key, JSON.stringify(value));
      return;
    }

    if (isFileLike(value)) {
      fd.append(key, value);
      return;
    }

    fd.append(key, String(value));
  });

  if (payload?.thumbnailFile && isFileLike(payload.thumbnailFile)) {
    fd.append('thumbnail', payload.thumbnailFile);
  }

  return fd;
};

export const listLiveClassesApi = async () => {
  let lastError;

  for (const path of LIVE_CLASSES_LIST_PATHS) {
    try {
      const res = await axiosClient.get(path);
      return res.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (configuredLiveClassListPath || (status !== 404 && status !== 405)) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const getLiveClassApi = async (id) => {
  const res = await axiosClient.get(`${LIVE_CLASSES_BASE_PATH}/${normalizeId(id)}`);
  return res.data;
};

export const getLiveClassAttendanceApi = async (id) => {
  const template =
    process.env.REACT_APP_LIVE_CLASS_ATTENDANCE_PATH_TEMPLATE ||
    `${LIVE_CLASSES_BASE_PATH}/{id}/attendance`;
  const path = template.replace('{id}', normalizeId(id));
  const res = await axiosClient.get(path);
  return res.data;
};

export const createLiveClassApi = async (payload) => {
  const path = process.env.REACT_APP_LIVE_CLASS_CREATE_PATH || '/api/admin/create-live-class';
  const res = await axiosClient.post(path, toFormData(payload));
  return res.data;
};

export const updateLiveClassApi = async (id, payload) => {
  const base = process.env.REACT_APP_LIVE_CLASS_UPDATE_PATH_BASE || '/api/admin/update-live-class';
  const res = await axiosClient.put(`${base}/${normalizeId(id)}`, toFormData(payload));
  return res.data;
};

export const deleteLiveClassApi = async (id) => {
  const base = process.env.REACT_APP_LIVE_CLASS_DELETE_PATH_BASE || '/api/admin/delete-live-class';
  const res = await axiosClient.delete(`${base}/${normalizeId(id)}`);
  return res.data;
};

export const fetchPendingSessionsApi = async () => {
  const res = await axiosClient.get('/api/admin/sessions/pending-review');
  return res.data;
};

export const reviewSessionApi = async (id, price) => {
  const res = await axiosClient.put(`/api/admin/sessions/${normalizeId(id)}/review`, { price });
  return res.data;
};

