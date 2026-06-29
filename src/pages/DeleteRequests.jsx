import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Check,
  X as XIcon
} from 'lucide-react';
import { axiosClient } from '../api/axiosClient';

const DeleteRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [sessionToReject, setSessionToReject] = useState(null);

  const fetchDeleteRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get('/api/admin/sessions/delete-requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch delete requests.');
      toast.error(err.response?.data?.message || 'Failed to fetch delete requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleteRequests();
  }, []);

  const handleApprove = async (sessionId) => {
    if (!window.confirm("Are you sure you want to approve this request? The session will be PERMANENTLY deleted.")) return;
    
    setProcessingId(sessionId);
    try {
      await axiosClient.post(`/api/admin/sessions/${sessionId}/approve-delete`);
      toast.success('Session permanently deleted.');
      fetchDeleteRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve delete request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (sessionId) => {
    setSessionToReject(sessionId);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (rejectReason.trim() === "") {
      toast.error("A reason is required to reject the request.");
      return;
    }

    setProcessingId(sessionToReject);
    setRejectModalOpen(false);
    try {
      await axiosClient.post(`/api/admin/sessions/${sessionToReject}/reject-delete`, { reason: rejectReason.trim() });
      toast.success('Delete request rejected. Session remains active.');
      fetchDeleteRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject delete request.');
    } finally {
      setProcessingId(null);
      setSessionToReject(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-rose-500" />
            Session Deletion Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and manage requests from trainers to delete their sessions.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>{requests.length} Pending Request{requests.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-semibold">Loading delete requests...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-6 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-rose-900">Unable to load requests</h3>
          <p className="text-sm text-rose-700">{error}</p>
          <button 
            onClick={fetchDeleteRequests}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Retry Loading
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">All Caught Up!</h3>
          <p className="text-sm text-slate-500">
            There are currently no session deletion requests from trainers.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Session Details</th>
                  <th className="px-6 py-4">Trainer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{session.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{session.courseTitle || session.category || "General Session"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{session.trainer?.fullName || 'N/A'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{session.trainer?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                        Pending Deletion
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(session.id)}
                          disabled={processingId === session.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 text-rose-600 px-3 py-1.5 font-medium hover:bg-rose-100 transition disabled:opacity-50"
                        >
                          {processingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(session.id)}
                          disabled={processingId === session.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                        >
                          {processingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XIcon className="w-4 h-4" />}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Reject Deletion Request
              </h3>
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Please provide a reason for rejecting this deletion request. The trainer will see this message.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., You must complete the remaining 5 hours before ending..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm resize-y"
                autoFocus
              />
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteRequests;
