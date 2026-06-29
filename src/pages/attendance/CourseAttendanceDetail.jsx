import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Search } from 'lucide-react';
import { getGroupedCourseAttendanceDetail } from '../../api/attendance';
import { getApiErrorMessage } from '../../api/axiosClient';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSpinner from '../../components/LoadingSpinner';

const unwrap = (payload) => payload?.data ?? payload ?? {};
const asArray = (value) => (Array.isArray(value) ? value : []);
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== '') ?? '';
const count = (...items) => Number(value(...items, 0)) || 0;

const pickOccurrences = (data) => {
  if (Array.isArray(data)) return data;
  return asArray(data.occurrences || data.sessions || data.dates || data.records || data.items);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString();
};

const formatDateKey = (date) => {
  if (!date) return '';
  const raw = String(date);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString().slice(0, 10);
};

const formatTime = (start, end) => {
  const makeTime = (date) => {
    if (!date) return '';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return String(date);
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const startTime = makeTime(start);
  const endTime = makeTime(end);
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || 'N/A';
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || 'pending').toLowerCase();
  const classes = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    running: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
    scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
    completed: 'bg-slate-100 text-slate-700 border-slate-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${classes[normalized] || classes.pending}`}>{normalized}</span>;
};

const SummaryCard = ({ label, value: cardValue }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-xl font-black text-slate-900">{cardValue}</p>
  </div>
);

const CourseAttendanceDetail = () => {
  const { courseId: courseKey } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const loadCourse = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getGroupedCourseAttendanceDetail(courseKey);
        if (active) setData(unwrap(response));
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load grouped course attendance'));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCourse();
    return () => {
      active = false;
    };
  }, [courseKey]);

  const summary = data?.summary || data || {};
  const occurrences = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = pickOccurrences(data || {}).map((row) => ({
      ...row,
      date: value(row.date, row.occurrenceDate, row.startsAt),
      runtimeStatus: value(row.runtimeStatus, row.status, row.sessionStatus, 'upcoming'),
      trainerStatus: value(row.trainerStatus, row.trainerAttendance?.status, 'pending'),
      totalStudents: count(row.totalStudents, row.studentCount),
      presentCount: count(row.presentCount, row.present),
      lateCount: count(row.lateCount, row.late),
      absentCount: count(row.absentCount, row.absent),
      pendingCount: count(row.pendingCount, row.pending),
      attendancePercentage: count(row.attendancePercentage, row.averageAttendancePercentage),
    }));
    if (!query) return rows;
    return rows.filter((row) => `${row.date} ${row.runtimeStatus} ${row.trainerStatus}`.toLowerCase().includes(query));
  }, [data, search]);

  if (loading) return <LoadingSpinner label="Loading course attendance..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/attendance')}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          aria-label="Back to attendance"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{value(data?.courseTitle, data?.courseName, data?.title, 'Course Attendance')}</h2>
          <p className="mt-1 text-sm text-slate-500">Course Dates</p>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Trainer</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{value(data?.trainerName, data?.trainer?.fullName, data?.trainer?.name, 'Unassigned')}</h3>
          </div>
          <StatusBadge status={value(data?.status, data?.runtimeStatus, summary.status, 'upcoming')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <SummaryCard label="Total students" value={count(summary.totalStudents, data?.totalStudents)} />
        <SummaryCard label="Total sessions" value={count(summary.totalSessions, data?.totalSessions)} />
        <SummaryCard label="Completed" value={count(summary.completedSessions, data?.completedSessions)} />
        <SummaryCard label="Upcoming" value={count(summary.upcomingSessions, data?.upcomingSessions)} />
        <SummaryCard label="Attendance %" value={`${count(summary.attendancePercentage, summary.averageAttendancePercentage, data?.attendancePercentage)}%`} />
        <SummaryCard label="Present" value={count(summary.presentCount)} />
        <SummaryCard label="Pending" value={count(summary.pendingCount)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Date / Session Occurrences</h3>
            <p className="text-sm text-slate-500">Select a day to inspect student and trainer attendance separately.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dates or statuses..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Runtime Status</th>
                <th className="px-4 py-3 text-center">Total Students</th>
                <th className="px-4 py-3 text-center">Present</th>
                <th className="px-4 py-3 text-center">Late</th>
                <th className="px-4 py-3 text-center">Absent</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-center">Attendance %</th>
                <th className="px-4 py-3">Trainer Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {occurrences.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center text-sm font-medium text-slate-500">No date/session occurrences found.</td>
                </tr>
              ) : (
                occurrences.map((row, index) => {
                  const dateKey = formatDateKey(row.date);
                  return (
                    <tr key={value(row.id, row.occurrenceId, `${dateKey}-${index}`)} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900"><span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" />{formatDate(row.date)}</span></td>
                      <td className="px-4 py-3">{formatTime(value(row.startTime, row.startsAt), value(row.endTime, row.endsAt))}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.runtimeStatus} /></td>
                      <td className="px-4 py-3 text-center font-semibold">{row.totalStudents}</td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-600">{row.presentCount}</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{row.lateCount}</td>
                      <td className="px-4 py-3 text-center font-semibold text-rose-600">{row.absentCount}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">{row.pendingCount}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-900">{row.attendancePercentage}%</td>
                      <td className="px-4 py-3"><StatusBadge status={row.trainerStatus} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!dateKey}
                          onClick={() => navigate(`/courses/${encodeURIComponent(courseKey)}/attendance/${encodeURIComponent(dateKey)}`)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          View Day
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CourseAttendanceDetail;
