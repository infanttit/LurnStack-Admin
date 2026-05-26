import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';
import { downloadRowsAsPdf } from '../utils/pdfExport';
import logoImage from '../Assets/Logo/Logo2.png';

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


const getRowId = (row, index) => String(row?.id ?? row?._id ?? row?.email ?? index);

const AdminDataTable = ({ title, description, rows = [], loading, error, renderActions, enablePdfExport = false, exportFilename }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [exportScope, setExportScope] = useState('page');
  const [exporting, setExporting] = useState(false);
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

  useEffect(() => {
    const availableIds = new Set(rows.map((row, index) => getRowId(row, index)));
    setSelectedRowIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [rows]);

  const selectedIdSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
  const selectedRows = useMemo(
    () => rows.filter((row, index) => selectedIdSet.has(getRowId(row, index))),
    [rows, selectedIdSet]
  );

  const pageRowIds = paginatedRows.map((row, index) => getRowId(row, startIndex + index));
  const allPageRowsSelected = pageRowIds.length > 0 && pageRowIds.every((id) => selectedIdSet.has(id));

  const toggleRowSelection = (row, rowIndex) => {
    const rowId = getRowId(row, rowIndex);
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const togglePageSelection = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allPageRowsSelected) {
        pageRowIds.forEach((id) => next.delete(id));
      } else {
        pageRowIds.forEach((id) => next.add(id));
      }
      return Array.from(next);
    });
  };

  const exportColumns = [
    { label: 'No.', key: '__serialNumber', width: 0.45 },
    { label: 'Full Name', key: 'fullName', width: 1.5 },
    { label: 'Email', key: 'email', width: 2 },
    { label: 'Phone', key: 'phoneNumber', width: 1.2 },
    { label: 'Joined', width: 1, value: (row) => formatJoinedDate(row.createdAt) },
  ];

  const getExportRows = (scope) => {
    if (scope === 'selected') return selectedRows;
    if (scope === 'last50') return rows.slice(-50);
    if (scope === 'last100') return rows.slice(-100);
    if (scope === 'all') return rows;
    return paginatedRows;
  };

  const getExportLabel = (scope) => {
    if (scope === 'selected') return 'Selected records';
    if (scope === 'last50') return 'Last 50 records';
    if (scope === 'last100') return 'Last 100 records';
    if (scope === 'all') return 'All records';
    return `Page ${activePage} records`;
  };

  const handlePdfExport = async () => {
    const exportRows = getExportRows(exportScope).map((row, index) => ({
      ...row,
      __serialNumber: index + 1,
    }));
    if (!exportRows.length) return;

    setExporting(true);
    try {
      await downloadRowsAsPdf({
        title,
        filename: `${exportFilename || title}-${exportScope}`,
        columns: exportColumns,
        rows: exportRows,
        logoUrl: logoImage,
        rangeLabel: getExportLabel(exportScope),
      });
    } finally {
      setExporting(false);
    }
  };

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
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          {enablePdfExport ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={exportScope}
                onChange={(event) => setExportScope(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"
              >
                <option value="page">Current page</option>
                <option value="selected">Selected records</option>
                <option value="last50">Last 50 records</option>
                <option value="last100">Last 100 records</option>
                <option value="all">All records</option>
              </select>
              <button
                type="button"
                onClick={handlePdfExport}
                disabled={loading || exporting || getExportRows(exportScope).length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{exporting ? 'Preparing...' : 'Download PDF'}</span>
              </button>
            </div>
          ) : null}
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
                  {enablePdfExport ? (
                    <th className="px-4 py-3 font-medium text-gray-500 w-12">
                      <input
                        type="checkbox"
                        checked={allPageRowsSelected}
                        onChange={togglePageSelection}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label="Select visible rows"
                      />
                    </th>
                  ) : null}
                  <th className="px-4 py-3 font-medium text-gray-500 w-12">No.</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Full Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Joined</th>
                  {renderActions ? <th className="px-4 py-3 font-medium text-gray-500 text-center w-40">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedRows.map((row, index) => {
                  const rowIndex = startIndex + index;
                  const rowId = getRowId(row, rowIndex);
                  return (
                  <tr key={rowId} className="hover:bg-slate-50 transition-colors">
                    {enablePdfExport ? (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIdSet.has(rowId)}
                          onChange={() => toggleRowSelection(row, rowIndex)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Select ${row.fullName || 'record'}`}
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-4 font-medium text-slate-900">{startIndex + index + 1}</td>
                    <td className="px-4 py-4 text-slate-700">{row.fullName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{row.email || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{row.phoneNumber || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{formatJoinedDate(row.createdAt)}</td>
                    {renderActions ? (
                      <td className="px-4 py-4 text-center align-middle">{renderActions(row, index)}</td>
                    ) : null}
                  </tr>
                  );
                })}
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
