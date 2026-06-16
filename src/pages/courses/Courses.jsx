import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Search,
  Trash2,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { deleteCourseSession, fetchCourseSessions } from '../../api/courseSessions';
import { getApiErrorMessage, resolveAssetUrl } from '../../api/axiosClient';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import CoursesTable from './CoursesTable';
import DeleteCourseModal from './DeleteCourseModal';

const PAGE_SIZE = 10;

const safeText = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const safeLower = (value) => safeText(value).toLowerCase();

const unwrapSessions = (json) => {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.sessions)) return json.data.sessions;
  if (Array.isArray(json?.data?.classes)) return json.data.classes;
  if (Array.isArray(json?.data?.liveClasses)) return json.data.liveClasses;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.sessions)) return json.sessions;
  if (Array.isArray(json?.classes)) return json.classes;
  if (Array.isArray(json?.liveClasses)) return json.liveClasses;
  if (Array.isArray(json?.items)) return json.items;
  return [];
};

const getStatus = (dateValue, explicitStatus) => {
  if (safeText(explicitStatus)) return safeText(explicitStatus);
  if (!dateValue) return 'Scheduled';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Scheduled';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date < today ? 'Completed' : 'Scheduled';
};

const getStatusStyles = (status) => {
  const value = safeLower(status);
  if (value.includes('complete')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (value.includes('live')) return 'bg-rose-50 text-rose-700 border-rose-100';
  if (value.includes('pending')) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-blue-50 text-blue-700 border-blue-100';
};

const normalizeSession = (session, index) => {
  if (!session || typeof session !== 'object' || Array.isArray(session)) return null;

  const courseName = safeText(
    session.courseName ||
      session.course?.name ||
      session.course?.title ||
      session.courseTitle ||
      session.categoryName ||
      session.category,
    'Unassigned Course'
  );
  const courseId = safeText(
    session.courseId ||
      session.course_id ||
      session.course?.id ||
      session.course?._id ||
      session.course?.courseId
  );
  const sessionTitle = safeText(
    session.classTitle || session.sessionTitle || session.title || session.name,
    'Untitled Session'
  );
  const instructor = safeText(
    session.instructor || session.trainerName || session.trainer?.name || session.trainer?.fullName,
    '-'
  );
  const date =
    safeText(session.date) ||
    safeText(session.scheduledDate) ||
    safeText(session.startDate) ||
    safeText(session.scheduledDates?.[0]?.date);
  const time =
    safeText(session.time) ||
    safeText(session.startTime) ||
    safeText(session.start_time) ||
    safeText(session.scheduledDates?.[0]?.startTime);
  const duration =
    safeText(session.duration) ||
    safeText(session.durationText) ||
    safeText(session.scheduledDates?.[0]?.duration, '-');
  const meetLink = safeText(session.meetLink || session.meetingLink || session.joinUrl || session.url);
  const thumbnail = safeText(session.thumbnail || session.image || session.coverImage || session.course?.thumbnail);
  const status = getStatus(date, session.status);
  const id = safeText(session.id || session._id || session.sessionId || session.liveSessionId, `session-${index}`);

  return {
    id,
    courseId,
    courseKey: courseId || courseName,
    courseName,
    sessionTitle,
    instructor,
    date,
    time,
    duration,
    meetLink,
    thumbnail,
    status,
    description: safeText(session.description || session.shortDescription, 'No description'),
    raw: session,
  };
};

const optionList = (rows, key) =>
  Array.from(new Set(rows.map((row) => row[key]).filter(Boolean))).sort((a, b) => a.localeCompare(b));

const FilterField = ({ label, children }) => (
  <label className="block min-w-0">
    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);

const Courses = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingSessions, setDeletingSessions] = useState({});
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const json = await fetchCourseSessions();
        if (!active) return;
        setSessions(unwrapSessions(json));
      } catch (err) {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Unable to load course session data.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSessions();
    return () => {
      active = false;
    };
  }, []);

  const normalizedSessions = useMemo(
    () => sessions
      .filter((s) => {
        const source = String(s?.source || '').toLowerCase();
        const sectionType = String(s?.sectionType || s?.sessionType || '').toLowerCase();
        const isTit = source.includes('admin_tit') || sectionType === 'tit';
        return !isTit;
      })
      .map(normalizeSession)
      .filter(Boolean),
    [sessions]
  );

  const courseOptions = useMemo(() => optionList(normalizedSessions, 'courseName'), [normalizedSessions]);
  const statusOptions = useMemo(() => optionList(normalizedSessions, 'status'), [normalizedSessions]);
  const instructorOptions = useMemo(() => optionList(normalizedSessions, 'instructor').filter((item) => item !== '-'), [normalizedSessions]);
  const invalidRowCount = Math.max(0, sessions.length - normalizedSessions.length);

  const filteredSessions = useMemo(() => {
    const value = safeLower(query);
    return normalizedSessions.filter((session) => {
      const matchesCourse = courseFilter === 'all' || session.courseName === courseFilter;
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesInstructor = instructorFilter === 'all' || session.instructor === instructorFilter;
      const matchesDate = !dateFilter || session.date === dateFilter;
      const matchesQuery =
        !value ||
        safeLower(session.courseName).includes(value) ||
        safeLower(session.sessionTitle).includes(value) ||
        safeLower(session.instructor).includes(value) ||
        safeLower(session.description).includes(value) ||
        safeLower(session.id).includes(value);

      return matchesCourse && matchesStatus && matchesInstructor && matchesDate && matchesQuery;
    });
  }, [normalizedSessions, query, courseFilter, statusFilter, instructorFilter, dateFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, courseFilter, statusFilter, instructorFilter, dateFilter]);

  const totalEntries = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  const startIndex = totalEntries ? (page - 1) * PAGE_SIZE : 0;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const clearFilters = () => {
    setQuery('');
    setCourseFilter('all');
    setStatusFilter('all');
    setInstructorFilter('all');
    setDateFilter('');
  };

  const openDeleteModal = (session) => {
    if (!session.id) {
      setError('Cannot delete this session because the API response does not include a session ID.');
      return;
    }
    setError('');
    setSessionToDelete(session);
  };

  const closeDeleteModal = () => {
    if (sessionToDelete && deletingSessions[sessionToDelete.id]) return;
    setSessionToDelete(null);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete?.id) return;
    const session = sessionToDelete;
    setError('');
    setDeletingSessions((prev) => ({ ...prev, [session.id]: true }));
    try {
      const response = await deleteCourseSession(session.id);
      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to delete session.');
      }
      setSessions((prev) => prev.filter((item, index) => normalizeSession(item, index)?.id !== session.id));
      setSessionToDelete(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete session.'));
    } finally {
      setDeletingSessions((prev) => ({ ...prev, [session.id]: false }));
    }
  };

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const items = new Set([1, totalPages]);
    for (let p = page - 1; p <= page + 1; p += 1) {
      if (p > 1 && p < totalPages) items.add(p);
    }
    const sorted = Array.from(items).sort((a, b) => a - b);
    const withGaps = [];
    sorted.forEach((current, index) => {
      const previous = sorted[index - 1];
      if (index > 0 && current - previous > 1) withGaps.push('gap');
      withGaps.push(current);
    });
    return withGaps;
  };

  const filtersActive =
    query || courseFilter !== 'all' || statusFilter !== 'all' || instructorFilter !== 'all' || dateFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="mt-1 text-sm text-slate-500">View all course sessions in one table.</p>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {invalidRowCount > 0 ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {invalidRowCount} invalid session record{invalidRowCount === 1 ? '' : 's'} skipped from the table.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(160px,220px)_150px_minmax(150px,190px)_150px_96px]">
            <FilterField label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Course, session, trainer, ID"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </FilterField>

            <FilterField label="Course">
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                {courseOptions.map((courseName) => (
                  <option key={courseName} value={courseName}>
                    {courseName}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Status">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Trainer">
              <select
                value={instructorFilter}
                onChange={(event) => setInstructorFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Trainers</option>
                {instructorOptions.map((instructor) => (
                  <option key={instructor} value={instructor}>
                    {instructor}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Date">
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              />
            </FilterField>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!filtersActive}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingSpinner label="Loading course sessions..." />
          </div>
        ) : (
          <>
            <CoursesTable
              paginatedSessions={paginatedSessions}
              startIndex={startIndex}
              getStatusStyles={getStatusStyles}
              openDeleteModal={openDeleteModal}
              deletingSessions={deletingSessions}
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
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {getPageItems().map((item, index) =>
                    item === 'gap' ? (
                      <span key={`gap-${index}`} className="px-2 text-slate-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        disabled={totalEntries === 0}
                        className={`min-w-[36px] rounded-lg border px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                          item === page ? 'border-blue-100 bg-blue-50 font-semibold text-blue-700' : 'border-slate-200 text-slate-700'
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
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <DeleteCourseModal
        sessionToDelete={sessionToDelete}
        deletingSessions={deletingSessions}
        closeDeleteModal={closeDeleteModal}
        confirmDeleteSession={confirmDeleteSession}
      />
    </div>
  );
};

export default Courses;

