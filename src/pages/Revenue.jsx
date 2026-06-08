import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  IndianRupee, 
  Layers, 
  ShieldAlert, 
  Coins, 
  Lock, 
  CheckCircle, 
  TrendingUp,
  FileSpreadsheet,
  Users,
  Eye,
  RefreshCcw,
  Ban,
  Unlock,
  X,
  AlertCircle,
  ArrowRight,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  fetchAdminSessions, 
  updateSessionPricing, 
  fetchSessionRevenue, 
  fetchTrainerEarnings, 
  markTrainerEarningPaid, 
  holdTrainerPayout 
} from '../api/billing';
import { getApiErrorMessage } from '../api/axiosClient';
import ErrorBanner from '../components/ErrorBanner';

const PAGE_SIZE = 8;

const Revenue = () => {
  // Redux Auth State
  const user = useSelector((state) => state.auth?.user);
  
  // React Router Navigation Hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Strict admin check (ONLY ADMIN role can modify pricing matrices)
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = String(user.role || '').toUpperCase();
    return role === 'ADMIN';
  }, [user]);

  // Tab State: 'pricing' | 'revenue' | 'ledger'
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'revenue';
  });

  // Core Data States
  const [sessions, setSessions] = useState([]);
  const [trainerEarnings, setTrainerEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Revenue Details Modal State
  const [detailModalSessionId, setDetailModalSessionId] = useState(null);
  const [sessionRevenueDetails, setSessionRevenueDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isFlowCollapsed, setIsFlowCollapsed] = useState(false);

  // Pagination states
  const [revPage, setRevPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);

  // Fetch all required data
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const [sessionsRes, earningsRes] = await Promise.all([
        fetchAdminSessions().catch(() => ({ success: true, data: [] })),
        fetchTrainerEarnings().catch(() => ({ success: true, data: [] }))
      ]);

      const sessionsList = sessionsRes?.data || (Array.isArray(sessionsRes) ? sessionsRes : []);
      const earningsList = earningsRes?.data || (Array.isArray(earningsRes) ? earningsRes : []);

      setSessions(sessionsList);
      setTrainerEarnings(earningsList);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch billing and session summaries.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format currency helper (assuming amount is in Paise)
  const formatCurrency = (amountInPaise) => {
    if (amountInPaise === undefined || amountInPaise === null) return '₹0.00';
    const rupees = Number(amountInPaise) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(rupees);
  };

  // Sessions without any pricing set by admin (blocking student payments)
  const unpricedSessions = useMemo(() => {
    return sessions.filter((s) => {
      const price = s.price ?? s.priceInPaise;
      return price === undefined || price === null;
    });
  }, [sessions]);

  // Fetch detailed revenue per session for modal
  const handleViewRevenueDetails = async (sessionId) => {
    setDetailModalSessionId(sessionId);
    setLoadingDetails(true);
    setSessionRevenueDetails(null);
    try {
      const res = await fetchSessionRevenue(sessionId);
      if (res?.success && res?.data) {
        setSessionRevenueDetails({ ...res.data, _noPricing: !!res.noPricing });
      } else if (res?.data) {
        setSessionRevenueDetails(res.data);
      } else {
        setSessionRevenueDetails(res);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to fetch precise revenue ledger.'));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Payout Management override: Mark Trainer Earning as Paid
  const handleMarkPaid = async (earningId, trainerName, amount) => {
    const formatted = formatCurrency(amount);
    if (!window.confirm(`Confirm payment settlement? Have you manually transferred ${formatted} to ${trainerName}'s bank account?`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const res = await markTrainerEarningPaid(earningId);
      if (res?.success) {
        setSuccessMsg(`Marked payout of ${formatted} for ${trainerName} as PAID.`);
        // Update local trainer earnings list
        setTrainerEarnings((prev) => 
          prev.map((earn) => 
            earn.id === earningId || earn.earningId === earningId
              ? { ...earn, status: 'paid', payoutStatus: 'paid' }
              : earn
          )
        );
      } else {
        throw new Error(res?.message || 'Failed to mark as paid');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to finalize manual settlement state.'));
    }
  };

  // Payout Management override: Hold/Release trainer earnings payout
  const handleToggleHold = async (earningId, trainerName, currentHoldState) => {
    const actionStr = currentHoldState ? 'RELEASE' : 'FREEZE';
    const confirmMsg = `Are you sure you want to ${actionStr} payouts for ${trainerName}?`;
    if (!window.confirm(confirmMsg)) return;

    setError('');
    setSuccessMsg('');
    try {
      // holdTrainerPayout requires the new hold state (e.g. true for hold, false for release)
      const res = await holdTrainerPayout(earningId, !currentHoldState);
      if (res?.success) {
        const statusMsg = !currentHoldState ? 'placed on operational hold' : 'released for settlement';
        setSuccessMsg(`Payout for ${trainerName} has been ${statusMsg}.`);
        // Update local trainer earnings list
        setTrainerEarnings((prev) => 
          prev.map((earn) => 
            earn.id === earningId || earn.earningId === earningId
              ? { ...earn, hold: !currentHoldState, payoutStatus: !currentHoldState ? 'hold' : 'pending' }
              : earn
          )
        );
      } else {
        throw new Error(res?.message || 'Failed to update hold state');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update hold status.'));
    }
  };

  // Financial statistics calculations
  const summaryStats = useMemo(() => {
    let grossRevenue = 0;
    let platformEarnings = 0;
    let trainerEarningsSum = 0;

    sessions.forEach((s) => {
      // In Rupees or Paise? Assume backend provides revenue metrics in Paise
      const gross = Number(s.grossRevenue || s.revenue || 0);
      const tSharePct = Number(s.trainerSharePercentage ?? 50);
      
      grossRevenue += gross;
      trainerEarningsSum += (gross * tSharePct) / 100;
      platformEarnings += (gross * (100 - tSharePct)) / 100;
    });

    return {
      grossRevenue,
      platformEarnings,
      trainerEarningsSum
    };
  }, [sessions]);

  // Session revenue pagination
  const totalRevEntries = sessions.length;
  const totalRevPages = Math.max(1, Math.ceil(totalRevEntries / PAGE_SIZE));
  const activeRevPage = Math.min(Math.max(1, revPage), totalRevPages);
  const revStartIndex = (activeRevPage - 1) * PAGE_SIZE;
  const revEndIndex = Math.min(revStartIndex + PAGE_SIZE, totalRevEntries);
  const paginatedSessions = useMemo(() => {
    return sessions.slice(revStartIndex, revEndIndex);
  }, [sessions, revStartIndex, revEndIndex]);

  // Trainer earnings pagination
  const totalLedgerEntries = trainerEarnings.length;
  const totalLedgerPages = Math.max(1, Math.ceil(totalLedgerEntries / PAGE_SIZE));
  const activeLedgerPage = Math.min(Math.max(1, ledgerPage), totalLedgerPages);
  const ledgerStartIndex = (activeLedgerPage - 1) * PAGE_SIZE;
  const ledgerEndIndex = Math.min(ledgerStartIndex + PAGE_SIZE, totalLedgerEntries);
  const paginatedEarnings = useMemo(() => {
    return trainerEarnings.slice(ledgerStartIndex, ledgerEndIndex);
  }, [trainerEarnings, ledgerStartIndex, ledgerEndIndex]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent tracking-tight">Finances & Revenue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Establish live class pricing, split commission formulas, and authorize payouts to instructors.
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl bg-white hover:bg-slate-50/80 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Ledger</span>
        </button>
      </div>

      {/* Platform Payment Flow Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-850 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80">
            Platform Payment Flow Guide {isFlowCollapsed ? ' (Collapsed)' : ''}
          </p>
          <button
            onClick={() => setIsFlowCollapsed(!isFlowCollapsed)}
            className="p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs font-bold"
            aria-label={isFlowCollapsed ? 'Expand Platform Payment Flow' : 'Collapse Platform Payment Flow'}
          >
            {isFlowCollapsed ? (
              <>
                <span>Expand</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${isFlowCollapsed ? 'max-h-0 opacity-0 mt-0' : 'max-h-[500px] opacity-100 mt-5'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 min-w-0">
              <span className="w-5.5 h-5.5 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">1</span>
              <span className="text-xs font-semibold text-slate-350">Trainer Creates Session</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />
            <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl px-4 py-3 min-w-0 shadow-lg shadow-indigo-950/20">
              <span className="w-5.5 h-5.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-400 text-xs font-black flex items-center justify-center shrink-0">2</span>
              <span className="text-xs font-bold text-amber-200/90">Admin Sets Session Price ← YOU ARE HERE</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 min-w-0">
              <span className="w-5.5 h-5.5 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">3</span>
              <span className="text-xs font-semibold text-slate-350">Student Pays & Enrolls</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed max-w-3xl">
            <strong className="text-slate-200">Important Note:</strong> Students cannot complete payment for a session until the admin has configured the price in the <strong className="text-indigo-300">Pricing & Split Matrix</strong> tab below. Sessions without pricing will block all student transactions.
          </p>
        </div>
      </div>

      {/* Message Banners */}
      {error && <ErrorBanner message={error} />}
      {successMsg && (
        <div className="bg-emerald-50/60 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Global Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl border border-blue-500/5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Accumulation (Gross)</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1.5">{formatCurrency(summaryStats.grossRevenue)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">All courses combined</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-50/5">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Platform Split (Net)</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1.5">{formatCurrency(summaryStats.platformEarnings)}</h3>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Earned by Platform</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 hover:border-slate-350 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-600 rounded-2xl border border-violet-50/5">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Trainer Allocations</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1.5">{formatCurrency(summaryStats.trainerEarningsSum)}</h3>
            <p className="text-[11px] text-violet-600 mt-1 font-semibold">To be settled manually</p>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 border border-slate-200/40 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-250 active:scale-95 ${
            activeTab === 'revenue' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          Revenue Tracking Grid
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-250 active:scale-95 flex items-center gap-1.5 ${
            activeTab === 'pricing' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <span>Pricing & Split Matrix</span>
          {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
          {isAdmin && unpricedSessions.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-black bg-amber-500 text-white rounded-full leading-none">
              {unpricedSessions.length > 9 ? '9+' : unpricedSessions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-250 active:scale-95 ${
            activeTab === 'ledger' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          Trainer Earnings Ledger
        </button>
      </div>

      {/* Tab Contents */}

      {/* 1. Revenue Tracking Grid Tab */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Financial & Performance Dashboard</h2>
            <p className="text-xs text-slate-400 mt-0.5">Performance tracking and platform splits per session.</p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
                <p className="text-sm text-slate-500 font-medium">Fetching session metrics...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No session records found.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50/60 text-slate-450 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4.5">Session Title</th>
                    <th className="px-6 py-4.5">Trainer Name</th>
                    <th className="px-6 py-4.5 text-center">Paid Students</th>
                    <th className="px-6 py-4.5">Gross Revenue</th>
                    <th className="px-6 py-4.5">Platform Allocation</th>
                    <th className="px-6 py-4.5">Trainer Allocation</th>
                    <th className="px-6 py-4.5 text-center">Settlement Status</th>
                    <th className="px-6 py-4.5 text-center">Detailed Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-750">
                  {paginatedSessions.map((s, idx) => {
                    const gross = Number(s.grossRevenue || s.revenue || 0);
                    const tPct = Number(s.trainerSharePercentage ?? 50);
                    const trainerShareAmt = (gross * tPct) / 100;
                    const platformShareAmt = (gross * (100 - tPct)) / 100;
                    const paidStudentsCount = s.paidStudentCount ?? s.studentsCount ?? s.purchasedCount ?? 0;
                    
                    return (
                      <tr key={s.id || s.sessionId || idx} className="hover:bg-slate-50/30 transition-all duration-150">
                        <td className="px-6 py-4 font-bold text-slate-800">{s.classTitle || s.sessionTitle || s.title || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-550">{s.instructor || s.trainerName || '-'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{paidStudentsCount}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">{formatCurrency(gross)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-emerald-600 whitespace-nowrap">
                          {formatCurrency(platformShareAmt)} <span className="text-[10px] text-emerald-500 font-medium">({100 - tPct}%)</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-violet-650 whitespace-nowrap">
                          {formatCurrency(trainerShareAmt)} <span className="text-[10px] text-violet-500 font-medium">({tPct}%)</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            s.payoutStatus === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                              : s.payoutStatus === 'hold'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/50'
                                : 'bg-slate-100/80 text-slate-600 border-slate-200'
                          }`}>
                            {s.payoutStatus || s.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewRevenueDetails(s.id || s.sessionId)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-705 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-3 py-1.5 transition-all shadow-sm active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Breakdown</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && sessions.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-700">{revStartIndex + 1}</span> to <span className="font-bold text-slate-700">{revEndIndex}</span> of <span className="font-bold text-slate-700">{totalRevEntries}</span> sessions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRevPage((p) => Math.max(1, p - 1))}
                  disabled={activeRevPage <= 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 text-xs font-bold text-slate-650 transition-all active:scale-95"
                >
                  Prev
                </button>
                <button
                  onClick={() => setRevPage((p) => Math.min(totalRevPages, p + 1))}
                  disabled={activeRevPage >= totalRevPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 text-xs font-bold text-slate-650 transition-all active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Pricing & Split Matrix Settings Tab (Guarded) */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col w-full">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Current Session Pricing Matrices</h3>
            <p className="text-xs text-slate-400 mt-0.5">Overview of configured prices and splits.</p>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50/60 text-slate-450 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4.5">Session Title</th>
                  <th className="px-6 py-4.5">Trainer</th>
                  <th className="px-6 py-4.5">Share</th>
                  <th className="px-6 py-4.5">Platform Comm.</th>
                  <th className="px-6 py-4.5">Configured Price</th>
                  <th className="px-6 py-4.5 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-650">
                {sessions.map((s, index) => {
                  const price = s.price ?? s.priceInPaise;
                  const trainerSplit = s.trainerSharePercentage ?? 50;
                  const hasPricing = price !== undefined && price !== null;

                  return (
                    <tr
                      key={s.id || s.sessionId || index}
                      className={`hover:bg-slate-50/30 transition-all duration-150 ${!hasPricing ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{s.classTitle || s.sessionTitle || s.title || '-'}</p>
                          {!hasPricing && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-0.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Student payments blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{s.instructor || s.trainerName || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{trainerSplit}%</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{100 - trainerSplit}%</td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">
                        {hasPricing ? formatCurrency(price) : <span className="text-amber-605 font-black italic">⚠ Not set</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasPricing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-50/60 text-emerald-700 border-emerald-200/40">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-50/60 text-amber-705 border-amber-250 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" />
                            Awaiting Price
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Trainer Earnings Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Trainer Payout Settlement Ledger</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review instructor balances, issue manual bank transfer marks, or freeze funds.</p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
                <p className="text-sm text-slate-500 font-medium">Fetching payout records...</p>
              </div>
            ) : trainerEarnings.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <IndianRupee className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No trainer earnings ledger logs found.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50/60 text-slate-450 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4.5">Trainer Name</th>
                    <th className="px-6 py-4.5">Session Info</th>
                    <th className="px-6 py-4.5">Amount Allocated</th>
                    <th className="px-6 py-4.5 text-center">Current Status</th>
                    <th className="px-6 py-4.5 text-center">Hold Status</th>
                    <th className="px-6 py-4.5 text-center">Settlement Actions</th>
                    <th className="px-6 py-4.5 text-center">Hold Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {paginatedEarnings.map((earn, idx) => {
                    const name = earn.trainerName || earn.trainer?.fullName || 'Platform Instructor';
                    const session = earn.sessionTitle || earn.session?.classTitle || 'Live Session';
                    const amount = earn.trainerEarningAllocation ?? earn.amount ?? 0;
                    const payoutStatus = String(earn.payoutStatus || earn.status || 'pending').toLowerCase();
                    const isHold = earn.hold || payoutStatus === 'hold';
                    
                    return (
                      <tr key={earn.id || earn.earningId || idx} className="hover:bg-slate-50/30 transition-all duration-150">
                        <td className="px-6 py-4 font-bold text-slate-800">{name}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{session}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">{formatCurrency(amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            payoutStatus === 'paid'
                              ? 'bg-emerald-55/10 text-emerald-700 border-emerald-200/50'
                              : payoutStatus === 'hold'
                                ? 'bg-rose-55/10 text-rose-700 border-rose-200/50'
                                : 'bg-slate-100/80 text-slate-600 border-slate-200'
                          }`}>
                            {payoutStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isHold ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/40">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Frozen</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-full">Unrestricted</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {payoutStatus === 'paid' ? (
                            <span className="text-xs font-bold text-emerald-600">Settled (Bank Transfer)</span>
                          ) : (
                            <button
                              disabled={isHold}
                              onClick={() => handleMarkPaid(earn.id || earn.earningId, name, amount)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 border border-emerald-200 bg-white hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Mark Settled (Paid)
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {payoutStatus === 'paid' ? (
                            <span className="text-xs text-slate-400">-</span>
                          ) : (
                            <button
                              onClick={() => handleToggleHold(earn.id || earn.earningId, name, isHold)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95 ${
                                isHold 
                                  ? 'text-slate-650 border-slate-300 hover:bg-slate-100 bg-white' 
                                  : 'text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white bg-white'
                              }`}
                            >
                              {isHold ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Release Hold</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Hold Payout</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && trainerEarnings.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-700">{ledgerStartIndex + 1}</span> to <span className="font-bold text-slate-700">{ledgerEndIndex}</span> of <span className="font-bold text-slate-700">{totalLedgerEntries}</span> earnings ledger logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={activeLedgerPage <= 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 text-xs font-bold text-slate-650 transition-all active:scale-95"
                >
                  Prev
                </button>
                <button
                  onClick={() => setLedgerPage((p) => Math.min(totalLedgerPages, p + 1))}
                  disabled={activeLedgerPage >= totalLedgerPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 text-xs font-bold text-slate-650 transition-all active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Revenue Modal/Sidebar */}
      {detailModalSessionId !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-50 text-base">Session Revenue breakdown</h3>
                <p className="text-[11px] text-slate-400 mt-1">Auditing calculations for payments & splits</p>
              </div>
              <button 
                onClick={() => setDetailModalSessionId(null)}
                className="p-2 rounded-xl bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Computing live shares...</p>
                </div>
              ) : sessionRevenueDetails ? (
                <div className="space-y-5">
                  {/* No pricing warning banner */}
                  {sessionRevenueDetails._noPricing && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex items-center gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                      <span className="leading-relaxed">No pricing has been configured for this session yet. Set it in the <strong>Pricing &amp; Split Matrix</strong> tab.</span>
                    </div>
                  )}

                  <div className="pb-3.5 border-b border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {sessionRevenueDetails.classTitle || sessionRevenueDetails.sessionTitle || sessionRevenueDetails.title || 'Platform Session'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5">Trainer: <span className="font-bold text-slate-655">{sessionRevenueDetails.instructor || sessionRevenueDetails.trainerName || '-'}</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/60 p-4.5 rounded-2xl border border-slate-100">
                      <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Paid Enrolments</p>
                      <h5 className="text-lg font-black text-slate-800 mt-2 flex items-center gap-2">
                        <Users className="w-4.5 h-4.5 text-blue-500" />
                        <span>{sessionRevenueDetails.paidStudentCount ?? sessionRevenueDetails.studentsCount ?? 0} students</span>
                      </h5>
                    </div>

                    <div className="bg-slate-50/60 p-4.5 rounded-2xl border border-slate-100">
                      <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Session Price</p>
                      <h5 className="text-lg font-black text-slate-800 mt-2">
                        {formatCurrency(sessionRevenueDetails.sessionPricePaise ?? sessionRevenueDetails.priceInPaise ?? sessionRevenueDetails.price ?? 0)}
                      </h5>
                    </div>
                  </div>

                  <div className="space-y-4 pt-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Gross Income (Total Sum)</span>
                      <span className="font-black text-slate-800 text-sm">
                        {formatCurrency(sessionRevenueDetails.grossRevenuePaise ?? (sessionRevenueDetails.grossRevenue ?? 0) * 100)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Platform Earning Share ({100 - (sessionRevenueDetails.trainerSharePercentage ?? 50)}%)</span>
                      <span className="font-black text-emerald-650 text-sm">
                        {formatCurrency(sessionRevenueDetails.platformEarningPaise ?? (sessionRevenueDetails.platformEarning ?? 0) * 100)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Trainer Earning Share ({sessionRevenueDetails.trainerSharePercentage ?? 50}%)</span>
                      <span className="font-black text-violet-650 text-sm">
                        {formatCurrency(sessionRevenueDetails.trainerEarningPaise ?? (sessionRevenueDetails.trainerEarning ?? 0) * 100)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Settlement State</span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        sessionRevenueDetails.payoutStatus === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                          : sessionRevenueDetails.payoutStatus === 'hold'
                            ? 'bg-rose-55/10 text-rose-705 border-rose-200/50'
                            : 'bg-slate-100/80 text-slate-600 border-slate-200'
                      }`}>
                        {sessionRevenueDetails.payoutStatus || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-rose-600 font-bold">
                  Could not retrieve details for this session.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setDetailModalSessionId(null)}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revenue;
