import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { fetchAdminTrainers, updateTrainer, deleteTrainer } from '../api/adminDashboard';
import AdminDataTable from '../components/AdminDataTable';
import StatusToggleSwitch from '../components/StatusToggleSwitch';
import ErrorBanner from '../components/ErrorBanner';
import { getApiErrorMessage } from '../api/axiosClient';

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState({});

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetchAdminTrainers();

      if (!response?.success) {
        throw new Error('Failed to load trainers data');
      }

      setTrainers(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to fetch trainer records'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (trainerId, newStatus) => {
    setActionInProgress((prev) => ({ ...prev, [trainerId]: true }));
    try {
      await updateTrainer(trainerId, { isActive: newStatus });
      setTrainers((prevTrainers) =>
        prevTrainers.map((trainer) =>
          trainer.id === trainerId ? { ...trainer, isActive: newStatus } : trainer
        )
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update trainer status'));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [trainerId]: false }));
    }
  };

  const handleDelete = async (trainerId) => {
    if (!window.confirm('Are you sure you want to delete this trainer? This action cannot be undone.')) {
      return;
    }
    setActionInProgress((prev) => ({ ...prev, [trainerId]: true }));
    try {
      await deleteTrainer(trainerId);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete trainer'));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [trainerId]: false }));
    }
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      <StatusToggleSwitch
        isActive={row.isActive ?? true}
        onChange={(newStatus) => handleToggleStatus(row.id, newStatus)}
        disabled={actionInProgress[row.id]}
      />
      <button
        onClick={() => handleDelete(row.id)}
        disabled={actionInProgress[row.id]}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Delete trainer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Trainers Management</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage all registered trainer accounts.</p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <AdminDataTable
        title="All Trainers"
        description="Complete list of registered trainer accounts with contact information and join dates."
        rows={trainers}
        loading={isLoading}
        error={error}
        renderActions={renderActions}
      />

      {/* Trainer edit modal removed — inline status toggle is used instead */}
    </div>
  );
};

export default Trainers;
