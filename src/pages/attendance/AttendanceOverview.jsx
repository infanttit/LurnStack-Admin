import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttendanceOverview, getAllAttendanceRecords } from '../../api/attendance';
import { BookOpen, Users, Video, Percent, CheckCircle, Clock, XCircle, BarChart3, Search, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';

const AttendanceOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, recordsRes] = await Promise.all([
        getAttendanceOverview(),
        getAllAttendanceRecords()
      ]);
      setOverviewData(overviewRes?.data || overviewRes || null);
      setAttendanceRecords(recordsRes?.records || recordsRes?.data?.records || []);
    } catch (err) {
      toast.error('Failed to load attendance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };
  
  const formatTimeOnly = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pending') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Tracking</span>;
    if (s === 'present' || s === 'joined') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Present</span>;
    if (s === 'late') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Late</span>;
    if (s === 'absent') return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Absent</span>;
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status || 'Unknown'}</span>;
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor attendance health across all courses</p>
        </div>
      </div>

      {/* Macro Summary Cards */}
      {overviewData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.totalCourses || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.totalStudents || 0}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Video size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.totalSessions || 0}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.averageAttendancePercentage || 0}%</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Present Records</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.presentCount || 0}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Late Records</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.lateCount || 0}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Absent Records</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.absentCount || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Trainers</p>
              <p className="text-2xl font-bold text-gray-900">{overviewData.totalTrainers || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Session Lookup */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Session Lookup</h3>
          <p className="text-sm text-gray-500">Enter a session ID to view detailed attendance records.</p>
        </div>
        <div className="flex items-center space-x-3">
          <input 
            type="text" 
            placeholder="Enter Session ID..." 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="session-lookup-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.target.value;
                if (val) navigate(`/sessions/${val}/attendance`);
              }
            }}
          />
          <button 
            onClick={() => {
              const val = document.getElementById('session-lookup-input').value;
              if (val) navigate(`/sessions/${val}/attendance`);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Search size={16} />
            <span>Lookup</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 whitespace-nowrap">Date</th>
                <th className="px-4 py-4">Course</th>
                <th className="px-4 py-4">Session</th>
                <th className="px-4 py-4">Trainer</th>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 whitespace-nowrap">Total Duration</th>
                <th className="px-4 py-4 whitespace-nowrap">First Join</th>
                <th className="px-4 py-4 whitespace-nowrap">Last Join</th>
                <th className="px-4 py-4 text-center">Join Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{record.courseName}</td>
                    <td className="px-4 py-3">{record.sessionTitle}</td>
                    <td className="px-4 py-3">{record.trainerName}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{record.studentName}</td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{record.durationMinutes} min</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTimeOnly(record.firstJoinedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTimeOnly(record.lastJoinedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {record.joinCount || 0}
                      </span>
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

export default AttendanceOverview;

