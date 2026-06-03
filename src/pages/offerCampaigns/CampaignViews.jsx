import React, { useState, useEffect, useMemo } from 'react';
import { BadgePercent, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Metric } from './Fields';
import { statusStyles } from './constants';

export const CampaignsView = ({ campaigns, onCreate, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  // Filter campaigns by search term and date
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      // 1. Search Term Filter
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        campaign.name.toLowerCase().includes(query) ||
        campaign.offerTitle.toLowerCase().includes(query) ||
        (campaign.target && campaign.target.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Date Filter
      if (dateFilter === 'all') return true;

      const rawDate = campaign.raw?.createdAt || campaign.updatedAt || campaign.raw?.updatedAt;
      if (!rawDate || rawDate === '-') return false;
      
      const createdAt = new Date(rawDate);
      if (isNaN(createdAt.getTime())) return false;

      if (dateFilter === 'today') {
        const today = new Date();
        return createdAt.getDate() === today.getDate() &&
               createdAt.getMonth() === today.getMonth() &&
               createdAt.getFullYear() === today.getFullYear();
      }

      if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return createdAt.getDate() === yesterday.getDate() &&
               createdAt.getMonth() === yesterday.getMonth() &&
               createdAt.getFullYear() === yesterday.getFullYear();
      }

      if (dateFilter === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return createdAt >= startOfWeek && createdAt <= endOfWeek;
      }

      if (dateFilter === 'month') {
        const today = new Date();
        return createdAt.getMonth() === today.getMonth() &&
               createdAt.getFullYear() === today.getFullYear();
      }

      return true;
    });
  }, [campaigns, searchTerm, dateFilter]);

  const totalEntries = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedCampaigns = useMemo(() => {
    return filteredCampaigns.slice(startIndex, endIndex);
  }, [filteredCampaigns, startIndex, endIndex]);

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const items = new Set([1, totalPages]);
    for (let p = activePage - 1; p <= activePage + 1; p += 1) {
      if (p > 1 && p < totalPages) items.add(p);
    }
    const sorted = Array.from(items).sort((a, b) => a - b);

    const withGaps = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && current - prev > 1) withGaps.push('gap');
      withGaps.push(current);
    }
    return withGaps;
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Campaign Workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Manage drafts, ready campaigns, and sent campaign records.</p>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
          <BadgePercent className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 md:flex-row md:items-center md:justify-between bg-slate-50/50">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all outline-none text-slate-700 font-medium"
              placeholder="Search campaigns, offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing {totalEntries ? startIndex + 1 : 0} to {endIndex} of {totalEntries} campaigns
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white text-xs uppercase text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3 font-semibold">Campaign</th>
              <th className="px-5 py-3 font-semibold">Target</th>
              <th className="px-5 py-3 font-semibold">Recipients</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedCampaigns.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500 font-medium">
                  No campaigns found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedCampaigns.map((campaign) => {
                const showActions = campaign.status === 'Draft' || campaign.status === 'Ready';
                return (
                  <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{campaign.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{campaign.offerTitle}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{campaign.target}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{campaign.recipients}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[campaign.status] || statusStyles.Draft}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{campaign.updatedAt}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {showActions && (
                          <>
                            <button type="button" onClick={() => onEdit(campaign)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-400">
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button type="button" onClick={() => onDelete(campaign.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-600 hover:border-red-400">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalEntries > 0 && (
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-600">
          <div className="text-xs font-medium text-slate-500">
            Showing {totalEntries ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={activePage <= 1 || totalEntries === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageItems().map((item, idx) =>
                item === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-2 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-[36px] px-3 py-1.5 border rounded-lg hover:bg-slate-50 transition-colors font-semibold ${
                      item === activePage
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={activePage >= totalPages || totalEntries === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export const HistoryView = ({ history, onCreate }) => (
  <section className="rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Delivery History</h2>
        <p className="mt-1 text-sm text-slate-500">ZeptoMail delivery results will appear here after backend integration.</p>
      </div>
      <button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
        <BadgePercent className="h-4 w-4" />
        New Campaign
      </button>
    </div>
    <div className="divide-y divide-slate-100">
      {history.map((item) => (
        <article key={item.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.sentAt}</p>
          </div>
          <Metric label="Recipients" value={item.recipients} />
          <Metric label="Sent" value={item.sent} tone="green" />
          <Metric label="Failed" value={item.failed} tone={item.failed ? 'red' : 'slate'} />
        </article>
      ))}
    </div>
  </section>
);
