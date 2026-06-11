import React, { useMemo, useState } from 'react';
import { Eye, Filter, RefreshCcw, Search, X } from 'lucide-react';
import { StatusBadge } from '../components/Shared';
import { formatCurrency, formatDate } from '../utils';

const getAmounts = (item) => {
  const gross = Number(item.grossRevenue ?? item.paidStudents * item.sessionPrice);
  const trainerEarning = Number(item.trainerEarning ?? Math.round((gross * item.trainerShare) / 100));
  const platformEarning = Number(item.platformEarning ?? gross - trainerEarning);
  const finalPayable = Number(item.finalPayable ?? Math.max(0, trainerEarning - item.refundAdjustment));
  return { gross, trainerEarning, platformEarning, finalPayable };
};

const getRowLabel = (row, index) =>
  row.studentName ||
  row.student?.fullName ||
  row.paymentId ||
  row.id ||
  `Earning ${index + 1}`;

const EarningsDashboard = ({ filters, setFilters, trainerOptions, sessions, rows, loading, onRefresh }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const selectedAmounts = useMemo(
    () => (selectedSession ? getAmounts(selectedSession) : null),
    [selectedSession]
  );

  return (
  <section className="space-y-4">
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Trainer Earnings</h2>
          <p className="mt-1 text-sm text-slate-500">Refresh earning rows after payout or refund changes.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="Search trainer, email, session"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
        <select value={filters.trainer} onChange={(event) => setFilters((prev) => ({ ...prev, trainer: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">All trainers</option>
          {trainerOptions.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
        </select>
        <select value={filters.session} onChange={(event) => setFilters((prev) => ({ ...prev, session: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">All sessions</option>
          {sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">All status</option>
          <option value="unpaid">Unpaid</option>
          <option value="requested">Requested</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
        </select>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filters.datePreset}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                datePreset: event.target.value,
                from: event.target.value === 'custom' ? prev.from : '',
                to: event.target.value === 'custom' ? prev.to : '',
              }))
            }
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="total">Total</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_week">Last week</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      {filters.datePreset === 'custom' ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-1/2">
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            title="From date"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            title="To date"
          />
        </div>
      ) : null}
    </div>

    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1280px] w-full text-left text-sm" aria-busy={loading}>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3 text-center">Paid Students</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Trainer %</th>
              <th className="px-4 py-3">Trainer Earning</th>
              <th className="px-4 py-3">Platform Earning</th>
              <th className="px-4 py-3">Refund Adj.</th>
              <th className="px-4 py-3">Final Payable</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="12" className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                  Refreshing trainer earnings...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                  No trainer earning records match the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((item, index) => {
              const { gross, trainerEarning, platformEarning, finalPayable } = getAmounts(item);
              return (
                <tr key={`${item.id || 'earning'}-${index}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{item.trainerName}</p>
                    <p className="text-xs text-slate-500">{item.trainerEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{item.sessionTitle}</td>
                  <td className="px-4 py-3 text-center font-semibold">{item.paidStudents}</td>
                  <td className="px-4 py-3">{formatCurrency(item.sessionPrice)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(gross)}</td>
                  <td className="px-4 py-3">{item.trainerShare}%</td>
                  <td className="px-4 py-3 text-emerald-700 font-semibold">{formatCurrency(trainerEarning)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(platformEarning)}</td>
                  <td className="px-4 py-3 text-rose-700">{formatCurrency(item.refundAdjustment)}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(finalPayable)}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedSession(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
    {selectedSession ? (
      <SessionEarningDetails
        amounts={selectedAmounts}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    ) : null}
  </section>
  );
};

const SessionEarningDetails = ({ amounts, session, onClose }) => {
  const rows = session.earningRows || session.sourceRows || [];
  const history = session.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{session.sessionTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {session.trainerName} - {session.trainerEmail || 'No email'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <DetailCard label="Paid Students" value={session.paidStudents} />
            <DetailCard label="Gross" value={formatCurrency(amounts.gross)} />
            <DetailCard label="Trainer Earning" value={formatCurrency(amounts.trainerEarning)} />
            <DetailCard label="Final Payable" value={formatCurrency(amounts.finalPayable)} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-100 px-4 py-3">
                <h4 className="font-bold text-slate-900">Earning Breakdown</h4>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Record</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length ? (
                      rows.map((row, index) => {
                        const amount =
                          row.trainerEarningPaise ??
                          row.trainerEarning ??
                          Math.round((Number(row.paidStudents || 1) * Number(row.sessionPrice || session.sessionPrice) * Number(row.trainerShare || session.trainerShare)) / 100);
                        return (
                          <tr key={row.id || row.earningId || index}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800">{getRowLabel(row, index)}</p>
                              <p className="text-xs text-slate-500">{formatDate(row.createdAt || row.date || session.date)}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold">{formatCurrency(amount)}</td>
                            <td className="px-4 py-3"><StatusBadge status={row.status || session.status} /></td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">No earning breakdown available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-100 px-4 py-3">
                <h4 className="font-bold text-slate-900">History</h4>
              </div>
              <div className="max-h-80 overflow-auto p-4">
                {history.length ? (
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div key={item.id || index} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold capitalize text-slate-800">{String(item.type || item.action || item.status || 'update').replace(/_/g, ' ')}</p>
                          <span className="text-xs text-slate-500">{formatDate(item.createdAt || item.timestamp || item.at)}</span>
                        </div>
                        {item.amountPaise || item.amount ? (
                          <p className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(item.amountPaise ?? item.amount)}</p>
                        ) : null}
                        {item.note || item.adminNote ? (
                          <p className="mt-1 text-sm text-slate-500">{item.note || item.adminNote}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-slate-500">No history available for this session.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
  </div>
);

export default EarningsDashboard;
