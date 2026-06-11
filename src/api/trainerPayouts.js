import { axiosClient } from './axiosClient';

export const fetchAdminTrainerEarnings = async (params = {}) => {
  const response = await axiosClient.get('/api/admin/trainer-earnings', { params });
  return response.data;
};

export const fetchAdminTrainerPayoutAccounts = async (params = {}) => {
  const response = await axiosClient.get('/api/admin/trainer-payout-accounts', { params });
  return response.data;
};

export const fetchAdminTrainerPayoutAccount = async (accountId) => {
  const response = await axiosClient.get(`/api/admin/trainer-payout-accounts/${encodeURIComponent(accountId)}`);
  return response.data;
};

export const verifyTrainerPayoutAccount = async (accountId, payload = {}) => {
  const response = await axiosClient.patch(`/api/admin/trainer-payout-accounts/${encodeURIComponent(accountId)}/verify`, payload);
  return response.data;
};

export const rejectTrainerPayoutAccount = async (accountId, payload = {}) => {
  const response = await axiosClient.patch(`/api/admin/trainer-payout-accounts/${encodeURIComponent(accountId)}/reject`, payload);
  return response.data;
};

export const fetchAdminTrainerPayoutRequests = async (params = {}) => {
  const response = await axiosClient.get('/api/admin/trainer-payout-requests', { params });
  return response.data;
};

export const approveTrainerPayoutRequest = async (requestId, payload = {}) => {
  const response = await axiosClient.patch(`/api/admin/trainer-payout-requests/${encodeURIComponent(requestId)}/approve`, payload);
  return response.data;
};

export const rejectTrainerPayoutRequest = async (requestId, payload = {}) => {
  const response = await axiosClient.patch(`/api/admin/trainer-payout-requests/${encodeURIComponent(requestId)}/reject`, payload);
  return response.data;
};

export const markTrainerPayoutProcessing = async (requestId, payload = {}) => {
  const response = await axiosClient.patch(`/api/admin/trainer-payout-requests/${encodeURIComponent(requestId)}/processing`, payload);
  return response.data;
};

export const markTrainerPayoutPaid = async (requestId, payload = {}) => {
  const response = await axiosClient.patch(`/api/admin/trainer-payout-requests/${encodeURIComponent(requestId)}/paid`, payload);
  return response.data;
};

export const fetchTrainerPayoutBalance = async () => {
  const response = await axiosClient.get('/api/trainer/payout-balance');
  return response.data;
};

export const createTrainerPayoutRequest = async (payload = {}) => {
  const response = await axiosClient.post('/api/trainer/payout-requests', payload);
  return response.data;
};

export const fetchTrainerPaymentSummary = async () => {
  const response = await axiosClient.get('/api/trainer/payment-summary');
  return response.data;
};

export const fetchTrainerSessionEarnings = async () => {
  try {
    const response = await axiosClient.get('/api/trainer/session-earnings');
    return response.data;
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    const fallback = await axiosClient.get('/api/trainer/payment-summary');
    return fallback.data;
  }
};
