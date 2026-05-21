import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset page back to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter rows based on Name, Email, and Phone Number
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const query = searchTerm.toLowerCase().trim();
    return rows.filter((row) => {
      const name = String(row.fullName || '').toLowerCase();
      const email = String(row.email || '').toLowerCase();
      const phone = String(row.phoneNumber || '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [rows, searchTerm]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  
  // Guard the active page index
  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedRows = useMemo(() => {
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, startIndex, endIndex]);

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
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all outline-none"
            placeholder={`Search classes, students...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <LoadingSpinner label={`Loading ${title.toLowerCase()}...`} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : filteredRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-500">
            No {title.toLowerCase()} found matching your criteria.
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
                {paginatedRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{startIndex + index + 1}</td>
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

      {/* Pagination Controls */}
      {!loading && !error && filteredRows.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <div>
            Showing {totalEntries ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={activePage <= 1 || totalEntries === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageItems().map((item, idx) =>
                item === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-[36px] px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors ${
                      item === activePage
                        ? 'bg-blue-50 text-blue-700 border-blue-100 font-medium'
                        : 'border-gray-200 text-gray-700'
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
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
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

export default AdminDataTable;
