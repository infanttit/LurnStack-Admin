import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Banknote, CheckCircle2, Clock, IndianRupee, Lock } from 'lucide-react';
import { InfoCard, TabBar } from './components/Shared';
import { MIN_PAYOUT, PAGE_NOTE, payoutTabs } from './constants';
import {
  initialAccounts,
  initialAuditLog,
  initialEarnings,
  initialPayouts,
  initialRefunds,
} from './mockData';
import { formatCurrency } from './utils';
import { usePricingReference } from './hooks/usePricingReference';
import AccountVerification from './sections/AccountVerification';
import AuditLog from './sections/AuditLog';
import EarningsDashboard from './sections/EarningsDashboard';
import ManualCompletion from './sections/ManualCompletion';
import PayoutRequests from './sections/PayoutRequests';
import PricingReference from './sections/PricingReference';
import RefundAdjustments from './sections/RefundAdjustments';
import {
  approveTrainerPayoutRequest,
  fetchAdminTrainerEarnings,
  fetchAdminTrainerPayoutAccount,
  fetchAdminTrainerPayoutAccounts,
  fetchAdminTrainerPayoutRequests,
  markTrainerPayoutPaid,
  markTrainerPayoutProcessing,
  rejectTrainerPayoutAccount,
  rejectTrainerPayoutRequest,
  verifyTrainerPayoutAccount,
} from '../../api/trainerPayouts';
import { getApiErrorMessage } from '../../api/axiosClient';

const unwrapList = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.earnings)) return json.data.earnings;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data?.sessions)) return json.data.sessions;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.earnings)) return json.earnings;
  if (Array.isArray(json?.accounts)) return json.accounts;
  if (Array.isArray(json?.requests)) return json.requests;
  return [];
};

const normalizeEarning = (item) => ({
  id: item.id || item.earningId || item.sessionId || item.session?.id,
  trainerId: item.trainerId || item.trainer?.id,
  trainerName: item.trainerName || item.trainer?.fullName || item.trainer?.name || 'Trainer',
  trainerEmail: item.trainerEmail || item.trainer?.email || '',
  sessionId: item.sessionId || item.session?.id,
  sessionTitle: item.sessionTitle || item.session?.title || item.session?.classTitle || 'Session',
  paidStudents: item.paidStudentCount ?? item.paidStudents ?? 0,
  sessionPrice: item.sessionPricePaise ?? item.sessionPrice ?? item.priceInPaise ?? 0,
  trainerShare: item.trainerSharePercentage ?? item.trainerShare ?? 50,
  platformShare: item.platformCommissionPercentage ?? item.platformShare,
  refundAdjustment: item.refundAdjustmentPaise ?? item.refundAdjustment ?? 0,
  grossRevenue: item.grossRevenuePaise ?? item.grossRevenue,
  trainerEarning: item.trainerEarningPaise ?? item.trainerEarning,
  platformEarning: item.platformEarningPaise ?? item.platformEarning,
  finalPayable: item.finalPayablePaise ?? item.finalPayable,
  status: String(item.payoutStatus || item.status || 'unpaid').toLowerCase(),
  date: item.createdAt || item.updatedAt || item.date || '',
  history: Array.isArray(item.history) ? item.history : [],
  earningRows: Array.isArray(item.earningRows) ? item.earningRows : [],
  raw: item,
});

const statusPriority = {
  requested: 6,
  processing: 5,
  approved: 4,
  unpaid: 3,
  pending: 2,
  rejected: 1,
  paid: 0,
};

