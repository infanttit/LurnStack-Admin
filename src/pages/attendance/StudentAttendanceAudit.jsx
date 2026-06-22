import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentAttendance } from '../../api/attendance';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, Clock, BookOpen, Percent, CheckCircle, XCircle, Search } from 'lucide-react';

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

const StudentAttendanceAudit = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getStudentAttendance(studentId);
      setData(res.data || res);
    } catch (err) {
      toast.error('Failed to load student attendance audit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  // Reset page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const summary = data?.summary || {};
  const records = data?.records || [];
  const studentName = data?.studentName || data?.fullName || `Student ID: ${studentId}`;

  const filteredRecords = useMemo(() => {
    let list = records;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((rec) => {
        const course = rec.courseTitle || '';
        const session = rec.sessionTitle || '';
        return course.toLowerCase().includes(query) || session.toLowerCase().includes(query);
      });
    }

    if (statusFilter !== 'all') {
      list = list.filter((rec) => {
        const status = (rec.status || 'pending').toLowerCase();
        return status === statusFilter;
      });
    }

    return list;
  }, [records, searchQuery, statusFilter]);

  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * 10, currentPage * 10);
  }, [filteredRecords, currentPage]);

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
        <p className="text-gray-500">No attendance data found for this student.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Present</span>;
      case 'late': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Late</span>;
      case 'absent': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-800">Absent</span>;
      case 'pending': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Pending</span>;
      default: return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status || 'Unknown'}</span>;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{studentName}</h2>
          <p className="text-sm text-gray-500 mt-1">{"Attendance Overview -> Course -> Session Days -> Day Roster -> Person Audit"}</p>
        </div>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Percent size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Overall Attendance</p>
            <p className="text-2xl font-bold text-gray-900">{summary.attendancePercentage ?? 0}%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Present Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.presentCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Late Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.lateCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Absent Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.absentCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-800">Detailed Audit Log</h3>
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
                placeholder="Search course or session..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Session Date</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Session Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Join Time</th>
                <th className="px-6 py-4">Leave Time</th>
                <th className="px-6 py-4">Join Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No attendance records found for this student.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => (
                  <tr key={rec.attendanceId || rec.studentAttendanceId || `${rec.sessionId}-${rec.date}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="font-medium">{rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <BookOpen size={14} />
                        <span>{rec.courseTitle || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {rec.sessionTitle || 'Unnamed Session'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatTime(rec.firstJoinedAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatTime(rec.lastJoinedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {rec.joinCount || 0}
                      </span>
                    </td>
                  </tr>
                ))
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

export default StudentAttendanceAudit;
