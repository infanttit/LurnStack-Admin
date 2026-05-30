import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { fetchAdminStudents, deleteStudent, bulkDeleteStudents } from '../api/adminDashboard';
import AdminDataTable from '../components/AdminDataTable';
import ErrorBanner from '../components/ErrorBanner';
import { getApiErrorMessage } from '../api/axiosClient';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetchAdminStudents();

      if (!response?.success) {
        throw new Error('Failed to load students data');
      }

      setStudents(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to fetch student records'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }
    setActionInProgress((prev) => ({ ...prev, [studentId]: true }));
    try {
      await deleteStudent(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete student'));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleBulkDelete = async () => {
    if (confirmationText !== 'DELETE ALL STUDENTS') {
      setError('Incorrect confirmation text.');
      return;
    }

    setIsDeletingAll(true);
    setError('');
    try {
      const response = await bulkDeleteStudents();
      if (response?.success) {
        setStudents([]);
        setShowConfirmModal(false);
        setConfirmationText('');
      } else {
        throw new Error(response?.message || 'Failed to bulk delete students');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete all students'));
    } finally {
      setIsDeletingAll(false);
    }
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => handleDelete(row.id)}
        disabled={actionInProgress[row.id]}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Delete student"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students Management</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage all registered student accounts.</p>
        </div>
        <div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Students</span>
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <AdminDataTable
        title="All Students"
        description="Complete list of registered student accounts with contact information and join dates."
        rows={students}
        loading={isLoading}
        error={error}
        renderActions={renderActions}
        enablePdfExport
        exportFilename="students-records"
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-transform duration-300 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h2 className="text-lg font-bold">Danger Zone: Bulk Delete</h2>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmationText('');
                }}
                disabled={isDeletingAll}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  This operation is <strong className="text-red-600">permanent and destructive</strong>.
                </p>
                <p>
                  Deleting all student accounts will remove all student records, active bookings, session attendance histories, and related dashboard stats.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Before executing, make sure you have backed up current records if necessary.</span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type <span className="text-red-600 font-bold select-all">DELETE ALL STUDENTS</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-mono"
                  placeholder="DELETE ALL STUDENTS"
                  disabled={isDeletingAll}
                  autoComplete="off"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmationText('');
                  }}
                  disabled={isDeletingAll}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={confirmationText !== 'DELETE ALL STUDENTS' || isDeletingAll}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isDeletingAll ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete All Students</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
