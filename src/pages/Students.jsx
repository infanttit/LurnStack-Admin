import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { fetchAdminStudents, deleteStudent } from '../api/adminDashboard';
import AdminDataTable from '../components/AdminDataTable';
import ErrorBanner from '../components/ErrorBanner';
import { getApiErrorMessage } from '../api/axiosClient';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState({});

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Students Management</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage all registered student accounts.</p>
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
    </div>
  );
};

export default Students;
