import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
  X
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
  
  // Strict admin check (ONLY ADMIN role can modify pricing matrices)
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = String(user.role || '').toUpperCase();
    return role === 'ADMIN';
  }, [user]);

  // Tab State: 'pricing' | 'revenue' | 'ledger'
  const [activeTab, setActiveTab] = useState('revenue');

  // Core Data States
  const [sessions, setSessions] = useState([]);
  const [trainerEarnings, setTrainerEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pricing Form State
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [priceInRupees, setPriceInRupees] = useState('');
  const [trainerShare, setTrainerShare] = useState('50');
  const [platformCommission, setPlatformCommission] = useState('50');
  const [pricingSubmitting, setPricingSubmitting] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingSuccess, setPricingSuccess] = useState('');

  // Revenue Details Modal State
  const [detailModalSessionId, setDetailModalSessionId] = useState(null);
  const [sessionRevenueDetails, setSessionRevenueDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Automatically update platform fee when trainer share changes, and vice-versa
  const handleTrainerShareChange = (val) => {
    setTrainerShare(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPlatformCommission((100 - num).toString());
    }
  };

  const handlePlatformCommissionChange = (val) => {
    setPlatformCommission(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setTrainerShare((100 - num).toString());
    }
  };

  // Submit pricing matrix update (Admin Only)
  const handleUpdatePricing = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setPricingError('Unauthorized: Only platform administrators are permitted to define live pricing.');
      return;
    }

    if (!selectedSessionId) {
      setPricingError('Please select a target session.');
      return;
    }

    if (!priceInRupees || isNaN(priceInRupees) || Number(priceInRupees) < 0) {
      setPricingError('Please enter a valid non-negative price.');
      return;
    }

    const tShare = Number(trainerShare);
    const pComm = Number(platformCommission);
    if (isNaN(tShare) || isNaN(pComm) || tShare < 0 || pComm < 0 || (tShare + pComm) !== 100) {
      setPricingError('Split matrix must sum up to exactly 100%.');
      return;
    }

    setPricingSubmitting(true);
    setPricingError('');
    setPricingSuccess('');

    // Convert Rupees to Paise
    const priceInPaise = Math.round(Number(priceInRupees) * 100);

    try {
      const res = await updateSessionPricing(selectedSessionId, {
        priceInPaise,
        trainerSharePercentage: tShare,
        platformCommissionPercentage: pComm,
        currency: 'INR'
      });

      if (res?.success) {
        setPricingSuccess('Pricing configuration and split matrix updated successfully.');
        
        // Update local session list with new values
        setSessions((prev) => 
          prev.map((s) => 
            s.id === selectedSessionId || s.sessionId === selectedSessionId
              ? { 
                  ...s, 
                  price: priceInPaise,
                  priceInPaise,
                  trainerSharePercentage: tShare,
                  platformCommissionPercentage: pComm
                }
              : s
          )
        );

        // Reset Form partially
        setPriceInRupees('');
      } else {
        throw new Error(res?.message || 'Failed to update pricing on server.');
      }
    } catch (err) {
      setPricingError(getApiErrorMessage(err, 'Failed to update session pricing matrices.'));
    } finally {
      setPricingSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finances & Revenue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Establish live class pricing, split commission formulas, and authorize payouts to instructors.
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Ledger</span>
        </button>
      </div>

      {/* Message Banners */}
      {error && <ErrorBanner message={error} />}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Global Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Accumulation (Gross)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(summaryStats.grossRevenue)}</h3>
            <p className="text-xs text-slate-400 mt-1">All courses combined</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Split (Net)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(summaryStats.platformEarnings)}</h3>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Earned by Platform</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-600 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trainer Allocations</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(summaryStats.trainerEarningsSum)}</h3>
            <p className="text-xs text-violet-600 mt-1 font-medium">To be settled manually</p>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all px-1 ${
              activeTab === 'revenue' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Revenue Tracking Grid
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-1.5 ${
              activeTab === 'pricing' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Pricing & Split Matrix</span>
            {!isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all px-1 ${
              activeTab === 'ledger' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Trainer Earnings Ledger
          </button>
        </div>
      </div>

      {/* Tab Contents */}

      {/* 1. Revenue Tracking Grid Tab */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Financial & Performance Dashboard</h2>
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
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Session Title</th>
                    <th className="px-6 py-4">Trainer Name</th>
                    <th className="px-6 py-4 text-center">Paid Students</th>
                    <th className="px-6 py-4">Gross Revenue</th>
                    <th className="px-6 py-4">Platform Allocation</th>
                    <th className="px-6 py-4">Trainer Allocation</th>
                    <th className="px-6 py-4 text-center">Settlement Status</th>
                    <th className="px-6 py-4 text-center">Detailed Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {paginatedSessions.map((s, idx) => {
                    const gross = Number(s.grossRevenue || s.revenue || 0);
                    const tPct = Number(s.trainerSharePercentage ?? 50);
                    const trainerShareAmt = (gross * tPct) / 100;
                    const platformShareAmt = (gross * (100 - tPct)) / 100;
                    const paidStudentsCount = s.paidStudentCount ?? s.studentsCount ?? s.purchasedCount ?? 0;
                    
                    return (
                      <tr key={s.id || s.sessionId || idx} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-800">{s.classTitle || s.sessionTitle || s.title || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{s.instructor || s.trainerName || '-'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{paidStudentsCount}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">{formatCurrency(gross)}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-emerald-600 whitespace-nowrap">
                          {formatCurrency(platformShareAmt)} ({100 - tPct}%)
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-violet-600 whitespace-nowrap">
                          {formatCurrency(trainerShareAmt)} ({tPct}%)
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${
                            s.payoutStatus === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                              : s.payoutStatus === 'hold'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/50'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {s.payoutStatus || s.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewRevenueDetails(s.id || s.sessionId)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-all"
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
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-700">{revStartIndex + 1}</span> to <span className="font-bold text-slate-700">{revEndIndex}</span> of <span className="font-bold text-slate-700">{totalRevEntries}</span> sessions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRevPage((p) => Math.max(1, p - 1))}
                  disabled={activeRevPage <= 1}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setRevPage((p) => Math.min(totalRevPages, p + 1))}
                  disabled={activeRevPage >= totalRevPages}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Set Session Pricing</h3>
                <p className="text-xs text-slate-400">Apply fee splits on trainer-created courses.</p>
              </div>
            </div>

            {/* Check role rules strictly */}
            {!isAdmin ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">Access Denied:</span> Under strict platform business rules, trainers are prohibited from defining price matrices. You must be an <span className="font-semibold">ADMIN</span> to submit pricing modifications.
                </div>
              </div>
            ) : null}

            {pricingError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-2xl text-xs">
                {pricingError}
              </div>
            )}

            {pricingSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-2xl text-xs font-semibold">
                {pricingSuccess}
              </div>
            )}

            <form onSubmit={handleUpdatePricing} className="space-y-4">
              {/* Target Session Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Session Name</label>
                <select
                  disabled={!isAdmin}
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium text-slate-700 disabled:opacity-50"
                >
                  <option value="">-- Choose Session / Live Class --</option>
                  {sessions.map((s) => (
                    <option key={s.id || s.sessionId} value={s.id || s.sessionId}>
                      {s.classTitle || s.sessionTitle || s.title} ({s.instructor || 'No instructor'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price in Rupees */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price in Rupees (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    disabled={!isAdmin}
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={priceInRupees}
                    onChange={(e) => setPriceInRupees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Sent as integer Paise to the payment settlement gateway.</p>
              </div>

              {/* Currency Indicator */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Currency Indicator</label>
                <input
                  type="text"
                  value="INR"
                  readOnly
                  className="w-full px-3 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl outline-none font-semibold text-slate-400"
                />
              </div>

              {/* Splits Matrix (Trainer / Platform) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trainer Share (%)</label>
                  <div className="relative">
                    <input
                      disabled={!isAdmin}
                      type="number"
                      min="0"
                      max="100"
                      value={trainerShare}
                      onChange={(e) => handleTrainerShareChange(e.target.value)}
                      className="w-full pr-7 pl-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 disabled:opacity-50"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform Comm (%)</label>
                  <div className="relative">
                    <input
                      disabled={!isAdmin}
                      type="number"
                      min="0"
                      max="100"
                      value={platformCommission}
                      onChange={(e) => handlePlatformCommissionChange(e.target.value)}
                      className="w-full pr-7 pl-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 disabled:opacity-50"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isAdmin || pricingSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {pricingSubmitting ? 'Submitting Matrix...' : 'Save Pricing Setup'}
              </button>
            </form>
          </div>

          {/* Pricing Ledger Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Current Session Pricing Matrices</h3>
              <p className="text-xs text-slate-400 mt-0.5">Overview of configured prices and splits.</p>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Session Title</th>
                    <th className="px-6 py-4">Trainer Share</th>
                    <th className="px-6 py-4">Platform Commission</th>
                    <th className="px-6 py-4">Configured Price</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                  {sessions.map((s, index) => {
                    const price = s.price ?? s.priceInPaise;
                    const trainerSplit = s.trainerSharePercentage ?? 50;
                    const hasPricing = price !== undefined && price !== null;

                    return (
                      <tr key={s.id || s.sessionId || index} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-800">{s.classTitle || s.sessionTitle || s.title || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{trainerSplit}%</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{100 - trainerSplit}%</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {hasPricing ? formatCurrency(price) : <span className="text-slate-400 italic">Not set</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {hasPricing ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200/40">Active</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-slate-50 text-slate-500 border-slate-200">Awaiting Pricing</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Trainer Earnings Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Trainer Name</th>
                    <th className="px-6 py-4">Session Info</th>
                    <th className="px-6 py-4">Amount Allocated</th>
                    <th className="px-6 py-4 text-center">Current Status</th>
                    <th className="px-6 py-4 text-center">Hold Status</th>
                    <th className="px-6 py-4 text-center">Settlement Actions</th>
                    <th className="px-6 py-4 text-center">Hold Control</th>
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
                      <tr key={earn.id || earn.earningId || idx} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{name}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{session}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{formatCurrency(amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                            payoutStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                              : payoutStatus === 'hold'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/50'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {payoutStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isHold ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/40">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Frozen</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Unrestricted</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {payoutStatus === 'paid' ? (
                            <span className="text-xs font-bold text-emerald-600">Settled (Bank Transfer)</span>
                          ) : (
                            <button
                              disabled={isHold}
                              onClick={() => handleMarkPaid(earn.id || earn.earningId, name, amount)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95 ${
                                isHold 
                                  ? 'text-slate-600 border-slate-300 hover:bg-slate-100' 
                                  : 'text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white'
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
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-700">{ledgerStartIndex + 1}</span> to <span className="font-bold text-slate-700">{ledgerEndIndex}</span> of <span className="font-bold text-slate-700">{totalLedgerEntries}</span> earnings ledger logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                  disabled={activeLedgerPage <= 1}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setLedgerPage((p) => Math.min(totalLedgerPages, p + 1))}
                  disabled={activeLedgerPage >= totalLedgerPages}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Session Revenue breakdown</h3>
                <p className="text-xs text-slate-300 mt-0.5">Auditing calculations for payments & splits</p>
              </div>
              <button 
                onClick={() => setDetailModalSessionId(null)}
                className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
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
                <div className="space-y-4">
                  {/* No pricing warning banner */}
                  {sessionRevenueDetails._noPricing && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No pricing has been configured for this session yet. Set it in the <strong>Pricing &amp; Split Matrix</strong> tab.</span>
                    </div>
                  )}

                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-slate-800 text-base">
                      {sessionRevenueDetails.classTitle || sessionRevenueDetails.sessionTitle || sessionRevenueDetails.title || 'Platform Session'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Trainer: {sessionRevenueDetails.instructor || sessionRevenueDetails.trainerName || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Paid Enrolments</p>
                      <h5 className="text-lg font-black text-slate-800 mt-1 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>{sessionRevenueDetails.paidStudentCount ?? sessionRevenueDetails.studentsCount ?? 0} students</span>
                      </h5>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Session Price</p>
                      <h5 className="text-lg font-black text-slate-800 mt-1">
                        {formatCurrency(sessionRevenueDetails.sessionPricePaise ?? sessionRevenueDetails.priceInPaise ?? sessionRevenueDetails.price ?? 0)}
                      </h5>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Gross Income (Total Sum)</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {/* grossRevenuePaise is in paise; grossRevenue is in rupees — use paise for formatCurrency */}
                        {formatCurrency(sessionRevenueDetails.grossRevenuePaise ?? (sessionRevenueDetails.grossRevenue ?? 0) * 100)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-500">Platform Earning Share ({100 - (sessionRevenueDetails.trainerSharePercentage ?? 50)}%)</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {/* Use pre-computed platformEarningPaise or convert platformEarning (rupees) to paise */}
                        {formatCurrency(sessionRevenueDetails.platformEarningPaise ?? (sessionRevenueDetails.platformEarning ?? 0) * 100)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-500">Trainer Earning Share ({sessionRevenueDetails.trainerSharePercentage ?? 50}%)</span>
                      <span className="font-bold text-violet-600 text-sm">
                        {/* Use pre-computed trainerEarningPaise or convert trainerEarning (rupees) to paise */}
                        {formatCurrency(sessionRevenueDetails.trainerEarningPaise ?? (sessionRevenueDetails.trainerEarning ?? 0) * 100)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-500">Settlement State</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        sessionRevenueDetails.payoutStatus === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                          : sessionRevenueDetails.payoutStatus === 'hold'
                            ? 'bg-rose-50 text-rose-700 border-rose-200/50'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {sessionRevenueDetails.payoutStatus || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-rose-600">
                  Could not retrieve details for this session.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setDetailModalSessionId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
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
