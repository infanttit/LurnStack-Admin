import React, { useEffect, useMemo, useState } from 'react';
import { UserCheck, Users } from 'lucide-react';
import { fetchAdminDashboardSummary } from '../../api/adminDashboard';
import AdminSummaryCard from '../../components/AdminSummaryCard';
import ErrorBanner from '../../components/ErrorBanner';
import { getApiErrorMessage } from '../../api/axiosClient';

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalStudents: 0, totalTrainers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const summaryResponse = await fetchAdminDashboardSummary();

        if (!active) return;

        if (!summaryResponse?.success) {
          throw new Error('Failed to load dashboard summary');
        }

        setSummary({
          totalStudents: summaryResponse.data?.totalStudents ?? 0,
          totalTrainers: summaryResponse.data?.totalTrainers ?? 0,
        });
      } catch (err) {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Unable to load admin dashboard data'));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Students',
        value: summary.totalStudents,
        detail: 'Active student accounts',
        icon: Users,
        accentClass: 'bg-emerald-500',
      },
      {
        label: 'Total Trainers',
        value: summary.totalTrainers,
        detail: 'Active trainer accounts',
        icon: UserCheck,
        accentClass: 'bg-sky-500',
      },
    ],
    [summary]
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Live admin metrics for students, trainers, and system status.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600 border border-slate-200">
            {isLoading ? 'Refreshing metrics…' : 'Data last fetched from live API'}
          </div>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaryCards.map((stat) => (
          <AdminSummaryCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Attendance Quick Search</h2>
        <p className="mt-1 text-sm text-slate-500">Quickly view complete attendance history across all courses and sessions for any Student or Trainer.</p>
        
        <form 
          className="mt-6 flex flex-col sm:flex-row gap-3 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            const id = e.target.userId.value.trim();
            if (id) {
              // Trainer attendance (their own presence) is also tracked under the student attendance structure.
              window.location.href = `/students/${id}/attendance`;
            }
          }}
        >
          <select 
            name="userType"
            className="w-full sm:w-48 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="student">Student</option>
            <option value="trainer">Trainer (Own Attendance)</option>
          </select>
          
          <input 
            name="userId"
            type="text"
            placeholder="Enter User ID..."
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
          
          <button 
            type="submit"
            className="w-full sm:w-auto shrink-0 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            View Attendance
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;

