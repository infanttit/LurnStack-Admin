import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../store/slices/authSlice';
import { adminLoginApi, adminRegisterApi, adminMeApi } from '../api/adminAuth';
import { authTokenStorage, getApiErrorMessage } from '../api/axiosClient';

const getTokenFromLoginResponse = (json) => {
  const direct = json?.token || json?.accessToken;
  const nested = json?.data?.token || json?.data?.accessToken;
  return direct || nested || '';
};

const getUserFromLoginResponse = (json, emailFallback) => {
  const admin = json?.data?.admin || json?.admin;
  if (admin && typeof admin === 'object') return admin;
  return { role: 'admin', email: emailFallback };
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  const fromPath = useMemo(() => {
    const candidate = location.state?.from?.pathname;
    return typeof candidate === 'string' && candidate.length ? candidate : '/';
  }, [location.state]);

  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validate = () => {
    if (mode === 'register' && !form.fullName.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.password) return 'Password is required';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'register') {
        const json = await adminRegisterApi({
          FULL_NAME: form.fullName.trim(),
          EMAIL_ADDRESS: form.email.trim(),
          PASSWORD: form.password,
        });
        if (json?.success === false) {
          setError(json?.message || 'Registration failed');
          return;
        }

        const token = getTokenFromLoginResponse(json);
        if (token) {
          authTokenStorage.set(token);
          try {
            const me = await adminMeApi();
            const admin = me?.data && typeof me.data === 'object' ? me.data : getUserFromLoginResponse(json, form.email.trim());
            dispatch(loginSuccess(admin));
            navigate(fromPath, { replace: true });
            return;
          } catch {
            const admin = getUserFromLoginResponse(json, form.email.trim());
            dispatch(loginSuccess(admin));
            navigate(fromPath, { replace: true });
            return;
          }
        }

        setSuccess('Registered successfully. Now login.');
        setMode('login');
        return;
      }

      const json = await adminLoginApi({
        EMAIL_ADDRESS: form.email.trim(),
        PASSWORD: form.password,
      });
      if (json?.success === false) {
        setError(json?.message || 'Login failed');
        return;
      }

      const token = getTokenFromLoginResponse(json);
      if (!token) {
        setError('Login succeeded but token is missing in response');
        return;
      }

      authTokenStorage.set(token);
      try {
        const me = await adminMeApi();
        const admin = me?.data && typeof me.data === 'object' ? me.data : getUserFromLoginResponse(json, form.email.trim());
        dispatch(loginSuccess(admin));
      } catch {
        const user = getUserFromLoginResponse(json, form.email.trim());
        dispatch(loginSuccess(user));
      }
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, mode === 'register' ? 'Registration failed' : 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">LurnStack Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'login' ? 'Sign in to continue' : 'Create an admin account'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1 border border-gray-100">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccess('');
              }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={onChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter email"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {submitting ? (mode === 'login' ? 'Signing in...' : 'Creating...') : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Admin access only.
        </div>
      </div>
    </div>
  );
};

export default Login;
