import { createSlice } from '@reduxjs/toolkit';
import { authTokenStorage } from '../../api/axiosClient';

const AUTH_STORAGE_KEY = 'lurnstack_admin_auth';

const isTokenExpired = (token) => {
  try {
    const [, payload] = String(token || '').split('.');
    if (!payload) return false;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    if (!decoded?.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

const clearSavedAuth = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  authTokenStorage.clear();
};

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = authTokenStorage.get();
    if (!token || isTokenExpired(token)) {
      clearSavedAuth();
      return { isAuthenticated: false, user: null };
    }
    if (!raw) return { isAuthenticated: false, user: null };
    const parsed = JSON.parse(raw);
    if (parsed?.isAuthenticated && token) {
      return { isAuthenticated: true, user: parsed.user || { role: 'admin' } };
    }
    return { isAuthenticated: false, user: null };
  } catch {
    clearSavedAuth();
    return { isAuthenticated: false, user: null };
  }
};

const saveAuth = (state) => {
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ isAuthenticated: state.isAuthenticated, user: state.user })
    );
  } catch {
    // ignore storage errors
  }
};

const initialState = loadAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload || { role: 'admin' };
      saveAuth(state);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      clearSavedAuth();
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
