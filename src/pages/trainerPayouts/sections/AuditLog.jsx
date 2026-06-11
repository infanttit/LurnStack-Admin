import React from 'react';

const AuditLog = ({ auditLog }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="font-bold text-slate-900">Payment Audit Log</h2>
    <div className="mt-4 space-y-3">
      {auditLog.map((item) => (
        <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 lg:grid-cols-6">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Action</p>
            <p className="font-semibold capitalize text-slate-900">{item.action}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Admin</p>
            <p className="text-sm text-slate-700">{item.admin}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Timestamp</p>
            <p className="text-sm text-slate-700">{item.timestamp}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Old</p>
            <p className="text-sm text-slate-700">{item.oldStatus}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">New</p>
            <p className="text-sm text-slate-700">{item.newStatus}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Note</p>
            <p className="text-sm text-slate-700">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default AuditLog;
