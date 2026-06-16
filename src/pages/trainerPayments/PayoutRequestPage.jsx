import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, IndianRupee, KeyRound, RefreshCw, Send, Wallet } from 'lucide-react';
import { createTrainerPayoutRequest, fetchTrainerPayoutBalance } from '../../api/trainerPayouts';
import { getApiErrorMessage, trainerTokenStorage } from '../../api/axiosClient';
import ErrorBanner from '../../components/ErrorBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import logoImage from '../../Assets/Logo/Logo2.png';

const paiseToRupees = (value) => Number(value || 0) / 100;

const formatCurrency = (paise) => {
  const amount = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const firstNumber = (...values) => {
  const match = values.find((value) => Number.isFinite(Number(value)));
  return match === undefined ? 0 : Number(match);
};

const normalizeBalance = (json) => {
  const source = json?.data || json?.balance || json?.summary || json || {};
  const totalEarnedPaise = firstNumber(
    source.totalEarnedPaise,
    source.totalTrainerEarningsPaise,
    source.totalPayablePaise,
    source.totalUnpaidEarningsPaise
  );
  const totalPaidPaise = firstNumber(
    source.totalPaidPaise,
    source.totalPayoutPaidPaise,
    source.paidPayoutAmountPaise,
    source.paidAmountPaise
  );
  const totalUnpaidEarningsPaise = firstNumber(
    source.totalUnpaidEarningsPaise,
    source.unpaidBalancePaise,
    totalEarnedPaise && totalPaidPaise ? Math.max(totalEarnedPaise - totalPaidPaise, 0) : undefined
  );
  const pendingCycleEarningsPaise = firstNumber(source.pendingCycleEarningsPaise, source.pendingAmountPaise);
  const lockedAmountPaise = firstNumber(source.lockedAmountPaise, source.lockedBalancePaise);
  const backendAvailablePaise = firstNumber(source.availableBalancePaise, source.availablePaise, source.availableBalance);
  const remainingFromPaidPaise = totalEarnedPaise && totalPaidPaise ? Math.max(totalEarnedPaise - totalPaidPaise, 0) : 0;
  const realUnpaidPaise = remainingFromPaidPaise || totalUnpaidEarningsPaise || pendingCycleEarningsPaise || backendAvailablePaise;
  const availableBalancePaise = Math.max(realUnpaidPaise - lockedAmountPaise, 0);
  const minimumPayoutPaise = firstNumber(source.minimumPayoutPaise, 50000);
  const hasActiveRequest = Boolean(source.hasActiveRequest);
  const accountVerified = !['ACCOUNT_NOT_VERIFIED', 'ACCOUNT_MISSING'].includes(source.blockReason);
  const canRequest = accountVerified && !hasActiveRequest && availableBalancePaise >= minimumPayoutPaise;

  return {
    ...source,
    totalEarnedPaise,
    totalPaidPaise,
    totalUnpaidEarningsPaise,
    lockedAmountPaise,
    availableBalancePaise,
    minimumPayoutPaise,
    pendingCycleEarningsPaise: 0,
    canRequest,
    blockReason: canRequest ? null : source.blockReason,
  };
};

const getBlockLabel = (reason) => {
  const labels = {
    ACCOUNT_NOT_VERIFIED: 'Verify your payout account before requesting payout.',
    ACTIVE_REQUEST_EXISTS: 'You already have an active payout request.',
    INSUFFICIENT_BALANCE: 'Minimum payout balance is not available yet.',
    PAYOUT_CYCLE_NOT_OPEN: 'Payout request is allowed from unpaid earnings. Please refresh or contact admin if this still appears.',
  };
  return labels[reason] || reason || 'Payout request is currently unavailable.';
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 bg-slate-50 px-4 py-3">
    <span className="text-sm font-semibold text-slate-600">{label}</span>
    <span className="text-right text-sm font-bold text-slate-900">{value}</span>
  </div>
);

const Metric = ({ label, value, hint, tone = 'slate' }) => {
  const toneClass = tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-2 text-sm font-medium text-slate-500">{hint}</p> : null}
    </div>
  );
};

