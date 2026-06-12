import { axiosClient } from './axiosClient';

const COURSE_SESSIONS_PATH = process.env.REACT_APP_COURSE_SESSIONS_PATH || '/api/student/live-classes';
const configuredDeleteSessionPath = process.env.REACT_APP_DELETE_COURSE_SESSION_PATH_TEMPLATE || '';
const DELETE_COURSE_SESSION_PATH_TEMPLATES = configuredDeleteSessionPath
  ? [configuredDeleteSessionPath]
  : [
      '/api/admin/delete-live-class/{sessionId}',
      '/api/admin/live-classes/{sessionId}',
      '/api/admin/sessions/{sessionId}',
    ];

export const fetchCourseSessions = async () => {
  const response = await axiosClient.get(COURSE_SESSIONS_PATH);
  return response.data;
};

export const deleteCourseSession = async (sessionId) => {
  const encodedSessionId = encodeURIComponent(String(sessionId));
  let lastError;

  for (const template of DELETE_COURSE_SESSION_PATH_TEMPLATES) {
    const path = template.replace('{sessionId}', encodedSessionId);
    try {
      const response = await axiosClient.delete(path);
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (configuredDeleteSessionPath || (status !== 404 && status !== 405)) {
        throw error;
      }
    }
  }

  throw lastError;
};
