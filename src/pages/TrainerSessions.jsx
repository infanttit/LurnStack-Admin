import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, IndianRupee, KeyRound, Plus, RefreshCw, Video } from 'lucide-react';
import { createTrainerSession, fetchTrainerSessions } from '../api/trainerSessions';
import { getApiErrorMessage, trainerTokenStorage } from '../api/axiosClient';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import logoImage from '../Assets/Logo/Logo2.png';

const initialForm = {
  courseId: '',
  title: '',
  startTime: '',
  endTime: '',
  meetingLink: '',
  isRecurring: false,
  recurrenceType: 'daily',
};

const unwrapSessions = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.sessions)) return json.sessions;
  if (Array.isArray(json?.items)) return json.items;
  return [];
};

const getPricingBadge = (session) => {
  const publishState = String(session?.publishState || '').toUpperCase();
  const pricingState = String(session?.pricingState || '').toUpperCase();

  if (publishState === 'DRAFT' || pricingState === 'PENDING_PRICE') {
    return { label: 'Pending Admin Review', color: 'yellow', icon: Clock3 };
  }

  if (publishState === 'PUBLISHED' && pricingState === 'PRICED') {
    const price = Number(session?.priceInPaise || session?.amountPaise || 0) / 100;
    return {
      label: `Published - Rs.${price.toFixed(2)}`,
      color: 'blue',
      icon: IndianRupee,
    };
  }

  if (publishState === 'PUBLISHED' && pricingState === 'FREE') {
    return { label: 'Published - Free', color: 'green', icon: CheckCircle2 };
  }

  return { label: 'Pending Admin Review', color: 'yellow', icon: Clock3 };
};

const badgeStyles = {
  yellow: 'border-amber-200 bg-amber-50 text-amber-800',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
};

const formatTimeRange = (session) => {
  const start = session?.startTime || session?.start_time || '-';
  const end = session?.endTime || session?.end_time || '-';
  return `${start} - ${end}`;
};

const TrainerSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [tokenDraft, setTokenDraft] = useState(() => trainerTokenStorage.get());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aDate = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
      const bDate = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
      return bDate - aDate;
    });
  }, [sessions]);

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await fetchTrainerSessions();
      setSessions(unwrapSessions(json));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to fetch trainer sessions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const saveToken = () => {
    trainerTokenStorage.set(tokenDraft.trim());
    setSuccess('Trainer token saved locally.');
    loadSessions();
  };

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.courseId.trim()) return 'Course ID is required';
    if (!form.title.trim()) return 'Session title is required';
    if (!form.startTime) return 'Start time is required';
    if (!form.endTime) return 'End time is required';
    if (!form.meetingLink.trim()) return 'Meeting link is required';
    return '';
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        courseId: form.courseId.trim(),
        title: form.title.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        meetingLink: form.meetingLink.trim(),
        isRecurring: form.isRecurring,
        recurrenceType: form.isRecurring ? form.recurrenceType : undefined,
      };
      const json = await createTrainerSession(payload);
      const createdSession = json?.data || json?.session || json;
      setSessions((prev) => [createdSession, ...prev]);
      setForm(initialForm);
      setSuccess('Session created! Waiting for admin review.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create trainer session'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="LurnStack" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Trainer Sessions</h1>
              <p className="text-sm text-slate-500">Create sessions and track admin pricing review status.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-screen-2xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Trainer API Token</h2>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={tokenDraft}
                onChange={(event) => setTokenDraft(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                placeholder="Paste trainer JWT token"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={saveToken}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Token
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Create Session</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Course ID</label>
                <input
                  name="courseId"
                  value={form.courseId}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="category-uuid"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Advanced Node.js"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Start Time</label>
                  <input
                    name="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={onChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">End Time</label>
                  <input
                    name="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={onChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Meeting Link</label>
                <input
                  name="meetingLink"
                  value={form.meetingLink}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meet.google.com/abc"
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  name="isRecurring"
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Recurring session
              </label>

              {form.isRecurring ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Recurrence</label>
                  <select
                    name="recurrenceType"
                    value={form.recurrenceType}
                    onChange={onChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              ) : null}

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Price will be set by admin after review.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating Session...' : 'Create Session'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">My Sessions</h2>
            <p className="mt-1 text-sm text-slate-500">Pricing Status shows admin review and publish state.</p>
          </div>

          <div className="p-5">
            {error ? <ErrorBanner message={error} /> : null}
            {success ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{success}</div> : null}

            {loading ? (
              <LoadingSpinner label="Loading trainer sessions..." />
            ) : sortedSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                No trainer sessions found.
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedSessions.map((session, index) => {
                  const badge = getPricingBadge(session);
                  const BadgeIcon = badge.icon;
                  return (
                    <article key={session?.id || session?._id || index} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{session?.title || 'Untitled Session'}</h3>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock className="h-4 w-4" />
                              {formatTimeRange(session)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Video className="h-4 w-4" />
                              {session?.meetingLink ? 'Meeting link added' : 'No meeting link'}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles[badge.color]}`}>
                          <BadgeIcon className="h-3.5 w-3.5" />
                          {badge.label}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrainerSessions;
