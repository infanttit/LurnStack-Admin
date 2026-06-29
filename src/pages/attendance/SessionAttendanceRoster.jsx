import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchDayAttendance,
  getAttendanceOverview,
  getSessionAttendance,
  overrideStudentAttendance,
} from '../../api/attendance';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, Clock, Mail, User, XCircle, Calendar, Users, UserCheck, Search } from 'lucide-react';

const statusClasses = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500',
  late: 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500',
  absent: 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500',
  pending: 'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-500',
};

const PaginationControls = ({ currentPage, totalItems, rowsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row bg-slate-50/50">
      <p className="text-xs font-semibold text-slate-500">
        Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
        <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> entries
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const SessionAttendanceRoster = () => {
  const { sessionId, date } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [trainerAttendance, setTrainerAttendance] = useState(null);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessionAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const res = date ? await fetchDayAttendance(sessionId, date) : await getSessionAttendance(sessionId);
      const resData = res.data || res;
      setTrainerAttendance(resData.trainerAttendance || null);
      setRecords(resData.students || []);
      setSummary(resData.summary || {});
    } catch (err) {
      const message = err?.message || 'Failed to load session attendance records';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, date]);

  // Reset page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleStatusChange = async (attendanceId, newStatus) => {
    if (!attendanceId) return;

    try {
      setUpdating(attendanceId);
      await overrideStudentAttendance(attendanceId, newStatus);
      await fetchSessionAttendance();
      if (date) await getAttendanceOverview(date);
      toast.success('Attendance status updated successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to update attendance status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredRecords = useMemo(() => {
    let list = records;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((student) => {
        const name = student.fullName || student.name || '';
        const email = student.email || '';
        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
      });
    }

    if (statusFilter !== 'all') {
      list = list.filter((student) => {
        const status = (student.status || 'pending').toLowerCase();
        return status === statusFilter;
      });
    }

    return list;
  }, [records, searchQuery, statusFilter]);

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * 10, currentPage * 10);
  }, [filteredRecords, currentPage]);

  const getStatusColor = (status) => statusClasses[status?.toLowerCase()] || statusClasses.pending;

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Day Roster</h2>
          <p className="mt-1 text-sm text-gray-500">
            {"Attendance Overview -> Course -> Session Days -> Day Roster"}
          </p>
        </div>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalStudents ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Attended</p>
            <p className="text-2xl font-bold text-gray-900">{summary.attendedCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</p>
            <p className="text-2xl font-bold text-gray-900">{summary.presentCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Late</p>
            <p className="text-2xl font-bold text-gray-900">{summary.lateCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Absent</p>
            <p className="text-2xl font-bold text-gray-900">{summary.absentCount ?? 0}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {trainerAttendance ? (
        <div className="flex flex-col justify-between gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center space-x-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner ${getStatusColor(trainerAttendance.status)}`}>
              {trainerAttendance.status === 'present' ? (
                <CheckCircle size={28} />
              ) : trainerAttendance.status === 'absent' ? (
                <XCircle size={28} />
              ) : (
                <User size={28} />
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Faculty Member</p>
              <h3 className="text-xl font-black text-slate-900">{trainerAttendance.trainerName || 'Unassigned'}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div>
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Session Status</p>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(trainerAttendance.status)}`}>
                {trainerAttendance.status}
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Duration</p>
              <div className="flex items-center space-x-1.5 font-extrabold text-slate-800">
                <Clock size={16} className="text-slate-400" />
                <span>{trainerAttendance.durationMinutes ?? 0} mins</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-800">Student Attendance List</h3>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="pending">Pending</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Join Count</th>
                <th className="px-6 py-4">Time Activity</th>
                <th className="px-6 py-4">Status Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((student) => {
                  const attendanceId = student.attendanceId;
                  const editable = Boolean(attendanceId);
                  const key = attendanceId || `${student.studentId || student.email || 'student'}-${student.sessionId || sessionId}`;

                  return (
                    <tr key={key} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                            {(student.fullName || student.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{student.fullName || student.name || 'Unknown Student'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Mail size={14} />
                          <span>{student.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">{formatDate(student.occurrenceDate || student.date)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
                          {student.joinCount ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">First:</span>
                            <span>{formatTime(student.firstJoinedAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">Last:</span>
                            <span>{formatTime(student.lastJoinedAt)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={student.status || 'pending'}
                            onChange={(event) => handleStatusChange(attendanceId, event.target.value)}
                            disabled={!editable || updating === attendanceId}
                            className={`w-32 appearance-none rounded-lg border py-2 pl-3 pr-8 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${getStatusColor(student.status)}`}
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                            <option value="pending">Pending</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {!editable ? <p className="mt-1 text-xs font-semibold text-slate-400">Not editable yet</p> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredRecords.length}
          rowsPerPage={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default SessionAttendanceRoster;
