import React from 'react';

const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
    <div className="inline-flex items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  </div>
);

export default LoadingSpinner;
