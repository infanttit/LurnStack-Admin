import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bug, Search, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAdminStudents, fetchAdminTrainers } from '../../api/adminDashboard';
import {
  getAllAttendanceRecords,
  getGroupedCourseAttendance,
  getGroupedStudentAttendance,
  getGroupedTrainerAttendance,
} from '../../api/attendance';
import { getApiErrorMessage } from '../../api/axiosClient';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSpinner from '../../components/LoadingSpinner';

const tabs = [
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'trainers', label: 'Trainers', icon: User },
  { key: 'records', label: 'Records', icon: Bug },
];

const activeCourseStatuses = ['live', 'running', 'upcoming'];

const unwrap = (payload) => payload?.data ?? payload ?? {};
const asArray = (value) => (Array.isArray(value) ? value : []);
const pickList = (payload, keys) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== '') ?? '';
const count = (...items) => Number(value(...items, 0)) || 0;
const percent = (...items) => count(...items);

const formatDate = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString();
};

const formatTime = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getId = (row) => value(row?.id, row?._id, row?.studentId, row?.trainerId);
const getPersonName = (row, fallback = 'Unnamed') => value(row?.fullName, row?.name, row?.studentName, row?.trainerName, fallback);

const StatusBadge = ({ status }) => {
  const normalized = String(status || 'pending').toLowerCase();
  const classes = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    running: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
    completed: 'bg-slate-100 text-slate-700 border-slate-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${classes[normalized] || classes.pending}`}>
      {normalized}
    </span>
  );
};

const SearchBox = ({ value: searchValue, onChange, placeholder }) => (
  <div className="relative w-full sm:w-72">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      value={searchValue}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    />
  </div>
);

const EmptyRow = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-10 text-center text-sm font-medium text-slate-500">
      {message}
    </td>
  </tr>
);

const MetricStrip = ({ items }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
    {items.map((item) => (
      <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
        <p className="mt-2 text-xl font-black text-slate-900">{item.value}</p>
      </div>
    ))}
  </div>
);