const PayoutRequestPage = () => {
  const [tokenDraft, setTokenDraft] = useState(() => trainerTokenStorage.get());
  const [balance, setBalance] = useState({});
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableRupees = useMemo(() => paiseToRupees(balance.availableBalancePaise), [balance.availableBalancePaise]);
  const minimumRupees = useMemo(() => paiseToRupees(balance.minimumPayoutPaise || 50000), [balance.minimumPayoutPaise]);
  const canRequest = Boolean(balance.canRequest);
  const blockReason = balance.blockReason || (!canRequest ? 'INSUFFICIENT_BALANCE' : '');

  const loadBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await fetchTrainerPayoutBalance();
      const nextBalance = normalizeBalance(json);
      setBalance(nextBalance);
      setAmount(paiseToRupees(nextBalance.availableBalancePaise || 0).toString());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to fetch payout balance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const saveToken = () => {
    trainerTokenStorage.set(tokenDraft.trim());
    setSuccess('Trainer token saved locally.');
    loadBalance();
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError('Enter a valid payout amount.');
      return;
    }
    if (amountNumber > availableRupees) {
      setError('Requested amount cannot exceed available payout balance.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createTrainerPayoutRequest({
        amountPaise: Math.round(amountNumber * 100),
        requestedAmountPaise: Math.round(amountNumber * 100),
        trainerNote: note.trim() || undefined,
      });
      setSuccess('Payout request submitted successfully.');
      setNote('');
      await loadBalance();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to submit payout request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="LurnStack" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Trainer Payout Request</h1>
              <p className="text-sm text-slate-500">Request payout from verified unpaid trainer earnings.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadBalance}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <section className="mb-6 border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">Trainer API Token</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="password"
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
              placeholder="Paste trainer JWT token"
              autoComplete="off"
            />
            <button type="button" onClick={saveToken} className="bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800">
              Save Token
            </button>
          </div>
        </section>

        {error ? <ErrorBanner message={error} /> : null}
        {success ? <div className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</div> : null}

        {loading ? (
          <LoadingSpinner label="Loading payout balance..." />
        ) : (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-4">
              <Metric label="Total earned" value={formatCurrency(balance.totalEarnedPaise || balance.totalUnpaidEarningsPaise)} hint="Trainer final payable earned" />
              <Metric label="Available payout" value={formatCurrency(balance.availableBalancePaise)} hint="Earned minus paid and locked" tone="emerald" />
              <Metric label="Total paid" value={formatCurrency(balance.totalPaidPaise)} hint="Manual payouts already completed" tone="amber" />
              <Metric label="Locked amount" value={formatCurrency(balance.lockedAmountPaise)} hint="Already requested or processing" />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <form onSubmit={submitRequest} className="border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Payout request</h2>
                    <p className="text-sm font-medium text-slate-500">Minimum payout amount is {formatCurrency(balance.minimumPayoutPaise || 50000)}.</p>
                  </div>
                </div>

                <label className="mb-2 block text-sm font-bold text-slate-700">Request amount</label>
                <div className="mb-4 flex items-center border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-600">
                  <span className="border-r border-slate-200 px-3 text-slate-500">
                    <IndianRupee className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    min={minimumRupees}
                    max={availableRupees}
                    step="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-lg font-black text-slate-900 outline-none"
                  />
                </div>

                <label className="mb-2 block text-sm font-bold text-slate-700">Trainer note</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mb-5 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  placeholder="Optional note for admin"
                />

                {!canRequest ? (
                  <div className="mb-5 flex gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{getBlockLabel(blockReason)}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canRequest || submitting}
                  className="inline-flex w-full items-center justify-center gap-2 bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Request payout'}
                </button>
              </form>

              <aside className="border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                  <h2 className="text-lg font-black text-slate-900">Request rules</h2>
                </div>
                <div className="grid gap-3">
                  <InfoRow label="Balance rule" value="Unpaid earnings minus locked requests" />
                  <InfoRow label="Cycle window" value={`${formatDate(balance.cycleStartDate)} - ${formatDate(balance.cycleEndDate)}`} />
                  <InfoRow label="Minimum payout" value={formatCurrency(balance.minimumPayoutPaise || 50000)} />
                  <InfoRow label="Active request" value={balance.hasActiveRequest ? 'Yes' : 'No'} />
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PayoutRequestPage;

