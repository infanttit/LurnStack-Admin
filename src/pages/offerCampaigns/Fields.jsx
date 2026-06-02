import React from 'react';

export const TextField = ({ label, name, value, onChange, placeholder = '', type = 'text' }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
    />
  </div>
);

export const SelectField = ({ label, name, value, onChange, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
    >
      {children}
    </select>
  </div>
);

export const ReadOnlyField = ({ label, value }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <div className="min-h-[42px] break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
      {value}
    </div>
  </div>
);

export const Alert = ({ tone, message }) => {
  const classes =
    tone === 'error'
      ? 'border-red-200 bg-white text-red-700'
      : 'border-slate-200 bg-white text-slate-800';

  return <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${classes}`}>{message}</div>;
};

export const Metric = ({ label, value, tone = 'slate' }) => {
  const tones = { slate: 'text-slate-900', green: 'text-emerald-700', red: 'text-red-700' };
  return (
    <div className="min-w-[96px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-right">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
};
