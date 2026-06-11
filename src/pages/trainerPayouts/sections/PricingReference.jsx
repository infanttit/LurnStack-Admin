import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { StatusBadge } from '../components/Shared';
import { formatCurrency, formatDate } from '../utils';

const PricingReference = ({ pricing }) => {
  const resetFilters = () => {
    pricing.setFilters({ query: '', trainer: 'all', priceType: 'all', status: 'all', from: '', to: '' });
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Session Pricing Reference</h2>
          <p className="mt-1 text-sm text-slate-500">
            Read-only pricing data from the existing Pending Session Reviews / Set Pricing & Publish flow.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          Pricing changes are managed in Pending Reviews, not here.
        </div>
      </div>

      {pricing.error ? (
        <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{pricing.error}</div>
      ) : null}

      <div className="border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-7">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={pricing.filters.query}
              onChange={(event) => pricing.setFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Search session or trainer"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <select value={pricing.filters.trainer} onChange={(event) => pricing.setFilters((prev) => ({ ...prev, trainer: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All trainers</option>
            {pricing.trainerOptions.map((trainerName) => <option key={trainerName} value={trainerName}>{trainerName}</option>)}
          </select>
          <select value={pricing.filters.priceType} onChange={(event) => pricing.setFilters((prev) => ({ ...prev, priceType: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All price types</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="not_set">Not set</option>
          </select>
          <div className="flex gap-2 lg:col-span-2">
            <input type="date" value={pricing.filters.from} onChange={(event) => pricing.setFilters((prev) => ({ ...prev, from: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" title="From date" />
            <input type="date" value={pricing.filters.to} onChange={(event) => pricing.setFilters((prev) => ({ ...prev, to: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" title="To date" />
          </div>
          <div className="flex gap-2">
            <select value={pricing.filters.status} onChange={(event) => pricing.setFilters((prev) => ({ ...prev, status: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">All status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" title="Clear pricing filters">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1020px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Configured Price</th>
              <th className="px-4 py-3">Trainer Share</th>
              <th className="px-4 py-3">Platform Share</th>
              <th className="px-4 py-3">Paid Students</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Pricing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pricing.loading ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-sm font-medium text-slate-500">Loading admin session pricing...</td></tr>
            ) : pricing.filteredRows.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-sm font-medium text-slate-500">No session pricing records match the selected filters.</td></tr>
            ) : (
              pricing.rows.map((row, index) => (
                <tr key={`${row.id || 'pricing'}-${pricing.startIndex + index}`} className={`hover:bg-slate-50 ${!row.hasPricing ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.title}</td>
                  <td className="px-4 py-3 text-slate-600">{row.trainerName}</td>
                  <td className="px-4 py-3 font-semibold">
                    {row.hasPricing ? (row.isFreeSession ? <span className="text-emerald-700">Free</span> : formatCurrency(row.price)) : <span className="text-amber-700">Not set</span>}
                  </td>
                  <td className="px-4 py-3">{row.trainerShare}%</td>
                  <td className="px-4 py-3">{row.platformShare}%</td>
                  <td className="px-4 py-3">{row.paidStudents}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(row.dateValue)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!pricing.loading && pricing.filteredRows.length > 0 ? (
        <PricingPagination pricing={pricing} />
      ) : null}
    </section>
  );
};

const PricingPagination = ({ pricing }) => (
  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
    <div>
      Showing <span className="font-semibold text-slate-900">{pricing.startIndex + 1}</span> to{' '}
      <span className="font-semibold text-slate-900">{pricing.endIndex}</span> of{' '}
      <span className="font-semibold text-slate-900">{pricing.totalEntries}</span> sessions
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => pricing.setPage((page) => Math.max(1, page - 1))} disabled={pricing.activePage <= 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
        <ChevronLeft className="h-3.5 w-3.5" /> Prev
      </button>
      <div className="flex items-center gap-1">
        {pricing.pageItems.map((item, index) =>
          item === 'gap' ? (
            <span key={`pricing-gap-${index}`} className="px-1 text-slate-400">...</span>
          ) : (
            <button key={item} type="button" onClick={() => pricing.setPage(item)} className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition-colors ${item === pricing.activePage ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {item}
            </button>
          )
        )}
      </div>
      <button type="button" onClick={() => pricing.setPage((page) => Math.min(pricing.totalPages, page + 1))} disabled={pricing.activePage >= pricing.totalPages} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

export default PricingReference;
