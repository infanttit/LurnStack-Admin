import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSessionDays } from '../../api/attendance';
import { toast } from 'react-toastify';
import { Calendar, ArrowLeft, Clock, Eye, Video, Search } from 'lucide-react';

const formatTime = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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

const SessionOccurrences = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadOccurrences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSessionDays(sessionId);
      const data = res?.occurrences || res?.data?.occurrences || res || [];
      
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      const filtered = data.filter((occ) => {
        const occDate = new Date(occ.occurrenceDate || occ.date || occ.startsAt);
        return occDate <= endOfToday;
      });
      
      setOccurrences(filtered);
    } catch (err) {
      toast.error('Failed to load session occurrences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadOccurrences();
  }, [loadOccurrences]);

  // Reset page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const filteredOccurrences = useMemo(() => {
    let list = occurrences;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((occ) => {
        const formatted = formatDate(occ.occurrenceDate).toLowerCase();
        return formatted.includes(query);
      });
    }

    if (statusFilter !== 'all') {
      list = list.filter((occ) => {
        const status = (occ.status || 'scheduled').toLowerCase();
        return status === statusFilter;
      });
    }

    return list;
  }, [occurrences, searchQuery, statusFilter]);

  const paginatedOccurrences = useMemo(() => {
    return filteredOccurrences.slice((currentPage - 1) * 10, currentPage * 10);
  }, [filteredOccurrences, currentPage]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'live': return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Session Schedule</h2>
          <p className="text-sm text-gray-500 mt-1">{"Attendance Overview -> Course -> Session Days"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-800">Occurrences Schedule</h3>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="live">Live</option>
              <option value="upcoming">Upcoming</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search date (e.g. Jun 19)..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOccurrences.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No occurrences found for this session
                  </td>
                </tr>
              ) : (
                paginatedOccurrences.map((occ) => {
                  const dateSource = occ.occurrenceDate || occ.date;
                  const dateStr = dateSource ? dateSource.split('T')[0] : null;
                  return (
                    <tr key={occ.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Calendar size={18} />
                          </div>
                          <span className="font-semibold text-gray-900">{formatDate(occ.occurrenceDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={16} className="text-gray-400" />
                          <span>{formatTime(occ.startsAt)} - {formatTime(occ.endsAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(occ.status)}`}>
                          {occ.status === 'live' && <Video size={12} className="mr-1" />}
                          {occ.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => dateStr && navigate(`/sessions/${sessionId}/attendance/${dateStr}`)}
                          disabled={!dateStr}
                          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
                        >
                          <Eye size={16} className="mr-2" />
                          View Attendance
                        </button>
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
          totalItems={filteredOccurrences.length}
          rowsPerPage={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default SessionOccurrences;
