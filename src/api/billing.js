import { axiosClient } from './axiosClient';

/**
 * Fetch all sessions (including trainer-created ones)
 * GET /api/admin/sessions
 */
export const fetchAdminSessions = async () => {
  const response = await axiosClient.get('/api/admin/sessions');
  return response.data;
};

/**
 * Fetch details of a specific session
 * GET /api/admin/sessions/:sessionId
 */
export const fetchAdminSessionDetails = async (sessionId) => {
  const response = await axiosClient.get(`/api/admin/sessions/${sessionId}`);
  return response.data;
};

/**
 * Set or update pricing matrix for a session
 * PATCH /api/admin/sessions/:sessionId/pricing
 * 
 * @param {string} sessionId 
 * @param {Object} payload 
 * @param {number} payload.priceInPaise Price in integer Paise (e.g. ₹100 = 10000 paise)
 * @param {number} payload.trainerSharePercentage Trainer share percentage (e.g. 50)
 * @param {number} payload.platformCommissionPercentage Platform commission percentage (e.g. 50)
 * @param {string} [payload.currency] Currency code, defaults to 'INR'
 */
export const updateSessionPricing = async (sessionId, payload) => {
  const response = await axiosClient.patch(`/api/admin/sessions/${sessionId}/pricing`, {
    amountPaise: payload.priceInPaise, // backend expects this
    price: payload.priceInPaise, // Sending both keys for safety & compatibility
    priceInPaise: payload.priceInPaise,
    currency: payload.currency || 'INR',
    trainerSharePercentage: payload.trainerSharePercentage,
    platformCommissionPercentage: payload.platformCommissionPercentage,
  });
  return response.data;
};

/**
 * Fetch global student ledger and payments history
 * GET /api/admin/payments
 */
export const fetchAdminPayments = async () => {
  const response = await axiosClient.get('/api/admin/payments');
  return response.data;
};

/**
 * Fetch a specific payment transaction details
 * GET /api/admin/payments/:paymentId
 */
export const fetchAdminPaymentDetails = async (paymentId) => {
  const response = await axiosClient.get(`/api/admin/payments/${paymentId}`);
  return response.data;
};

/**
 * Fetch revenue details for a specific session
 * GET /api/admin/sessions/:sessionId/revenue
 */
export const fetchSessionRevenue = async (sessionId) => {
  const response = await axiosClient.get(`/api/admin/sessions/${sessionId}/revenue`);
  return response.data;
};

/**
 * Fetch all trainer earnings ledger
 * GET /api/admin/trainer-earnings
 */
export const fetchTrainerEarnings = async () => {
  const response = await axiosClient.get('/api/admin/trainer-earnings');
  return response.data;
};

/**
 * Manually mark trainer earning as paid (bank settlement complete)
 * POST /api/admin/trainer-earnings/:earningId/mark-paid
 */
export const markTrainerEarningPaid = async (earningId) => {
  const response = await axiosClient.post(`/api/admin/trainer-earnings/${earningId}/mark-paid`);
  return response.data;
};

/**
 * Hold or freeze trainer payout/earnings
 * POST /api/admin/trainer-earnings/:earningId/hold
 * @param {string} earningId
 * @param {boolean} holdState Whether to hold (true) or release (false)
 */
export const holdTrainerPayout = async (earningId, holdState) => {
  const response = await axiosClient.post(`/api/admin/trainer-earnings/${earningId}/hold`, {
    hold: holdState,
  });
  return response.data;
};

/**
 * Execute refund trigger on student payment through Razorpay gateway wrapper
 * POST /api/admin/payments/:paymentId/refund
 * @param {string} paymentId
 * @param {Object} [payload] optional details like refund amount
 */
export const refundPayment = async (paymentId, payload = {}) => {
  const response = await axiosClient.post(`/api/admin/payments/${paymentId}/refund`, payload);
  return response.data;
};

/**
 * Update global platform payment settings/commission adjustments
 * PATCH /api/admin/payment-settings
 * @param {Object} payload 
 */
export const updatePaymentSettings = async (payload) => {
  const response = await axiosClient.patch('/api/admin/payment-settings', payload);
  return response.data;
};
