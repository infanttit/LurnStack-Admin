import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { getGroupedCourseDayAttendance, getGroupedTITDayAttendance, overrideStudentAttendance } from '../../api/attendance';
import { getApiErrorMessage } from '../../api/axiosClient';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-toastify';

const unwrap = (payload) => payload?.data ?? payload ?? {};
const asArray = (value) => (Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : []);
const value = (...items) => items.find((item) => item !== undefined && item !== null && item !== '') ?? '';
const count = (...items) => Number(value(...items, 0)) || 0;

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

const StatusBadge = ({ status }) => {
  const normalized = String(status || 'pending').toLowerCase();
  const classes = {
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${classes[normalized] || classes.pending}`}>{normalized}</span>;
};

const statusSelectClasses = {
  present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  late: 'border-amber-200 bg-amber-50 text-amber-700',
  absent: 'border-rose-200 bg-rose-50 text-rose-700',
  pending: 'border-gray-200 bg-gray-50 text-gray-700',
};

const CourseAttendanceDay = ({ isTIT = false }) => {
  const { courseKey, date } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadDay = async () => {
    setLoading(true);
    setError('');
    try {
      const response = isTIT
        ? await getGroupedTITDayAttendance(courseKey, date)
        : await getGroupedCourseDayAttendance(courseKey, date);
      setData(unwrap(response));
    } catch (err) {
      setError(getApiErrorMessage(err, isTIT ? 'Unable to load TIT class day attendance' : 'Unable to load course day attendance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseKey, date]);

  const studentRows = useMemo(() => {
    let rows = asArray(data?.studentAttendance || data?.students || data?.records);
    
    // Status Filter
    if (statusFilter !== 'all') {
      rows = rows.filter((row) => String(row.status || 'pending').toLowerCase() === statusFilter.toLowerCase());
    }

    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const haystack = [row.studentName, row.fullName, row.name, row.email, row.status, row.source].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [data, search, statusFilter]);

  const trainerRows = useMemo(() => asArray(data?.trainerAttendance || data?.trainer), [data]);

  const handleStatusChange = async (attendanceId, status) => {
    if (!attendanceId) return;
    setUpdatingId(attendanceId);
    try {
      await overrideStudentAttendance(attendanceId, status);
      toast.success('Attendance status updated');
      await loadDay();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update attendance status'));
    } finally {
      setUpdatingId('');
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window');
      return;
    }

    const courseTitle = value(data?.courseTitle, data?.courseName, 'Course Day Attendance');
    const displayDate = formatDate(date);

    const rowsHtml = studentRows.map((row) => {
      const status = String(row.status || 'pending').toLowerCase();
      const firstJoined = formatTime(row.firstJoinedAt || row.joinedAt);
      const lastJoined = formatTime(row.lastJoinedAt || row.leftAt);
      const duration = count(row.durationMinutes, Math.round(Number(row.totalDurationSeconds || 0) / 60));
      const joins = count(row.joinCount);
      const src = value(row.source, 'system');
      
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${value(row.studentName, row.fullName, row.name, 'Unknown Student')}</td>
          <td style="padding: 10px; color: #475569;">${value(row.email, row.student?.email, 'N/A')}</td>
          <td style="padding: 10px;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: capitalize; 
              ${status === 'present' ? 'background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;' : 
                status === 'late' ? 'background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;' : 
                status === 'absent' ? 'background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5;' : 
                'background-color: #f9fafb; color: #374151; border: 1px solid #e5e7eb;'}">
              ${status}
            </span>
          </td>
          <td style="padding: 10px; color: #475569;">${firstJoined}</td>
          <td style="padding: 10px; color: #475569;">${lastJoined}</td>
          <td style="padding: 10px; text-align: center; color: #475569;">${duration} mins</td>
          <td style="padding: 10px; text-align: center; color: #475569;">${joins}</td>
          <td style="padding: 10px; color: #475569;">${src}</td>
        </tr>
      `;
    }).join('');

    const trainersHtml = trainerRows.map((row) => {
      const status = String(row.status || 'pending').toLowerCase();
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${value(row.trainerName, row.fullName, row.name, 'Trainer')}</td>
          <td style="padding: 10px;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: capitalize; 
              ${status === 'present' ? 'background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;' : 
                status === 'absent' ? 'background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5;' : 
                'background-color: #f9fafb; color: #374151; border: 1px solid #e5e7eb;'}">
              ${status}
            </span>
          </td>
          <td style="padding: 10px; color: #475569;">${formatTime(row.startTime || row.firstJoinedAt || row.joinedAt)}</td>
          <td style="padding: 10px; color: #475569;">${formatTime(row.endTime || row.lastJoinedAt || row.leftAt)}</td>
          <td style="padding: 10px; text-align: center; color: #475569;">${count(row.durationMinutes, Math.round(Number(row.totalDurationSeconds || 0) / 60))} mins</td>
          <td style="padding: 10px; color: #475569;">${value(row.source, row.inferred ? 'inferred' : 'system')}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report - ${courseTitle} - ${displayDate}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background-color: #f8fafc; padding: 12px 10px; text-align: left; font-weight: bold; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 11px; tracking: 0.05em; }
            .header-container { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
            .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="title">LurnStack Attendance Report</h1>
            <div class="subtitle"><strong>Course:</strong> ${courseTitle} | <strong>Date:</strong> ${displayDate}</div>
          </div>
          
          <h2 class="section-title">Student Attendance</h2>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>First Joined</th>
                <th>Last Joined</th>
                <th>Duration</th>
                <th>Joins</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="padding: 20px; text-align: center; color: #64748b;">No student records found.</td></tr>'}
            </tbody>
          </table>

          <h2 class="section-title">Trainer Attendance</h2>
          <table>
            <thead>
              <tr>
                <th>Trainer Name</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              ${trainersHtml || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #64748b;">No trainer records found.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <LoadingSpinner label="Loading day attendance..." />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(isTIT
              ? `/tit/${encodeURIComponent(courseKey)}/attendance`
              : `/courses/${encodeURIComponent(courseKey)}/attendance`
            )}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Back to course dates"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{value(data?.courseTitle, data?.courseName, 'Course Day Attendance')}</h2>
            <p className="mt-1 text-sm text-slate-500">{formatDate(date)} day detail</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadPDF}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/25"
        >
          Download PDF
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Student Attendance</h3>
            <p className="text-sm text-slate-500">Student rows are managed separately from trainer attendance.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold capitalize text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="pending">Pending</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">First Joined At</th>
                <th className="px-4 py-3">Last Joined At</th>
                <th className="px-4 py-3 text-center">Duration Minutes</th>
                <th className="px-4 py-3 text-center">Join Count</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {studentRows.length === 0 ? (
                <tr><td colSpan="9" className="px-6 py-10 text-center text-sm font-medium text-slate-500">No student attendance found for this day.</td></tr>
              ) : (
                studentRows.map((row, index) => {
                  const attendanceId = value(row.attendanceId, row.studentAttendanceId, row.id);
                  const status = String(row.status || 'pending').toLowerCase();
                  return (
                    <tr key={attendanceId || `${row.studentId || row.email || 'student'}-${index}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{value(row.studentName, row.fullName, row.name, 'Unknown Student')}</td>
                      <td className="px-4 py-3">{value(row.email, row.student?.email, 'N/A')}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3">{formatTime(row.firstJoinedAt || row.joinedAt)}</td>
                      <td className="px-4 py-3">{formatTime(row.lastJoinedAt || row.leftAt)}</td>
                      <td className="px-4 py-3 text-center font-semibold">{count(row.durationMinutes, Math.round(Number(row.totalDurationSeconds || 0) / 60))}</td>
                      <td className="px-4 py-3 text-center font-semibold">{count(row.joinCount)}</td>
                      <td className="px-4 py-3">{value(row.source, 'system')}</td>
                      <td className="px-4 py-3">
                        <select
                          value={status}
                          disabled={!attendanceId || updatingId === attendanceId}
                          onChange={(event) => handleStatusChange(attendanceId, event.target.value)}
                          className={`w-32 rounded-lg border px-3 py-2 text-sm font-bold capitalize outline-none disabled:cursor-not-allowed disabled:opacity-50 ${statusSelectClasses[status] || statusSelectClasses.pending}`}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="pending">Pending</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Trainer Attendance</h3>
          {trainerRows.some((row) => row.inferred || row.source === 'inferred') ? (
            <p className="mt-1 text-sm text-slate-500">Trainer attendance is inferred from session occurrence.</p>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Trainer Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start Time</th>
                <th className="px-4 py-3">End Time</th>
                <th className="px-4 py-3 text-center">Duration Minutes</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {trainerRows.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-sm font-medium text-slate-500">No trainer attendance found for this day.</td></tr>
              ) : (
                trainerRows.map((row, index) => (
                  <tr key={value(row.trainerAttendanceId, row.id, row.trainerId, index)} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{value(row.trainerName, row.fullName, row.name, 'Trainer')}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">{formatTime(row.startTime || row.firstJoinedAt || row.joinedAt)}</td>
                    <td className="px-4 py-3">{formatTime(row.endTime || row.lastJoinedAt || row.leftAt)}</td>
                    <td className="px-4 py-3 text-center font-semibold">{count(row.durationMinutes, Math.round(Number(row.totalDurationSeconds || 0) / 60))}</td>
                    <td className="px-4 py-3">{value(row.source, row.inferred ? 'inferred' : 'system')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CourseAttendanceDay;
