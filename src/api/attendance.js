import { axiosClient } from './axiosClient';

export const getAllAttendanceRecords = async () => {
  const response = await axiosClient.get('/api/admin/attendance');
  return response.data;
};

export const getAllCourseAttendanceOverview = async () => {
  const response = await axiosClient.get('/api/admin/attendance/courses');
  return response.data;
};

export const getCourseAttendanceSummary = async (courseId) => {
  const response = await axiosClient.get(`/api/admin/courses/${courseId}/attendance-summary`);
  return response.data;
};

export const getSessionAttendance = async (sessionId) => {
  const response = await axiosClient.get(`/api/admin/sessions/${sessionId}/attendance`);
  return response.data;
};

export const overrideStudentAttendance = async (attendanceId, status) => {
  const response = await axiosClient.patch(`/api/admin/attendance/${attendanceId}`, { status });
  return response.data;
};

export const getAttendanceOverview = async () => {
  const response = await axiosClient.get('/api/admin/attendance/overview');
  return response.data;
};

export const getTrainerAttendance = async (trainerId) => {
  const response = await axiosClient.get(`/api/admin/trainers/${trainerId}/attendance`);
  return response.data;
};

export const getStudentAttendance = async (studentId) => {
  const response = await axiosClient.get(`/api/admin/students/${studentId}/attendance`);
  return response.data;
};