const PaginationControls = ({ currentPage, totalItems, rowsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, totalItems);

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const items = new Set([1, totalPages]);
    for (let p = currentPage - 1; p <= currentPage + 1; p += 1) {
      if (p > 1 && p < totalPages) items.add(p);
    }
    const sorted = Array.from(items).sort((a, b) => a - b);

    const withGaps = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && current - prev > 1) withGaps.push('gap');
      withGaps.push(current);
    }
    return withGaps;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row bg-slate-50/50">
      <p className="text-xs font-semibold text-slate-500">
        Showing <span className="font-bold text-slate-900">{totalItems ? startEntry : 0}</span> to{' '}
        <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> entries
      </p>
      
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <button
          type="button"
          disabled={currentPage <= 1 || totalItems === 0}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors text-xs font-bold text-slate-700 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageItems().map((item, idx) =>
            item === 'gap' ? (
              <span key={`gap-${idx}`} className="px-2 text-slate-400 text-xs">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`min-w-[36px] px-3 py-1.5 border rounded-lg hover:bg-slate-50 transition-colors text-xs font-bold shadow-sm ${
                  item === currentPage
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages || totalItems === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors text-xs font-bold text-slate-700 shadow-sm"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const normalizeCourse = (course) => ({
  ...course,
  courseKey: value(course.courseKey, course.key, course.courseId, course.id, course._id, course.courseTitle, course.courseName),
  courseName: value(course.courseName, course.courseTitle, course.title, 'Untitled Course'),
  trainerName: value(course.trainerName, course.trainer?.fullName, course.trainer?.name, 'Unassigned'),
  status: value(course.status, course.runtimeStatus, course.courseStatus, 'upcoming'),
  totalStudents: count(course.totalStudents, course.studentCount),
  totalSessions: count(course.totalSessions, course.sessionCount),
  completedSessions: count(course.completedSessions, course.completedSessionCount),
  upcomingSessions: count(course.upcomingSessions, course.upcomingSessionCount),
  presentCount: count(course.presentCount, course.present),
  lateCount: count(course.lateCount, course.late),
  absentCount: count(course.absentCount, course.absent),
  pendingCount: count(course.pendingCount, course.pending),
  attendancePercentage: percent(course.averageAttendancePercentage, course.attendancePercentage, course.avgAttendancePercentage),
});

const normalizeGroupedCourse = (course) => ({
  ...course,
  courseName: value(course.courseName, course.courseTitle, course.title, 'Course'),
  trainerName: value(course.trainerName, course.trainer?.fullName, course.trainer?.name, 'Unassigned'),
  summary: course.summary || course.overallSummary || course,
  courses: asArray(course.courses || course.groupedCourses),
  records: asArray(course.records || course.sessions || course.occurrences || course.attendance),
});

const PersonPicker = ({ rows, selectedId, onSelect, search, onSearch, placeholder, emptyLabel }) => {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const haystack = [getPersonName(row), row.email, row.phone, row.mobile, getId(row)].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <SearchBox value={search} onChange={onSearch} placeholder={placeholder} />
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-medium text-slate-500">{emptyLabel}</div>
        ) : (
          filtered.map((row) => {
            const id = getId(row);
            return (
              <button
                key={id || getPersonName(row)}
                type="button"
                onClick={() => id && onSelect(id)}
                className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-slate-50 ${String(selectedId) === String(id) ? 'bg-blue-50' : ''}`}
              >
                <span>
                  <span className="block text-sm font-bold text-slate-900">{getPersonName(row)}</span>
                  <span className="block text-xs text-slate-500">{value(row.email, row.phone, id, 'No contact')}</span>
                </span>
                <span className="text-xs font-bold text-blue-600">Select</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const CoursesTab = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const loadCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getGroupedCourseAttendance();
        if (!active) return;
        setCourses(pickList(response, ['courses', 'items', 'records', 'data']).map(normalizeCourse));
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load grouped course attendance'));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCourses();
    return () => {
      active = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...courses].sort((a, b) => {
      const aActive = activeCourseStatuses.includes(String(a.status).toLowerCase()) ? 0 : 1;
      const bActive = activeCourseStatuses.includes(String(b.status).toLowerCase()) ? 0 : 1;
      return aActive - bActive || String(a.courseName).localeCompare(String(b.courseName));
    });
    if (!query) return sorted;
    return sorted.filter((course) => `${course.courseName} ${course.trainerName} ${course.status}`.toLowerCase().includes(query));
  }, [courses, search]);

  if (loading) return <LoadingSpinner label="Loading grouped courses..." />;

  return (
    <div className="space-y-4">
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Course Attendance</h3>
          <p className="text-sm text-slate-500">Live, running, and upcoming courses are shown first.</p>
        </div>
        <SearchBox value={search} onChange={setSearch} placeholder="Search course or trainer..." />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Course Name</th>
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Total Students</th>
                <th className="px-4 py-3 text-center">Total Sessions</th>
                <th className="px-4 py-3 text-center">Completed Sessions</th>
                <th className="px-4 py-3 text-center">Upcoming Sessions</th>
                <th className="px-4 py-3 text-center">Present</th>
                <th className="px-4 py-3 text-center">Late</th>
                <th className="px-4 py-3 text-center">Absent</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-center">Average Attendance %</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCourses.length === 0 ? (
                <EmptyRow colSpan={13} message="No grouped course attendance found." />
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.courseKey || course.courseName} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{course.courseName}</td>
                    <td className="px-4 py-3">{course.trainerName}</td>
                    <td className="px-4 py-3"><StatusBadge status={course.status} /></td>
                    <td className="px-4 py-3 text-center font-semibold">{course.totalStudents}</td>
                    <td className="px-4 py-3 text-center font-semibold">{course.totalSessions}</td>
                    <td className="px-4 py-3 text-center font-semibold">{course.completedSessions}</td>
                    <td className="px-4 py-3 text-center font-semibold">{course.upcomingSessions}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">{course.presentCount}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-600">{course.lateCount}</td>
                    <td className="px-4 py-3 text-center font-semibold text-rose-600">{course.absentCount}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-500">{course.pendingCount}</td>
                    <td className="px-4 py-3 text-center font-black text-slate-900">{course.attendancePercentage}%</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={!course.courseKey}
                        onClick={() => navigate(`/courses/${encodeURIComponent(course.courseKey)}/attendance`)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        View Attendance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GroupedCourseRecords = ({ rows, personType }) => {
  if (!rows.length) {
    return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">No grouped attendance records found.</div>;
  }

  return (
    <div className="space-y-4">
      {rows.map((course, index) => {
        const records = asArray(course.records || course.sessions || course.occurrences || course.dates || course.attendance);
        const key = value(course.courseKey, course.courseId, course.courseName, index);
        return (
          <div key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h4 className="font-black text-slate-900">{value(course.courseName, course.courseTitle, course.title, 'Course')}</h4>
              <p className="text-sm text-slate-500">Course-wise grouped attendance</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Duration Minutes</th>
                    <th className="px-4 py-3 text-center">Join Count</th>
                    <th className="px-4 py-3">First Joined</th>
                    <th className="px-4 py-3">Last Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {records.length === 0 ? (
                    <EmptyRow colSpan={7} message={`No date/session ${personType} records found for this course.`} />
                  ) : (
                    records.map((record, recordIndex) => (
                      <tr key={value(record.attendanceId, record.id, `${key}-${recordIndex}`)}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatDate(value(record.date, record.occurrenceDate, record.startsAt))}</td>
                        <td className="px-4 py-3">{value(record.sessionTitle, record.title, 'Session')}</td>
                        <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-3 text-center font-semibold">{count(record.durationMinutes)}</td>
                        <td className="px-4 py-3 text-center font-semibold">{count(record.joinCount)}</td>
                        <td className="px-4 py-3">{formatTime(record.firstJoinedAt || record.startTime)}</td>
                        <td className="px-4 py-3">{formatTime(record.lastJoinedAt || record.endTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StudentGroupedView = ({ data }) => {
  if (!data) return null;
  const grouped = normalizeGroupedCourse(unwrap(data));
  const summary = grouped.summary || {};
  const courses = asArray(grouped.courses.length ? grouped.courses : grouped.records);
  const profile = unwrap(data).student || unwrap(data).profile || unwrap(data);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Student profile summary</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">{getPersonName(profile, value(unwrap(data).studentName, 'Student'))}</h3>
        <p className="text-sm text-slate-500">{value(profile.email, profile.phone, profile.studentId, '')}</p>
      </div>
      <MetricStrip items={[
        { label: 'Attendance %', value: `${percent(summary.attendancePercentage, summary.averageAttendancePercentage)}%` },
        { label: 'Present', value: count(summary.presentCount) },
        { label: 'Late', value: count(summary.lateCount) },
        { label: 'Absent', value: count(summary.absentCount) },
        { label: 'Pending', value: count(summary.pendingCount) },
        { label: 'Total Records', value: count(summary.totalRecords, summary.totalSessions) },
      ]} />
      <GroupedCourseRecords rows={courses} personType="student" />
    </div>
  );
};

const TrainerGroupedView = ({ data }) => {
  if (!data) return null;
  const grouped = normalizeGroupedCourse(unwrap(data));
  const summary = grouped.summary || {};
  const courses = asArray(grouped.courses.length ? grouped.courses : grouped.records);
  const profile = unwrap(data).trainer || unwrap(data).profile || unwrap(data);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Trainer profile summary</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">{getPersonName(profile, value(unwrap(data).trainerName, 'Trainer'))}</h3>
        <p className="text-sm text-slate-500">{value(profile.email, profile.phone, profile.trainerId, '')}</p>
      </div>
      <MetricStrip items={[
        { label: 'Total Sessions', value: count(summary.totalSessions, summary.totalRecords) },
        { label: 'Completed', value: count(summary.completedSessions) },
        { label: 'Upcoming', value: count(summary.upcomingSessions) },
        { label: 'Present', value: count(summary.presentCount) },
        { label: 'Late', value: count(summary.lateCount) },
        { label: 'Absent', value: count(summary.absentCount) },
      ]} />
      <GroupedCourseRecords rows={courses} personType="trainer" />
    </div>
  );
};

const StudentsTab = () => {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadStudents = async () => {
      setLoadingList(true);
      setError('');
      try {
        const response = await fetchAdminStudents();
        if (active) setStudents(asArray(response?.data));
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load students'));
      } finally {
        if (active) setLoadingList(false);
      }
    };
    loadStudents();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const loadDetail = async () => {
      setLoadingDetail(true);
      setError('');
      try {
        const response = await getGroupedStudentAttendance(selectedId);
        if (active) setData(response);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load grouped student attendance'));
      } finally {
        if (active) setLoadingDetail(false);
      }
    };
    loadDetail();
    return () => { active = false; };
  }, [selectedId]);

  if (loadingList) return <LoadingSpinner label="Loading students..." />;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <PersonPicker rows={students} selectedId={selectedId} onSelect={setSelectedId} search={search} onSearch={setSearch} placeholder="Search students..." emptyLabel="No students found." />
      <div className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}
        {!selectedId ? <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">Select a student to view grouped attendance.</div> : null}
        {loadingDetail ? <LoadingSpinner label="Loading student attendance..." /> : <StudentGroupedView data={data} />}
      </div>
    </div>
  );
};

const TrainersTab = () => {
  const [trainers, setTrainers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadTrainers = async () => {
      setLoadingList(true);
      setError('');
      try {
        const response = await fetchAdminTrainers();
        if (active) setTrainers(asArray(response?.data));
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load trainers'));
      } finally {
        if (active) setLoadingList(false);
      }
    };
    loadTrainers();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const loadDetail = async () => {
      setLoadingDetail(true);
      setError('');
      try {
        const response = await getGroupedTrainerAttendance(selectedId);
        if (active) setData(response);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load grouped trainer attendance'));
      } finally {
        if (active) setLoadingDetail(false);
      }
    };
    loadDetail();
    return () => { active = false; };
  }, [selectedId]);

  if (loadingList) return <LoadingSpinner label="Loading trainers..." />;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <PersonPicker rows={trainers} selectedId={selectedId} onSelect={setSelectedId} search={search} onSearch={setSearch} placeholder="Search trainers..." emptyLabel="No trainers found." />
      <div className="space-y-4">
        {error ? <ErrorBanner message={error} /> : null}
        {!selectedId ? <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">Select a trainer to view grouped attendance.</div> : null}
        {loadingDetail ? <LoadingSpinner label="Loading trainer attendance..." /> : <TrainerGroupedView data={data} />}
      </div>
    </div>
  );
};

const RecordsTab = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    const loadRecords = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getAllAttendanceRecords();
        if (active) setRecords(pickList(response, ['records', 'attendance', 'items', 'students']));
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Unable to load raw attendance records'));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRecords();
    return () => { active = false; };
  }, []);

  const filteredRecords = useMemo(() => {
    let list = records;
    if (statusFilter !== 'all') {
      list = list.filter((record) => String(record.status || 'pending').toLowerCase() === statusFilter);
    }
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((record) => JSON.stringify(record).toLowerCase().includes(query));
  }, [records, search, statusFilter]);

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * 15, currentPage * 15);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  if (loading) return <LoadingSpinner label="Loading raw records..." />;

  return (
    <div className="space-y-4">
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Raw Attendance Records</h3>
          <p className="text-sm text-slate-500">Filtering and debugging only. Course grouped flow is the main experience.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="pending">Pending</option>
          </select>
          <SearchBox value={search} onChange={setSearch} placeholder="Search raw records..." />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Duration</th>
                <th className="px-4 py-3 text-center">Join Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.length === 0 ? (
                <EmptyRow colSpan={7} message="No raw attendance records found." />
              ) : (
                paginatedRecords.map((record, index) => (
                  <tr key={value(record.attendanceId, record.id, index)}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatDate(value(record.date, record.occurrenceDate, record.startsAt))}</td>
                    <td className="px-4 py-3">{value(record.studentName, record.student?.name, record.student?.fullName, 'N/A')}</td>
                    <td className="px-4 py-3">{value(record.courseName, record.courseTitle, 'N/A')}</td>
                    <td className="px-4 py-3">{value(record.sessionTitle, record.title, 'N/A')}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-center font-semibold">{count(record.durationMinutes)}</td>
                    <td className="px-4 py-3 text-center font-semibold">{count(record.joinCount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredRecords.length}
          rowsPerPage={15}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

const AttendanceOverview = () => {
  const [activeTab, setActiveTab] = useState('courses');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Attendance</h2>
        <p className="mt-1 text-sm text-slate-500">Grouped attendance by course, student, trainer, and raw records.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${selected ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'courses' ? <CoursesTab /> : null}
      {activeTab === 'students' ? <StudentsTab /> : null}
      {activeTab === 'trainers' ? <TrainersTab /> : null}
      {activeTab === 'records' ? <RecordsTab /> : null}
    </div>
  );
};

export default AttendanceOverview;
