import React, { useEffect, useState } from 'react';
import { Trash2, X, Mail, Phone, Calendar, User as UserIcon } from 'lucide-react';
import { fetchAdminTrainers, updateTrainer, deleteTrainer } from '../../api/adminDashboard';
import AdminDataTable from '../../components/AdminDataTable';
import StatusToggleSwitch from '../../components/StatusToggleSwitch';
import ErrorBanner from '../../components/ErrorBanner';
import { getApiErrorMessage } from '../../api/axiosClient';

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState({});
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);

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

  const handleDeleteClick = (trainerId) => {
    setTrainerToDelete(trainerId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!trainerToDelete) return;
    
    setIsDeleteModalOpen(false);
    setActionInProgress((prev) => ({ ...prev, [trainerToDelete]: true }));
    try {
      await deleteTrainer(trainerToDelete);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete trainer'));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [trainerToDelete]: false }));
      setTrainerToDelete(null);
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
        onClick={() => handleDeleteClick(row.id)}
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
        enablePdfExport
        exportFilename="trainers-records"
        onRowProfileClick={(row) => {
          setSelectedTrainer(row);
          setIsViewModalOpen(true);
        }}
      />

      {/* Trainer Profile Modal */}
      {isViewModalOpen && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8 relative">
              <div className="flex justify-center -mt-16 mb-4">
                <div className="relative p-1.5 bg-white rounded-full">
                  {selectedTrainer.profilePhotoUrl ? (
                    <img
                      src={selectedTrainer.profilePhotoUrl}
                      alt={selectedTrainer.fullName}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <UserIcon className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div
                    className={`absolute bottom-3 right-3 w-4 h-4 rounded-full border-2 border-white ${
                      selectedTrainer.isActive ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    title={selectedTrainer.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">{selectedTrainer.fullName}</h2>
                <p className="text-slate-500 font-medium mt-1">
                  {selectedTrainer.isActive ? 'Active Trainer' : 'Inactive Trainer'}
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Personal Details
                </h3>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Email Address</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedTrainer.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedTrainer.phoneNumber || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Joined Date</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedTrainer.createdAt
                        ? new Date(selectedTrainer.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Trainer</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to delete this trainer? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTrainerToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;

