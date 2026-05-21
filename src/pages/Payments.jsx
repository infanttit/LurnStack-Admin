import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  HelpCircle,
  TrendingUp,
  RefreshCcw,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  fetchAdminPayments, 
  fetchAdminSessions,
  refundPayment, 
  updatePaymentSettings 
} from '../api/billing';
import { getApiErrorMessage } from '../api/axiosClient';
import ErrorBanner from '../components/ErrorBanner';

const PAGE_SIZE = 10;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refundFilter, setRefundFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Global settings state
  const [globalPlatformFee, setGlobalPlatformFee] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Refund processing state (tracks which paymentId is being refunded)
  const [refundProcessingId, setRefundProcessingId] = useState(null);

  // Sessions without admin pricing (cause of payment failures)
  const [unpricedSessions, setUnpricedSessions] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, sessionsRes] = await Promise.all([
        fetchAdminPayments(),
        fetchAdminSessions().catch(() => null),
      ]);

      // Normalize payments response
      if (paymentsRes?.success && Array.isArray(paymentsRes?.data)) {
        setPayments(paymentsRes.data);
      } else if (Array.isArray(paymentsRes)) {
        setPayments(paymentsRes);
      } else {
        setPayments(paymentsRes?.payments || []);
      }

      // Compute sessions awaiting admin pricing
      if (sessionsRes) {
        const sessionsList = sessionsRes?.data || (Array.isArray(sessionsRes) ? sessionsRes : []);
        const unpriced = sessionsList.filter((s) => {
          const price = s.price ?? s.priceInPaise;
          return price === undefined || price === null;
        });
        setUnpricedSessions(unpriced);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch transaction logs from the gateway.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  // Format timestamp helper
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle manual refund execution
  const handleRefund = async (paymentId, studentName, amount) => {
    const formattedAmount = formatCurrency(amount);
    const confirmMessage = `Are you sure you want to process a refund of ${formattedAmount} for ${studentName}? This will issue a refund command to Razorpay.`;
    
    if (!window.confirm(confirmMessage)) return;

    setRefundProcessingId(paymentId);
    setError('');
    setSuccessMessage('');

    try {
      const res = await refundPayment(paymentId);
      if (res?.success) {
        setSuccessMessage(`Successfully refunded ${formattedAmount} to ${studentName}.`);
        // Refresh local state or re-fetch
        setPayments((prev) => 
          prev.map((pay) => 
            pay.id === paymentId || pay.paymentId === paymentId
              ? { ...pay, status: 'refunded', refundStatus: 'refunded', refunded: true } 
              : pay
          )
        );
      } else {
        // If not explicit success or failed
        throw new Error(res?.message || 'Refund processing failed on gateway.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to trigger gateway refund. Please check API token permissions.'));
    } finally {
      setRefundProcessingId(null);
    }
  };

  // Handle global payment settings update
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!globalPlatformFee || isNaN(globalPlatformFee) || Number(globalPlatformFee) < 0 || Number(globalPlatformFee) > 100) {
      setSettingsError('Please enter a valid percentage between 0 and 100.');
      return;
    }

    setUpdatingSettings(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const res = await updatePaymentSettings({ globalPlatformFee: Number(globalPlatformFee) });
      if (res?.success) {
        setSettingsSuccess('Platform commission rate updated successfully.');
        setGlobalPlatformFee('');
      } else {
        throw new Error(res?.message || 'Failed to update settings');
      }
    } catch (err) {
      setSettingsError(getApiErrorMessage(err, 'Could not save payment configurations.'));
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Filter and Search logic
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const studentName = String(pay.studentName || pay.student?.fullName || '').toLowerCase();
      const sessionTitle = String(pay.sessionTitle || pay.session?.classTitle || '').toLowerCase();
      const razorpayId = String(pay.razorpayPaymentId || pay.paymentId || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch = 
        !q || 
        studentName.includes(q) || 
        sessionTitle.includes(q) || 
        razorpayId.includes(q);

      const status = String(pay.paymentStatus || pay.status || '').toLowerCase();
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'captured' && status === 'captured') ||
        (statusFilter === 'failed' && status === 'failed') ||
        (statusFilter === 'created' && status === 'created') ||
        (statusFilter === 'refunded' && (status === 'refunded' || pay.refundStatus === 'refunded' || pay.refunded));

      const isRefunded = pay.refunded || pay.refundStatus === 'refunded' || status === 'refunded';
      const matchesRefund = 
        refundFilter === 'all' ||
        (refundFilter === 'refunded' && isRefunded) ||
        (refundFilter === 'not_refunded' && !isRefunded);

      return matchesSearch && matchesStatus && matchesRefund;
    });
  }, [payments, searchTerm, statusFilter, refundFilter]);

  // Pagination logic
  const totalEntries = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, refundFilter]);

  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  
  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, startIndex, endIndex]);

  // Statistics summaries
  const stats = useMemo(() => {
    let gross = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let refundedAmount = 0;

    payments.forEach((pay) => {
      const status = String(pay.paymentStatus || pay.status || '').toLowerCase();
      const amount = Number(pay.amountPaid || pay.amount || 0);

      if (status === 'captured' || status === 'success') {
        gross += amount;
        successfulCount += 1;
      } else if (status === 'failed') {
        failedCount += 1;
      }

      if (pay.refunded || pay.refundStatus === 'refunded' || status === 'refunded') {
        refundedAmount += amount;
      }
    });

    return {
      gross,
      successfulCount,
      failedCount,
      refundedAmount
    };
  }, [payments]);

  // Helper for status badge styling
  const getStatusBadgeClass = (status, isRefunded) => {
    const cleanStatus = String(status || '').toLowerCase();
    if (isRefunded || cleanStatus === 'refunded') {
      return 'bg-amber-50 text-amber-700 border-amber-200/50';
    }
    if (cleanStatus === 'captured' || cleanStatus === 'success') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
    }
    if (cleanStatus === 'failed') {
      return 'bg-rose-50 text-rose-700 border-rose-200/50';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = new Set([1, totalPages]);
    for (let p = activePage - 1; p <= activePage + 1; p += 1) {
      if (p > 1 && p < totalPages) items.add(p);
    }
    const sorted = Array.from(items).sort((a, b) => a - b);
    const withGaps = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && current - prev > 1) withGaps.push('gap');
      withGaps.push(current);
    }
    return withGaps;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Student Ledger & Payments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time student transactions, coordinate refund gateways, and fine-tune platform fee settings.
          </p>
        </div>
        <button 
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Gateway</span>
        </button>
      </div>

      {/* Main Alert Banners */}
      {error && <ErrorBanner message={error} />}

      {/* Sessions Awaiting Pricing — Explains Failed Payments */}
      {!loading && unpricedSessions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-amber-900">
                {unpricedSessions.length} Session{unpricedSessions.length > 1 ? 's' : ''} Without Admin Pricing — Causing Payment Failures!
              </h3>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Trainers created these sessions but <strong>admin has not set the price yet</strong>. Students cannot pay for unpriced sessions — this is why you may see failed payment records below.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {unpricedSessions.slice(0, 3).map((s) => (
                  <span
                    key={s.id || s.sessionId}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 rounded-lg px-2 py-0.5"
                  >
                    {s.classTitle || s.sessionTitle || s.title || 'Untitled'}
                  </span>
                ))}
                {unpricedSessions.length > 3 && (
                  <span className="text-[10px] font-bold text-amber-600">+{unpricedSessions.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/revenue"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm whitespace-nowrap"
          >
            <span>Fix Pricing Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Settled (Gross)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(stats.gross)}</h3>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <span>{stats.successfulCount} transactions completed</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Refunded</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{formatCurrency(stats.refundedAmount)}</h3>
            <p className="text-xs text-amber-600 mt-1">Returned through Razorpay</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed Attempts</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.failedCount}</h3>
            <p className="text-xs text-rose-500 mt-1">Declined or aborted payments</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Payments Recorded</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{payments.length}</h3>
            <p className="text-xs text-blue-600 mt-1">Logs in system db</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Transaction List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Control Bar */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit trail of Razorpay logs.</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full sm:w-72 shrink-0">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, class, order ID..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Advanced Filter Badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters:</span>
                </div>
                
                {/* Status Filter Dropdown */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-slate-400 mr-1.5 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="all">All</option>
                    <option value="captured">Captured / Success</option>
                    <option value="failed">Failed</option>
                    <option value="created">Created</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Refund Status Filter Dropdown */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-slate-400 mr-1.5 font-medium">Refund state:</span>
                  <select
                    value={refundFilter}
                    onChange={(e) => setRefundFilter(e.target.value)}
                    className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="all">All</option>
                    <option value="refunded">Refunded Only</option>
                    <option value="not_refunded">Non-Refunded</option>
                  </select>
                </div>

                {/* Reset button */}
                {(searchTerm || statusFilter !== 'all' || refundFilter !== 'all') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setRefundFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 py-1 px-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Fetching transaction ledger...</p>
                </div>
              ) : paginatedPayments.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">No Transactions Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Try modifying your search or filter values to find specific transaction records.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-12">#</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Session Class</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Gateway ID</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4 text-center">Refund Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {paginatedPayments.map((pay, index) => {
                      const studentName = pay.studentName || pay.student?.fullName || 'Guest Student';
                      const sessionTitle = pay.sessionTitle || pay.session?.classTitle || 'Platform Class';
                      const status = pay.paymentStatus || pay.status || 'unknown';
                      const amount = pay.amountPaid ?? pay.amount ?? 0;
                      const razorpayId = pay.razorpayPaymentId || pay.paymentId || '-';
                      const paidDate = pay.paidDate || pay.createdAt || pay.updatedAt || '';
                      
                      const isRefunded = pay.refunded || pay.refundStatus === 'refunded' || status.toLowerCase() === 'refunded';
                      
                      // Allow refunding only if state is captured/success and hasn't been refunded yet
                      const isRefundable = !isRefunded && (status.toLowerCase() === 'captured' || status.toLowerCase() === 'success');
                      
                      const actualIndex = startIndex + index + 1;

                      return (
                        <tr key={pay.id || pay.paymentId || index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-400 text-xs">{actualIndex}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800">{studentName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-600 block max-w-[180px] truncate" title={sessionTitle}>
                              {sessionTitle}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">{formatCurrency(amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(status, isRefunded)}`}>
                              {isRefunded ? 'refunded' : status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-slate-50 border border-slate-200/50 text-slate-500 px-2 py-0.5 rounded font-mono select-all">
                              {razorpayId}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {formatTimestamp(paidDate)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isRefunded ? (
                              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/30">Refunded</span>
                            ) : isRefundable ? (
                              <button
                                onClick={() => handleRefund(pay.id || pay.paymentId, studentName, amount)}
                                disabled={refundProcessingId !== null}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                              >
                                {refundProcessingId === (pay.id || pay.paymentId) ? 'Triggering...' : 'Refund'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredPayments.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
                <div>
                  Showing <span className="font-bold text-slate-700">{totalEntries ? startIndex + 1 : 0}</span> to <span className="font-bold text-slate-700">{endIndex}</span> of <span className="font-bold text-slate-700">{totalEntries}</span> entries
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage <= 1}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors bg-slate-50 text-slate-600"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageItems().map((item, idx) =>
                      item === 'gap' ? (
                        <span key={`gap-${idx}`} className="px-1 text-slate-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${
                            item === activePage
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage >= totalPages}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors bg-slate-50 text-slate-600"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Global Payment Settings Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Global Payment Settings</h3>
                <p className="text-xs text-slate-400">Adjust overall platform commission rate.</p>
              </div>
            </div>

            {settingsError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-2xl text-xs">
                {settingsError}
              </div>
            )}

            {settingsSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-2xl text-xs font-medium">
                {settingsSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Global Platform Fee (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Enter percentage (e.g. 15)"
                    value={globalPlatformFee}
                    onChange={(e) => setGlobalPlatformFee(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none pr-8 font-semibold text-slate-700"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 text-sm font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Adjusting this changes the base rate platform splits for trainer payouts unless overridden in individual session matrices.
                </p>
              </div>

              <button
                type="submit"
                disabled={updatingSettings}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
              >
                {updatingSettings ? 'Saving...' : 'Apply Fee Adjustment'}
              </button>
            </form>
          </div>

          {/* Quick Informational card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm">Fintech & Razorpay Gateway</h4>
            <p className="text-xs text-blue-200 leading-relaxed">
              All transactions listed are fetched directly from our platform's live databases, linked to webhooks connected with Razorpay.
            </p>
            <div className="text-[10px] text-blue-300 border-t border-blue-800/60 pt-3">
              <span className="font-bold">Security Note:</span> Refunding is final. Funds are transferred back to the original source bank account within 5-7 business days.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
