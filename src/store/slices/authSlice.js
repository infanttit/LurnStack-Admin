import { createSlice } from '@reduxjs/toolkit';
import { authTokenStorage } from '../../api/axiosClient';

const AUTH_STORAGE_KEY = 'lurnstack_admin_auth';

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = authTokenStorage.get();
    if (!raw) return { isAuthenticated: Boolean(token), user: token ? { role: 'admin' } : null };
    const parsed = JSON.parse(raw);
    if (parsed?.isAuthenticated) {
      return { isAuthenticated: true, user: parsed.user || { role: 'admin' } };
    }
    return { isAuthenticated: Boolean(token), user: token ? { role: 'admin' } : null };
  } catch {
    const token = authTokenStorage.get();
    return { isAuthenticated: Boolean(token), user: token ? { role: 'admin' } : null };
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
      authTokenStorage.clear();
      saveAuth(state);
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
