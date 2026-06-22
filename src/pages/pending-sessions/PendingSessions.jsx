import React, { useEffect, useMemo, useState } from 'react';
import { fetchPendingSessionsApi, reviewSessionApi } from '../../api/liveClasses';
import { updateSessionPricing } from '../../api/billing';
import { getApiErrorMessage } from '../../api/axiosClient';
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
  ShieldAlert,
  Search,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import PricingModal from '../../components/PricingModal';
import PendingSessionsTable from './PendingSessionsTable';

const PAGE_SIZE = 10;

const safeText = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const safeLower = (value) => safeText(value).toLowerCase();

const getSessionId = (session, index = 0) => safeText(session?.id || session?._id || session?.sessionId, `session-${index}`);

const getSessionTitle = (session) => safeText(session?.title || session?.classTitle || session?.sessionTitle, 'Untitled Session');

const getTrainerName = (session) =>
  safeText(session?.trainerName || session?.instructor || session?.trainer?.name || session?.trainer?.fullName, 'N/A');

const getCategory = (session) =>
  safeText(session?.category || session?.courseName || session?.course?.name || session?.courseTitle, 'General');

const getSourceLabel = (session) => {
  const source = safeLower(session?.source);
  const sectionType = safeLower(session?.sectionType || session?.sessionType);
  const role = safeLower(session?.createdByRole);
  if (source.includes('admin_tit') || sectionType === 'tit' || role === 'admin') return 'Admin TIT';
  return 'Trainer';
};

const getScheduleText = (session) => {
  if (Array.isArray(session?.scheduledDates) && session.scheduledDates.length > 0) {
    const first = session.scheduledDates[0];
    const date = first?.date ? new Date(first.date) : null;
    const dateText = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : safeText(first?.date, 'TBD');
    return `${dateText}${first?.time ? ` at ${first.time}` : ''}`;
  }

  const date = safeText(session?.date || session?.scheduledDate || session?.startDate);
  const start = safeText(session?.startTime || session?.time);
  const end = safeText(session?.endsAt || session?.endTime);
  if (!date && !start) return 'TBD';
  return `${date || 'TBD'}${start ? `, ${start}${end ? ` - ${end}` : ''}` : ''}`;
};

const toDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSessionDateKey = (session) => {
  if (Array.isArray(session?.scheduledDates) && session.scheduledDates.length > 0) {
    return toDateKey(session.scheduledDates[0]?.date);
  }
  return toDateKey(session?.date || session?.scheduledDate || session?.startDate || session?.createdAt);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const PendingSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(1);
  
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

      // Step 2: Review and publish the session with WhatsApp configurations
      await reviewSessionApi(reviewingSession.id, {
        price: priceInSubunits,
        enableWhatsApp: pricingData.enableWhatsApp,
        whatsappTemplateName: pricingData.whatsappTemplateName || undefined,
        whatsappCustomTitle: pricingData.whatsappCustomTitle || undefined,
        whatsappButtonUrl: pricingData.whatsappButtonUrl || undefined,
      });
      
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

  const rows = useMemo(() => {
    return sessions.map((session, index) => ({
      session,
      id: getSessionId(session, index),
      title: getSessionTitle(session),
      trainerName: getTrainerName(session),
      category: getCategory(session),
      source: getSourceLabel(session),
      schedule: getScheduleText(session),
      dateKey: getSessionDateKey(session),
      description: safeText(session?.description, 'No description provided.'),
    }));
  }, [sessions]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const value = safeLower(query);
    const todayKey = toDateKey(new Date());
    const yesterdayKey = toDateKey(addDays(new Date(), -1));
    return rows.filter((row) => {
      const matchesQuery =
        !value ||
        safeLower(row.title).includes(value) ||
        safeLower(row.trainerName).includes(value) ||
        safeLower(row.category).includes(value) ||
        safeLower(row.id).includes(value) ||
        safeLower(row.description).includes(value);
      const matchesSource = sourceFilter === 'all' || row.source === sourceFilter;
      const matchesCategory = categoryFilter === 'all' || row.category === categoryFilter;
      const matchesDate =
        datePreset === 'all' ||
        (datePreset === 'today' && row.dateKey === todayKey) ||
        (datePreset === 'yesterday' && row.dateKey === yesterdayKey) ||
        (datePreset === 'custom' && customDate && row.dateKey === customDate);
      return matchesQuery && matchesSource && matchesCategory && matchesDate;
    });
  }, [rows, query, sourceFilter, categoryFilter, datePreset, customDate]);

  useEffect(() => {
    setPage(1);
  }, [query, sourceFilter, categoryFilter, datePreset, customDate]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  const startIndex = totalEntries ? (page - 1) * PAGE_SIZE : 0;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const filtersActive = query || sourceFilter !== 'all' || categoryFilter !== 'all' || datePreset !== 'all' || customDate;

  const clearFilters = () => {
    setQuery('');
    setSourceFilter('all');
    setCategoryFilter('all');
    setDatePreset('all');
    setCustomDate('');
  };

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const items = new Set([1, totalPages]);
    for (let p = page - 1; p <= page + 1; p += 1) {
      if (p > 1 && p < totalPages) items.add(p);
    }
    const sorted = Array.from(items).sort((a, b) => a - b);
    const withGaps = [];
    sorted.forEach((item, index) => {
      if (index > 0 && item - sorted[index - 1] > 1) withGaps.push('gap');
      withGaps.push(item);
    });
    return withGaps;
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_190px_150px_150px_110px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search session, trainer, category, ID"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="Trainer">Trainer</option>
                <option value="Admin TIT">Admin TIT</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={datePreset}
                onChange={(event) => {
                  setDatePreset(event.target.value);
                  if (event.target.value !== 'custom') setCustomDate('');
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom Date</option>
              </select>

              <input
                type="date"
                value={customDate}
                onChange={(event) => {
                  setCustomDate(event.target.value);
                  setDatePreset(event.target.value ? 'custom' : 'all');
                }}
                disabled={datePreset !== 'custom'}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button
                type="button"
                onClick={clearFilters}
                disabled={!filtersActive}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          <PendingSessionsTable
            paginatedRows={paginatedRows}
            startIndex={startIndex}
            openReviewModal={openReviewModal}
          />

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {totalEntries ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || totalEntries === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {getPageItems().map((item, index) =>
                  item === 'gap' ? (
                    <span key={`gap-${index}`} className="px-2 text-slate-400">...</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      disabled={totalEntries === 0}
                      className={`min-w-[36px] rounded-lg border px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                        item === page ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page >= totalPages || totalEntries === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
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

