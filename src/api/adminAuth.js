import { axiosClient } from './axiosClient';

export const adminRegisterApi = async (payload) => {
  const path = process.env.REACT_APP_ADMIN_REGISTER_PATH || '/api/admin/register';
  const res = await axiosClient.post(path, payload);
  return res.data;
};

export const adminLoginApi = async (payload) => {
  const path = process.env.REACT_APP_ADMIN_LOGIN_PATH || '/api/admin/login';
  const res = await axiosClient.post(path, payload);
  return res.data;
};

export const adminMeApi = async () => {
  const path = process.env.REACT_APP_ADMIN_ME_PATH || '/api/admin/me';
  const res = await axiosClient.get(path);
  return res.data;
};
