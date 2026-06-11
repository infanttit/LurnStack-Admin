import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, Search } from 'lucide-react';
import { StatusBadge } from '../components/Shared';
import { formatCurrency, formatDate } from '../utils';

const ManualCompletion = ({
  payouts,
  completionTarget,
  completablePayouts,
  setSelectedPayoutId,
  completionForm,
  setCompletionForm,
  onMarkProcessing,
  onCompletePayout,
}) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const [filters, setFilters] = useState({ query: '', status: 'all' });

  const rows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return completablePayouts.filter((payout) => {
      const matchesQuery =
        !query ||
        payout.trainerName.toLowerCase().includes(query) ||
        String(payout.accountSnapshot || '').toLowerCase().includes(query) ||
        String(payout.utr || '').toLowerCase().includes(query);
      const matchesStatus = filters.status === 'all' || payout.status === filters.status;
      return matchesQuery && matchesStatus;
    });
  }, [completablePayouts, filters]);

  const openCompletion = (payoutId) => {
    setSelectedPayoutId(payoutId);
    setShowCompletion(true);
  };

  if (showCompletion) {
    return (
      <CompletionDetail
        completionForm={completionForm}
        completionTarget={completionTarget}
        onBack={() => setShowCompletion(false)}
        onCompletePayout={onCompletePayout}
        onMarkProcessing={onMarkProcessing}
        setCompletionForm={setCompletionForm}
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Manual Payout Completion</h2>
          <p className="mt-1 text-sm text-slate-500">Review approved or processing payouts and mark manual bank transfers as paid.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500">{completablePayouts.length} completion record{completablePayouts.length === 1 ? '' : 's'}</div>
      </div>
      <div className="border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Search trainer, account, UTR"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All status</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
          </select>
          <button type="button" onClick={() => setFilters({ query: '', status: 'all' })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Requested Date</th>
              <th className="px-4 py-3">Paid Date</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Account Snapshot</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-sm font-medium text-slate-500">No manual payout completion records match the selected filters.</td></tr>
            ) : rows.map((payout, index) => (
              <tr key={`${payout.id || 'completion'}-${index}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{payout.trainerName}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(payout.requestedAmount)}</td>
                <td className="px-4 py-3">{formatDate(payout.requestedDate)}</td>
                <td className="px-4 py-3">{formatDate(payout.paidDate)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{payout.utr || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{payout.accountSnapshot}</td>
                <td className="px-4 py-3"><StatusBadge status={payout.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openCompletion(payout.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Eye className="h-3.5 w-3.5" />
                    {payout.status === 'paid' ? 'View' : 'Complete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const CompletionDetail = ({
  completionForm,
  completionTarget,
  onBack,
  onCompletePayout,
  onMarkProcessing,
  setCompletionForm,
}) => (
  <section className="space-y-4">
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <ArrowLeft className="h-4 w-4" />
      Back to completion table
    </button>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">{completionTarget?.trainerName}</h2>
            <p className="mt-1 text-sm text-slate-500">Manual bank transfer completion</p>
          </div>
          <StatusBadge status={completionTarget?.status} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailField label="Amount" value={formatCurrency(completionTarget?.requestedAmount)} />
          <DetailField label="Available balance" value={formatCurrency(completionTarget?.availableBalance)} />
          <DetailField label="Requested date" value={formatDate(completionTarget?.requestedDate)} />
          <DetailField label="Paid date" value={formatDate(completionTarget?.paidDate)} />
          <DetailField label="Payout account snapshot" value={completionTarget?.accountSnapshot || '-'} wide />
          <DetailField label="Existing admin note" value={completionTarget?.adminNote || '-'} wide />
        </div>
      </div>
      <form onSubmit={onCompletePayout} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Completion Action</h3>
        <p className="mt-1 text-sm text-slate-500">Paid records are read-only.</p>
        <div className="mt-4 space-y-3">
          <input disabled={completionTarget?.status === 'paid'} value={completionTarget?.status === 'paid' ? completionTarget.utr : completionForm.utr} onChange={(event) => setCompletionForm((prev) => ({ ...prev, utr: event.target.value }))} placeholder="UTR / reference number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100" />
          <input disabled={completionTarget?.status === 'paid'} value={completionTarget?.status === 'paid' ? completionTarget.paidDate : completionForm.paidDate} onChange={(event) => setCompletionForm((prev) => ({ ...prev, paidDate: event.target.value }))} type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100" />
          <textarea disabled={completionTarget?.status === 'paid'} value={completionTarget?.status === 'paid' ? completionTarget.adminNote : completionForm.note} onChange={(event) => setCompletionForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Admin note" className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onMarkProcessing} disabled={!completionTarget || completionTarget.status === 'paid'} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Mark Processing</button>
          <button type="submit" disabled={!completionTarget || completionTarget.status === 'paid'} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300">Mark Paid</button>
        </div>
      </form>
    </div>
  </section>
);

const DetailField = ({ label, value, wide = false }) => (
  <div className={`rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 ${wide ? 'md:col-span-2' : ''}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

export default ManualCompletion;
