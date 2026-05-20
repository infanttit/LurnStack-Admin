import React from 'react';

const ErrorBanner = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-sm mb-6">
      <p className="font-medium">Unable to load dashboard data</p>
      <p className="mt-1">{message}</p>
    </div>
  );
};

export default ErrorBanner;
