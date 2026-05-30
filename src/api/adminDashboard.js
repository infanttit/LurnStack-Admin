import { axiosClient } from './axiosClient';

const ADMIN_SUMMARY_ENDPOINT = '/api/admin/dashboard/summary';
const ADMIN_STUDENTS_ENDPOINT = '/api/admin/students';
const ADMIN_TRAINERS_ENDPOINT = '/api/admin/trainers';

export const fetchAdminDashboardSummary = async () => {
  const response = await axiosClient.get(ADMIN_SUMMARY_ENDPOINT);
  return response.data;
};

export const fetchAdminStudents = async () => {
  const response = await axiosClient.get(ADMIN_STUDENTS_ENDPOINT);
  return response.data;
};

export const fetchAdminTrainers = async () => {
  const response = await axiosClient.get(ADMIN_TRAINERS_ENDPOINT);
  return response.data;
};

export const updateStudentStatus = async (studentId, isActive) => {
  const response = await axiosClient.patch(
    `${ADMIN_STUDENTS_ENDPOINT}/${studentId}/status`,
    { isActive }
  );
  return response.data;
};

export const deleteStudent = async (studentId) => {
  const response = await axiosClient.delete(`${ADMIN_STUDENTS_ENDPOINT}/${studentId}`);
  return response.data;
};

export const bulkDeleteStudents = async () => {
  const response = await axiosClient.delete(ADMIN_STUDENTS_ENDPOINT);
  return response.data;
};

export const updateTrainer = async (trainerId, payload) => {
  const response = await axiosClient.patch(`${ADMIN_TRAINERS_ENDPOINT}/${trainerId}`, payload);
  return response.data;
};

export const deleteTrainer = async (trainerId) => {
  const response = await axiosClient.delete(`${ADMIN_TRAINERS_ENDPOINT}/${trainerId}`);
  return response.data;
};
