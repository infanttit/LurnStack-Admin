import React, { useEffect, useState } from 'react';
import { fetchPendingSessionsApi, reviewSessionApi } from '../api/liveClasses';
import { updateSessionPricing } from '../api/billing';
import { getApiErrorMessage } from '../api/axiosClient';
import { toast } from 'react-toastify';
import { 
  Clock, 
  User, 
  Tag, 
  Calendar, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import PricingModal from '../components/PricingModal';

const PendingSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Review state
  const [reviewingSession, setReviewingSession] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchPendingSessionsApi();
      // Adjusting to API response structure - checking data or array fallback
      const dataList = response?.data || (Array.isArray(response) ? response : []);
      setSessions(dataList);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch pending sessions.'));
      toast.error(getApiErrorMessage(err, 'Failed to fetch pending sessions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSessions();
  }, []);

  const openReviewModal = (session) => {
    setReviewingSession(session);
  };

  const closeReviewModal = () => {
    if (isSubmitting) return;
    setReviewingSession(null);
  };

  const handlePublish = async (pricingData) => {
    if (!reviewingSession) return;

    setIsSubmitting(true);
    try {
      // Send price in subunits (paisa/cents), 0 for Free
      const priceInSubunits = Math.round(pricingData.price * 100);
      
      // Step 1: Update session pricing
      await updateSessionPricing(reviewingSession.id, {
        priceInPaise: priceInSubunits,
        trainerSharePercentage: pricingData.trainerSharePercentage,
        platformCommissionPercentage: pricingData.platformCommissionPercentage,
        currency: pricingData.currency
      });

      // Step 2: Review and publish the session
      await reviewSessionApi(reviewingSession.id, priceInSubunits);
      
      toast.success(`Session "${reviewingSession.title}" published successfully!`);
      closeReviewModal();
      // Reload list
      fetchPendingSessions();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to approve and publish session.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-amber-500" />
            Pending Session Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review sessions created by trainers, define their pricing model, and publish them to students.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>{sessions.length} Session{sessions.length !== 1 ? 's' : ''} Awaiting Review</span>
        </div>
      </div>

      {/* Info Alert Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Administrative Pricing Guard:</span> When a trainer creates a session, it remains unpublished and hidden from students until you assign a price (or set it to 0 for a free class) and authorize publishing. Setting the price automatically triggers any scheduled email notifications and reminders to prospective students.
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-semibold">Loading pending sessions...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-6 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-rose-900">Unable to load sessions</h3>
          <p className="text-sm text-rose-700">{error}</p>
          <button 
            onClick={fetchPendingSessions}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Retry Loading
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">All Caught Up!</h3>
          <p className="text-sm text-slate-500">
            There are currently no sessions waiting for pricing review. Excellent!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header & Main Info */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Price
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {session.id.toString().substring(0, 8)}...</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2" title={session.title}>
                    {session.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{session.description || 'No description provided.'}</p>
                </div>

                <hr className="border-slate-100" />

                {/* Details list */}
                <div className="space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Trainer: <strong className="text-slate-800 font-semibold">{session.trainerName || 'N/A'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Category: <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{session.category || 'General'}</span>
                    </span>
                  </div>

                  {session.scheduledDates && Array.isArray(session.scheduledDates) && session.scheduledDates.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <span className="font-bold text-slate-700 block">Scheduled Times:</span>
                        {session.scheduledDates.map((dateObj, idx) => (
                          <div key={idx} className="bg-slate-50/80 px-2 py-1 rounded border border-slate-100">
                            {new Date(dateObj.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {dateObj.time}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => openReviewModal(session)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Review & Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Pricing Modal */}
      <PricingModal
        isOpen={!!reviewingSession}
        session={reviewingSession}
        onClose={closeReviewModal}
        onSave={handlePublish}
        isSaving={isSubmitting}
      />
    </div>
  );
};

export default PendingSessions;
