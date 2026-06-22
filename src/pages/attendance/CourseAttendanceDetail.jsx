import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseAttendanceSummary } from '../../api/attendance';
import { toast } from 'react-toastify';
import { Users, UserCheck, Clock, UserX, ArrowLeft, Calendar, Search } from 'lucide-react';

const PaginationControls = ({ currentPage, totalItems, rowsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  if (totalPages <= 1) return null;

  const startEntry = (currentPage - 1) * rowsPerPage + 1;
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

const CourseAttendanceDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Reset page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getCourseAttendanceSummary(courseId);
      setData(res.data || res);
    } catch (err) {
      toast.error('Failed to load course attendance summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Completed</span>;
      case 'live':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 animate-pulse">Live</span>;
      case 'scheduled':
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Scheduled</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data found for this course.</p>
        <button onClick={() => navigate('/attendance')} className="mt-4 text-blue-600 hover:underline">
          Go back to Overview
        </button>
      </div>
    );
  }

  const { summary = {}, occurrences = [], courseTitle } = data;

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Total macro sessions counts occurrences up to today
  const totalBaseOccurrencesCount = occurrences.filter((occ) => {
    const occDate = new Date(occ.date || occ.occurrenceDate || occ.startsAt);
    return occDate <= endOfToday;
  }).length;

  const totalSessions = summary.totalSessions ?? totalBaseOccurrencesCount;
  const attendedCount = summary.attendedCount ?? (summary.presentCount ?? 0) + (summary.lateCount ?? 0);

  // Filtered list for the table
  const filteredOccurrences = occurrences.filter((occ) => {
    const occDate = new Date(occ.date || occ.occurrenceDate || occ.startsAt);
    if (occDate > endOfToday) return false;

    // Search query matching title
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const title = occ.sessionTitle || occ.courseTitle || 'Class Session';
      if (!title.toLowerCase().includes(query)) return false;
    }

    // Status matching
    if (statusFilter !== 'all') {
      const status = (occ.status || 'scheduled').toLowerCase();
      if (status !== statusFilter) return false;
    }

    return true;
  });

  const paginatedOccurrences = filteredOccurrences.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/attendance')}
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{courseTitle || 'Course Attendance'}</h2>
          <p className="text-sm text-gray-500 mt-1">{"Attendance Overview -> Course"}</p>
        </div>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Attended</p>
            <p className="text-2xl font-bold text-gray-900">{attendedCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Present</p>
            <p className="text-2xl font-bold text-gray-900">{summary.presentCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Late</p>
            <p className="text-2xl font-bold text-gray-900">{summary.lateCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Absent</p>
            <p className="text-2xl font-bold text-gray-900">{summary.absentCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Occurrences Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-800">Session Occurrences</h3>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="live">Live</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search session..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Session Title</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Present</th>
                <th className="px-6 py-4">Late</th>
                <th className="px-6 py-4">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOccurrences.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No sessions found for this course.
                  </td>
                </tr>
              ) : (
                paginatedOccurrences.map((occ) => (
                  <tr 
                    key={`${occ.sessionId}-${occ.date || occ.occurrenceDate || occ.id}`}
                    onClick={() => navigate(`/sessions/${occ.sessionId}/attendance`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-600">
                      {occ.sessionTitle || occ.courseTitle || 'Class Session'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar size={14} />
                        <span>{occ.date ? new Date(occ.date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(occ.status)}</td>
                    <td className="px-6 py-4 font-medium text-emerald-600">{occ.presentCount ?? 0}</td>
                    <td className="px-6 py-4 font-medium text-amber-600">{occ.lateCount ?? 0}</td>
                    <td className="px-6 py-4 font-medium text-rose-600">{occ.absentCount ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredOccurrences.length}
          rowsPerPage={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CourseAttendanceDetail;
