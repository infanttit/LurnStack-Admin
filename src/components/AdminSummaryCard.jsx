import React from 'react';

const AdminSummaryCard = ({ label, value, detail, icon: Icon, accentClass }) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{value ?? 0}</p>
          {detail ? <p className="mt-2 text-sm text-gray-500">{detail}</p> : null}
        </div>
        <div className={`p-3 rounded-2xl text-white ${accentClass}`}>
          {Icon ? <Icon className="w-6 h-6" /> : null}
        </div>
      </div>
    </div>
  );
};

export default AdminSummaryCard;