const getEarningGroupKey = (item) => {
  if (item.sessionId) return `session:${item.sessionId}`;
  return [
    'session-title',
    item.trainerId || item.trainerEmail || item.trainerName,
    String(item.sessionTitle || '').trim().toLowerCase(),
    item.sessionPrice,
  ].join(':');
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const groupEarningsBySession = (items) => {
  const groups = new Map();

  items.forEach((item) => {
    const key = getEarningGroupKey(item);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        ...item,
        id: item.sessionId || item.id || key,
        sourceRows: [item],
        history: asArray(item.history),
        earningRows: asArray(item.earningRows).length ? asArray(item.earningRows) : [item],
      });
      return;
    }

    const currentPriority = statusPriority[existing.status] ?? 0;
    const nextPriority = statusPriority[item.status] ?? 0;
    const existingGross = Number(existing.grossRevenue ?? existing.paidStudents * existing.sessionPrice);
    const itemGross = Number(item.grossRevenue ?? item.paidStudents * item.sessionPrice);
    const existingTrainerEarning = Number(
      existing.trainerEarning ?? Math.round((existingGross * Number(existing.trainerShare)) / 100)
    );
    const itemTrainerEarning = Number(
      item.trainerEarning ?? Math.round((itemGross * Number(item.trainerShare)) / 100)
    );
    const grossRevenue = existingGross + itemGross;
    const trainerEarning = existingTrainerEarning + itemTrainerEarning;
    const platformEarning =
      Number(existing.platformEarning ?? existingGross - existingTrainerEarning) +
      Number(item.platformEarning ?? itemGross - itemTrainerEarning);
    const refundAdjustment = Number(existing.refundAdjustment || 0) + Number(item.refundAdjustment || 0);

    groups.set(key, {
      ...existing,
      paidStudents: Number(existing.paidStudents || 0) + Number(item.paidStudents || 0),
      grossRevenue,
      trainerEarning,
      platformEarning,
      refundAdjustment,
      finalPayable: Math.max(0, trainerEarning - refundAdjustment),
      date: item.date > existing.date ? item.date : existing.date,
      status: nextPriority > currentPriority ? item.status : existing.status,
      sourceRows: [...existing.sourceRows, item],
      history: [...asArray(existing.history), ...asArray(item.history)],
      earningRows: [
        ...asArray(existing.earningRows),
        ...(asArray(item.earningRows).length ? asArray(item.earningRows) : [item]),
      ],
    });
  });

  return Array.from(groups.values());
};

const normalizeAccount = (item) => ({
  id: item.id || item.accountId,
  trainerId: item.trainerId,
  trainerName: item.trainerName || item.trainer?.fullName || item.trainer?.name || 'Trainer',
  email: item.email || item.trainerEmail || item.trainer?.email || '',
  accountHolder: item.accountHolderName || item.accountHolder || '',
  bankName: item.bankName || '',
  accountNumber: item.accountNumber || item.fullAccountNumber || item.maskedAccountNumber || item.accountNumberLast4 || '',
  ifsc: item.ifsc || item.IFSC || '',
  upi: item.upiId || item.upi || '',
  pan: item.pan || '',
  phone: item.phoneNumber || item.phone || '',
  status: String(item.status || 'pending').toLowerCase(),
  locked: Boolean(item.isLocked || item.locked),
  history: Array.isArray(item.history) ? item.history : [],
});

const normalizePayout = (item) => ({
  id: item.id || item.requestId,
  trainerId: item.trainerId,
  trainerName: item.trainerName || item.trainer?.fullName || item.trainer?.name || 'Trainer',
  requestedAmount: item.requestedAmountPaise ?? item.requestedAmount ?? 0,
  availableBalance: item.availableBalanceAtRequestPaise ?? item.availableBalance ?? 0,
  requestedDate: item.requestedDate || item.createdAt || '',
  status: String(item.status || 'requested').toLowerCase(),
  accountSnapshot:
    typeof item.payoutAccountSnapshot === 'string'
      ? item.payoutAccountSnapshot
      : item.payoutAccountSnapshot?.label ||
        item.payoutAccountSnapshot?.bankName ||
        item.accountSnapshot ||
        '-',
  adminNote: item.adminNote || item.rejectionReason || '',
  utr: item.utrReference || item.utr || '',
  paidDate: item.manualPaidDate || item.paidDate || '',
  history: Array.isArray(item.history) ? item.history : [],
});

const ACTIVE_TAB_STORAGE_KEY = 'lurnstack_trainer_payout_active_tab';
const isValidPayoutTab = (tabId) => payoutTabs.some((tab) => tab.id === tabId);
const getInitialActiveTab = (tabId) => {
  if (isValidPayoutTab(tabId)) return tabId;
  try {
    const savedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return isValidPayoutTab(savedTab) ? savedTab : 'earnings';
  } catch {
    return 'earnings';
  }
};

const TrainerPayoutsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => getInitialActiveTab(searchParams.get('tab')));
  const [earnings, setEarnings] = useState(initialEarnings);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [refunds] = useState(initialRefunds);
  const [auditLog] = useState(initialAuditLog);
  const [filters, setFilters] = useState({
    trainer: 'all',
    session: 'all',
    status: 'all',
    datePreset: 'total',
    from: '',
    to: '',
    query: '',
  });
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0].id);
  const [accountRejectReason, setAccountRejectReason] = useState('');
  const [selectedPayoutId, setSelectedPayoutId] = useState(initialPayouts[0].id);
  const [payoutRejectNote, setPayoutRejectNote] = useState('');
  const [completionForm, setCompletionForm] = useState({ utr: '', paidDate: '', note: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pricing = usePricingReference();
  const refreshPricing = pricing.refresh;

  const loadPayoutData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [earningsRes, accountsRes, requestsRes] = await Promise.all([
        fetchAdminTrainerEarnings({ groupBy: 'session' }).catch((error) => ({ _error: error })),
        fetchAdminTrainerPayoutAccounts().catch((error) => ({ _error: error })),
        fetchAdminTrainerPayoutRequests().catch((error) => ({ _error: error })),
      ]);

      if (!earningsRes?._error) {
        let normalizedEarnings = unwrapList(earningsRes).map(normalizeEarning).filter((item) => item.id);
        if (!normalizedEarnings.length) {
          const fallbackEarningsRes = await fetchAdminTrainerEarnings().catch((error) => ({ _error: error }));
          if (!fallbackEarningsRes?._error) {
            normalizedEarnings = unwrapList(fallbackEarningsRes).map(normalizeEarning).filter((item) => item.id);
          }
        }
        setEarnings(normalizedEarnings);
      }
      if (!accountsRes?._error) {
        setAccounts(unwrapList(accountsRes).map(normalizeAccount).filter((item) => item.id));
      }
      if (!requestsRes?._error) {
        setPayouts(unwrapList(requestsRes).map(normalizePayout).filter((item) => item.id));
      }

      const firstError = earningsRes?._error || accountsRes?._error || requestsRes?._error;
      if (firstError) setError(getApiErrorMessage(firstError, 'Some trainer payout data could not be loaded.'));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load trainer payout data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayoutData();
  }, [loadPayoutData]);

  const refreshPayoutPage = useCallback(async () => {
    await Promise.all([loadPayoutData(), refreshPricing()]);
  }, [loadPayoutData, refreshPricing]);

  const isRefreshing = loading || pricing.loading;

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (isValidPayoutTab(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [activeTab, searchParams]);

  const changeActiveTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams((params) => {
      const nextParams = new URLSearchParams(params);
      nextParams.set('tab', tabId);
      return nextParams;
    }, { replace: true });
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tabId);
    } catch {
      // ignore
    }
  };

  const trainerOptions = useMemo(() => {
    const trainers = earnings.map((item) => ({ id: item.trainerId, name: item.trainerName }));
    return Array.from(new Map(trainers.map((item) => [item.id, item])).values());
  }, [earnings]);

  const filteredEarnings = useMemo(() => {
    const groupedEarnings = groupEarningsBySession(earnings);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfToday);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    const startOfLastWeek = new Date(startOfToday);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    return groupedEarnings.filter((item) => {
      const query = filters.query.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.trainerName.toLowerCase().includes(query) ||
        item.trainerEmail.toLowerCase().includes(query) ||
        item.sessionTitle.toLowerCase().includes(query);
      const matchesTrainer = filters.trainer === 'all' || item.trainerId === filters.trainer;
      const matchesSession = filters.session === 'all' || item.sessionId === filters.session;
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const date = new Date(item.date);
      const hasValidDate = !Number.isNaN(date.getTime());
      let fromOk = true;
      let toOk = true;

      if (filters.datePreset === 'today') {
        fromOk = hasValidDate && date >= startOfToday;
        toOk = hasValidDate && date <= endOfToday;
      } else if (filters.datePreset === 'yesterday') {
        fromOk = hasValidDate && date >= startOfYesterday;
        toOk = hasValidDate && date <= endOfYesterday;
      } else if (filters.datePreset === 'last_week') {
        fromOk = hasValidDate && date >= startOfLastWeek;
        toOk = hasValidDate && date <= endOfToday;
      } else if (filters.datePreset === 'custom') {
        fromOk = !filters.from || (hasValidDate && date >= new Date(`${filters.from}T00:00:00`));
        toOk = !filters.to || (hasValidDate && date <= new Date(`${filters.to}T23:59:59`));
      }

      return matchesQuery && matchesTrainer && matchesSession && matchesStatus && fromOk && toOk;
    });
  }, [earnings, filters]);

  const summary = useMemo(() => {
    return filteredEarnings.reduce(
      (acc, item) => {
        const gross = Number(item.grossRevenue ?? item.paidStudents * item.sessionPrice);
        const trainerEarning = Number(item.trainerEarning ?? Math.round((gross * item.trainerShare) / 100));
        const finalPayable = Number(item.finalPayable ?? Math.max(0, trainerEarning - item.refundAdjustment));
        acc.gross += gross;
        acc.trainer += finalPayable;
        acc.platform += gross - trainerEarning;
        if (item.status !== 'paid') acc.unpaid += finalPayable;
        return acc;
      },
      { gross: 0, trainer: 0, platform: 0, unpaid: 0 }
    );
  }, [filteredEarnings]);

  const activePayoutsByTrainer = useMemo(() => {
    return payouts.reduce((acc, payout) => {
      if (['requested', 'approved', 'processing'].includes(payout.status)) acc[payout.trainerId] = payout;
      return acc;
    }, {});
  }, [payouts]);

  const selectedAccount = accounts.find((item) => item.id === selectedAccountId) || accounts[0];
  const selectedPayout = payouts.find((item) => item.id === selectedPayoutId) || payouts[0];
  const completablePayouts = payouts.filter((item) => ['approved', 'processing', 'paid'].includes(item.status));
  const completionTarget = completablePayouts.find((item) => item.id === selectedPayoutId) || completablePayouts[0];

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const loadAccountDetail = async (accountId) => {
    try {
      const response = await fetchAdminTrainerPayoutAccount(accountId);
      const detail = normalizeAccount(response?.data?.account || response?.account || response?.data || response);
      if (!detail.id) return;
      setAccounts((prev) => prev.map((account) => (account.id === detail.id ? { ...account, ...detail } : account)));
    } catch (detailError) {
      showMessage(getApiErrorMessage(detailError, 'Unable to load payout account details.'));
    }
  };

  const updateAccountStatus = async (status) => {
    if (!selectedAccount?.id) {
      showMessage('Select a payout account first.');
      return;
    }
    if (status === 'rejected' && !accountRejectReason.trim()) {
      showMessage('Rejection reason is required.');
      return;
    }

    const note = status === 'verified' ? 'Account manually verified.' : accountRejectReason.trim();
    try {
      if (status === 'verified') {
        await verifyTrainerPayoutAccount(selectedAccount.id, { note });
      } else {
        await rejectTrainerPayoutAccount(selectedAccount.id, { reason: note });
      }
      setAccountRejectReason('');
      showMessage(`Payout account marked ${status}.`);
      await loadPayoutData();
    } catch (actionError) {
      showMessage(getApiErrorMessage(actionError, `Failed to mark account ${status}.`));
    }
  };

  const updatePayoutStatus = async (status) => {
    if (!selectedPayout?.id) {
      showMessage('Select a payout request first.');
      return;
    }
    if (status === 'rejected' && !payoutRejectNote.trim()) {
      showMessage('Admin note is required to reject a payout request.');
      return;
    }

    if (status === 'approved' && selectedPayout.requestedAmount < MIN_PAYOUT) {
      showMessage('Minimum payout amount is Rs.500.');
      return;
    }

    const note = status === 'rejected' ? payoutRejectNote.trim() : 'Approved for manual bank transfer.';
    try {
      if (status === 'approved') {
        await approveTrainerPayoutRequest(selectedPayout.id, { note });
      } else {
        await rejectTrainerPayoutRequest(selectedPayout.id, { note });
      }
      setPayoutRejectNote('');
      showMessage(`Payout request marked ${status}.`);
      await loadPayoutData();
    } catch (actionError) {
      showMessage(getApiErrorMessage(actionError, `Failed to mark payout ${status}.`));
    }
  };

  const markProcessing = async () => {
    if (!completionTarget?.id || completionTarget.status === 'paid') return;
    try {
      await markTrainerPayoutProcessing(completionTarget.id, { note: 'Manual transfer initiated by admin.' });
      showMessage('Payout marked processing.');
      await loadPayoutData();
    } catch (actionError) {
      showMessage(getApiErrorMessage(actionError, 'Failed to mark payout processing.'));
    }
  };

  const completePayout = async (event) => {
    event.preventDefault();
    if (!completionTarget?.id || completionTarget.status === 'paid') return;
    if (!completionForm.utr.trim() || !completionForm.paidDate) {
      showMessage('UTR/reference number and paid date are required.');
      return;
    }

    try {
      await markTrainerPayoutPaid(completionTarget.id, {
        utrReference: completionForm.utr.trim(),
        manualPaidDate: completionForm.paidDate,
        note: completionForm.note.trim(),
      });
      setCompletionForm({ utr: '', paidDate: '', note: '' });
      showMessage('Manual payout completed and marked paid.');
      await loadPayoutData();
    } catch (actionError) {
      showMessage(getApiErrorMessage(actionError, 'Failed to mark payout paid.'));
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <Header error={error} message={message} summary={summary} />
      <TabBar tabs={payoutTabs} activeTab={activeTab} onChange={changeActiveTab} />
      {activeTab === 'earnings' ? (
        <EarningsDashboard
          filters={filters}
          setFilters={setFilters}
          trainerOptions={trainerOptions}
          sessions={pricing.sessions}
          rows={filteredEarnings}
          loading={isRefreshing}
          onRefresh={refreshPayoutPage}
        />
      ) : null}
      {activeTab === 'pricing' ? <PricingReference pricing={pricing} /> : null}
      {activeTab === 'accounts' ? (
        <AccountVerification
          accounts={accounts}
          selectedAccount={selectedAccount}
          selectedAccountId={selectedAccountId}
          setSelectedAccountId={setSelectedAccountId}
          onLoadAccountDetail={loadAccountDetail}
          activePayout={selectedAccount ? activePayoutsByTrainer[selectedAccount.trainerId] : null}
          rejectReason={accountRejectReason}
          setRejectReason={setAccountRejectReason}
          onUpdateStatus={updateAccountStatus}
        />
      ) : null}
      {activeTab === 'requests' ? (
        <PayoutRequests accounts={accounts} payouts={payouts} selectedPayout={selectedPayout} setSelectedPayoutId={setSelectedPayoutId} rejectNote={payoutRejectNote} setRejectNote={setPayoutRejectNote} onUpdateStatus={updatePayoutStatus} />
      ) : null}
      {activeTab === 'complete' ? (
        <ManualCompletion payouts={payouts} completionTarget={completionTarget} completablePayouts={completablePayouts} setSelectedPayoutId={setSelectedPayoutId} completionForm={completionForm} setCompletionForm={setCompletionForm} onMarkProcessing={markProcessing} onCompletePayout={completePayout} />
      ) : null}
      {activeTab === 'refunds' ? <RefundAdjustments refunds={refunds} /> : null}
      {activeTab === 'audit' ? <AuditLog auditLog={auditLog} /> : null}
    </div>
  );
};

const Header = ({ error, message, summary }) => (
  <>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trainer Payments & Manual Payouts</h1>
        <p className="mt-1 text-sm text-slate-500">{PAGE_NOTE}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Minimum payout {formatCurrency(MIN_PAYOUT)} - 15 day payout cycle - one active request per trainer
        </div>
      </div>
    </div>
    {error ? (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    ) : null}
    {message ? (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
        <CheckCircle2 className="h-4 w-4" />
        <span>{message}</span>
      </div>
    ) : null}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <InfoCard label="Gross Revenue" value={formatCurrency(summary.gross)} detail="Captured paid student revenue" icon={IndianRupee} tone="blue" />
      <InfoCard label="Trainer Payable" value={formatCurrency(summary.trainer)} detail="After refund adjustments" icon={Banknote} tone="emerald" />
      <InfoCard label="Platform Share" value={formatCurrency(summary.platform)} detail="Visible to admin only" icon={Lock} tone="slate" />
      <InfoCard label="Unpaid Balance" value={formatCurrency(summary.unpaid)} detail="Eligible for manual cycle review" icon={Clock} tone="amber" />
    </div>
  </>
);

export default TrainerPayoutsPage;
