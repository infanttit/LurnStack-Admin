import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';

const formatJoinedDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const AdminDataTable = ({ title, description, rows = [], loading, error, renderActions }) => {
  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="p-6">
        {loading ? (
          <LoadingSpinner label={`Loading ${title.toLowerCase()}...`} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-500">
            No {title.toLowerCase()} found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500 w-12">#</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Full Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Joined</th>
                  {renderActions ? <th className="px-4 py-3 font-medium text-gray-500 text-center w-40">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{index + 1}</td>
                    <td className="px-4 py-4 text-slate-700">{row.fullName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{row.email || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{row.phoneNumber || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{formatJoinedDate(row.createdAt)}</td>
                    {renderActions ? (
                      <td className="px-4 py-4 text-center align-middle">{renderActions(row, index)}</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminDataTable;
