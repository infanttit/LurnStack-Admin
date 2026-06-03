import { axiosClient } from './axiosClient';

const BASE = '/api/admin/offer-campaigns';

const toCampaignFormData = (payload) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'heroImageFile') {
      fd.append('heroImage', value);
      return;
    }
    if (Array.isArray(value)) {
      fd.append(key, JSON.stringify(value));
      return;
    }
    fd.append(key, String(value));
  });
  return fd;
};

export const fetchOfferTargetsApi = async () => {
  const response = await axiosClient.get('/api/admin/offer-targets');
  return response.data;
};

export const fetchOfferCampaignsApi = async () => {
  const response = await axiosClient.get(`${BASE}?limit=10000`);
  return response.data;
};

export const createOfferCampaignApi = async (payload) => {
  const response = await axiosClient.post(BASE, toCampaignFormData(payload));
  return response.data;
};

export const updateOfferCampaignApi = async (id, payload) => {
  const response = await axiosClient.patch(`${BASE}/${encodeURIComponent(id)}`, toCampaignFormData(payload));
  return response.data;
};

export const deleteOfferCampaignApi = async (id) => {
  const response = await axiosClient.delete(`${BASE}/${encodeURIComponent(id)}`, {
    data: { id },
  });
  return response.data;
};

export const sendOfferCampaignApi = async (id) => {
  const response = await axiosClient.post(`${BASE}/${encodeURIComponent(id)}/send`);
  return response.data;
};

export const fetchOfferCampaignDeliveriesApi = async (id) => {
  const response = await axiosClient.get(`${BASE}/${encodeURIComponent(id)}/deliveries`);
  return response.data;
};
