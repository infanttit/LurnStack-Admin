import { axiosClient } from './axiosClient';

const TRAINER_SESSIONS_ENDPOINT = '/api/trainer/sessions';

export const fetchTrainerSessions = async () => {
  const response = await axiosClient.get(TRAINER_SESSIONS_ENDPOINT);
  return response.data;
};

export const createTrainerSession = async (payload) => {
  const response = await axiosClient.post(TRAINER_SESSIONS_ENDPOINT, payload);
  return response.data;
};
