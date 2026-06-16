import React from 'react';
import { User, Tag, Calendar, Sparkles } from 'lucide-react';

const PendingSessionsTable = ({
  paginatedRows,
  startIndex,
  openReviewModal,
}) => {
  return (
    <div className="w-full">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[5%]" />
          <col className="w-[25%]" />
          <col className="w-[16%]" />
          <col className="w-[14%]" />
          <col className="w-[18%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-bold">No.</th>
            <th className="px-4 py-3 font-bold">Session</th>
            <th className="px-4 py-3 font-bold">Trainer</th>
            <th className="px-4 py-3 font-bold">Category</th>
            <th className="px-4 py-3 font-bold">Schedule</th>
            <th className="px-4 py-3 font-bold">Source</th>
            <th className="px-4 py-3 text-center font-bold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedRows.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                No pending sessions match the selected filters.
              </td>
            </tr>
          ) : (
            paginatedRows.map((row, index) => (
              <tr key={row.id} className="align-middle transition hover:bg-slate-50">
                <td className="px-4 py-4 font-bold text-slate-900">{startIndex + index + 1}</td>
                <td className="px-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        Pending Price
                      </span>
                      <span className="truncate font-mono text-[11px] text-slate-400">ID: {row.id.substring(0, 8)}</span>
                    </div>
                    <p className="mt-1 truncate font-bold text-slate-900" title={row.title}>{row.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500" title={row.description}>{row.description}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <User className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate" title={row.trainerName}>{row.trainerName}</span>
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate" title={row.category}>{row.category}</span>
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate" title={row.schedule}>{row.schedule}</span>
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                    row.source === 'Admin TIT' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {row.source}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => openReviewModal(row.session)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Review
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendingSessionsTable;
