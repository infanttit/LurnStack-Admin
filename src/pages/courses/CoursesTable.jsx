import React from 'react';
import { Calendar, Clock, Image as ImageIcon, Trash2, UserCheck, Video } from 'lucide-react';
import { resolveAssetUrl } from '../../api/axiosClient';

const CoursesTable = ({
  paginatedSessions,
  startIndex,
  getStatusStyles,
  openDeleteModal,
  deletingSessions,
}) => {
  return (
    <div className="w-full">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[4%]" />
          <col className="w-[15%]" />
          <col className="w-[28%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[9%]" />
          <col className="w-[6%]" />
          <col className="w-[6%]" />
        </colgroup>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3 font-semibold">No.</th>
            <th className="px-3 py-3 font-semibold">Course</th>
            <th className="px-3 py-3 font-semibold">Session</th>
            <th className="hidden px-3 py-3 font-semibold md:table-cell">Trainer</th>
            <th className="px-3 py-3 font-semibold">Date</th>
            <th className="hidden px-3 py-3 font-semibold xl:table-cell">Time</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 text-center font-semibold">Meet</th>
            <th className="px-3 py-3 text-center font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedSessions.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                No course sessions found.
              </td>
            </tr>
          ) : (
            paginatedSessions.map((session, index) => (
              <tr key={`${session.id}-${startIndex + index}`} className="align-middle hover:bg-slate-50">
                <td className="px-3 py-4 text-center font-semibold text-slate-900">{startIndex + index + 1}</td>
                <td className="px-3 py-4 align-middle">
                  <p className="truncate font-semibold text-slate-800" title={session.courseName}>
                    {session.courseName}
                  </p>
                </td>
                <td className="px-3 py-4 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:flex">
                      {session.thumbnail ? (
                        <img src={resolveAssetUrl(session.thumbnail)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900" title={session.sessionTitle}>
                        {session.sessionTitle}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500" title={session.description}>
                        {session.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-4 align-middle text-slate-700 md:table-cell">
                  <span className="flex min-w-0 items-center gap-2">
                    <UserCheck className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate" title={session.instructor}>{session.instructor}</span>
                  </span>
                </td>
                <td className="px-3 py-4 align-middle text-slate-700">
                  <span className="flex min-w-0 items-center gap-2">
                    <Calendar className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
                    <span className="truncate">{session.date || '-'}</span>
                  </span>
                </td>
                <td className="hidden px-3 py-4 align-middle text-slate-700 xl:table-cell">
                  <span className="flex min-w-0 items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {session.time || '-'} <span className="text-slate-400">({session.duration})</span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-4 align-middle">
                  <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-xs font-bold ${getStatusStyles(session.status)}`}>
                    <span className="truncate">
                    {session.status}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-4 text-center align-middle">
                  {session.meetLink ? (
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                      title={session.meetLink}
                    >
                      <Video className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-4 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => openDeleteModal(session)}
                    disabled={!session.id || deletingSessions[session.id]}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title={session.id ? `Delete ${session.sessionTitle}` : 'Session ID missing'}
                  >
                    {deletingSessions[session.id] ? (
                      <span className="h-4 w-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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

export default CoursesTable;
