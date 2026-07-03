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
    </div>
  );
};

export default Dashboard;

