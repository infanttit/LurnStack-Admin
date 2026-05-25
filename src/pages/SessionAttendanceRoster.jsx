import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionAttendance, overrideStudentAttendance } from '../api/attendance';
import { toast } from 'react-toastify';
import { ArrowLeft, Clock, Mail, User } from 'lucide-react';

const SessionAttendanceRoster = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchSessionAttendance();
  }, [sessionId]);

  const fetchSessionAttendance = async () => {
    try {
      setLoading(true);
      const res = await getSessionAttendance(sessionId);
      // Handle both flat array and nested students array response formats
      const data = res?.data || res || [];
      const studentList = Array.isArray(data) ? data : (data.students || []);
      const mappedList = studentList.map(s => ({
        ...s,
        status: s.status === 'joined' ? 'present' : s.status
      }));
      setRecords(mappedList);
    } catch (err) {
      toast.error('Failed to load session attendance records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (attendanceId, newStatus) => {
    try {
      setUpdating(attendanceId);
      await overrideStudentAttendance(attendanceId, newStatus);
      toast.success('Attendance status updated successfully');
      // Optimistically update local state
      setRecords(prev => 
        prev.map(rec => rec.attendanceId === attendanceId ? { ...rec, status: newStatus } : rec)
      );
    } catch (err) {
      toast.error('Failed to update attendance status');
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500';
      case 'absent': return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 focus:ring-blue-500';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <h2 className="text-2xl font-bold text-gray-900">Session Roster</h2>
          <p className="text-sm text-gray-500 mt-1">Manage individual student attendance for this session</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Join Count</th>
                <th className="px-6 py-4">Time Activity</th>
                <th className="px-6 py-4">Status Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((student) => (
                  <tr key={student.attendanceId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {(student.fullName || student.name) ? (student.fullName || student.name).charAt(0).toUpperCase() : 'S'}
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
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {student.joinCount || 0}
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
                          value={student.status || 'absent'}
                          onChange={(e) => handleStatusChange(student.attendanceId, e.target.value)}
                          disabled={updating === student.attendanceId}
                          className={`appearance-none w-32 border rounded-lg pl-3 pr-8 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors cursor-pointer ${getStatusColor(student.status)}`}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
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

export default SessionAttendanceRoster;
