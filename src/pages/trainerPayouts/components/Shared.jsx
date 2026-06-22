import React from 'react';

const statusStyles = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  requested: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  future_adjustment: 'bg-orange-50 text-orange-700 border-orange-200',
  adjusted: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  partially_paid: 'bg-sky-50 text-sky-700 border-sky-200',
};

export const StatusBadge = ({ status }) => {
  const clean = String(status || 'pending').toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize whitespace-nowrap ${statusStyles[clean] || statusStyles.pending}`}>
      {clean.replace(/_/g, ' ')}
    </span>
  );
};

export const InfoCard = ({ label, value, detail, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
};

export const TabBar = ({ tabs, activeTab, onChange }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
    <div className="flex min-w-max gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
);
