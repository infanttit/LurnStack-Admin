import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { authTokenStorage } from '../api/axiosClient';

const RequireAuth = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const location = useLocation();
  const hasAdminToken = !!authTokenStorage.get();

  if (!isAuthenticated || !hasAdminToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;

