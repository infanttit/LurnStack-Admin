import React from 'react';
import { Trash2, X } from 'lucide-react';

const DeleteCourseModal = ({ sessionToDelete, deletingSessions, closeDeleteModal, confirmDeleteSession }) => {
  if (!sessionToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Delete Session</h2>
              <p className="mt-1 text-sm text-slate-500">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={deletingSessions[sessionToDelete.id]}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close delete confirmation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{sessionToDelete.sessionTitle}</p>
            <p className="mt-1 text-sm text-slate-600">{sessionToDelete.courseName}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              ID: {sessionToDelete.id}
            </p>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Deleting this will remove the selected course session from the admin list and backend records.
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={deletingSessions[sessionToDelete.id]}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteSession}
            disabled={deletingSessions[sessionToDelete.id]}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {deletingSessions[sessionToDelete.id] ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Deleting
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCourseModal;
