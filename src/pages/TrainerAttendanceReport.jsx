import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrainerAttendance } from '../api/attendance';
import { toast } from 'react-toastify';
import { Users, UserCheck, Clock, UserX, ArrowLeft, Calendar, BookOpen } from 'lucide-react';

const TrainerAttendanceReport = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [trainerId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getTrainerAttendance(trainerId);
      setData(res?.data || res);
    } catch (err) {
      toast.error('Failed to load trainer attendance summary');
      console.error(err);
    } finally {
      setLoading(false);
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
        <p className="text-gray-500">No data found for this trainer.</p>
        <button onClick={() => navigate('/attendance')} className="mt-4 text-blue-600 hover:underline">
          Go back to Overview
        </button>
      </div>
    );
  }

  // Handle both possible structures: { summary, sessions } or top-level properties
  const summary = data.summary || {
    totalRecords: data.totalRecords || 0,
    totalPresent: data.totalPresent || 0,
    totalLate: data.totalLate || 0,
    totalAbsent: data.totalAbsent || 0,
  };
  
  const sessions = data.sessions || data.occurrences || [];
  const trainerName = data.trainerName || 'Trainer Attendance';

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
          <h2 className="text-2xl font-bold text-gray-900">{trainerName}</h2>
          <p className="text-sm text-gray-500 mt-1">Detailed session attendance summary for this trainer</p>
        </div>
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalRecords || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Present</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalPresent || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Late</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalLate || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Absent</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalAbsent || 0}</p>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Sessions Conducted</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Session Title</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Present</th>
                <th className="px-6 py-4">Late</th>
                <th className="px-6 py-4">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No sessions found for this trainer.
                  </td>
                </tr>
              ) : (
                sessions.map((occ) => (
                  <tr 
                    key={occ.sessionId} 
                    onClick={() => navigate(`/sessions/${occ.sessionId}/attendance`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-600">
                      {occ.sessionTitle || 'Unnamed Session'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <BookOpen size={14} />
                        <span>{occ.courseTitle || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar size={14} />
                        <span>{occ.date ? new Date(occ.date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">{occ.presentCount || 0}</td>
                    <td className="px-6 py-4 font-medium text-amber-600">{occ.lateCount || 0}</td>
                    <td className="px-6 py-4 font-medium text-rose-600">{occ.absentCount || 0}</td>
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

export default TrainerAttendanceReport;
