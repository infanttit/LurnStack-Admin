import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, History, Search, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../components/Shared';
import { formatCurrency, formatDate, getPageItems } from '../utils';
import { getStudentAttendance } from '../../../api/attendance';

const REQUEST_PAGE_SIZE = 8;

const PayoutRequests = ({
  accounts,
  payouts,
  earnings = [],
  selectedPayout,
  setSelectedPayoutId,
  rejectNote,
  setRejectNote,
  onUpdateStatus,
}) => {
  const [showReview, setShowReview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reviewPayoutId, setReviewPayoutId] = useState(selectedPayout?.id);
  const [filters, setFilters] = useState({ query: '', status: 'all', accountStatus: 'all', from: '', to: '' });
  const [page, setPage] = useState(1);

  const accountByTrainerId = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.trainerId] = account;
      return acc;
    }, {});
  }, [accounts]);

  const reviewPayout = payouts.find((payout) => payout.id === reviewPayoutId) || selectedPayout;
  const reviewAccount = accountByTrainerId[reviewPayout?.trainerId];
  
  const reviewEarnings = useMemo(() => {
    if (!reviewPayoutId) return [];
    return earnings.filter((e) => e.payoutRequestId === reviewPayoutId);
  }, [earnings, reviewPayoutId]);

  const filteredPayouts = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return payouts.filter((payout) => {
      const matchesQuery =
        !query ||
        payout.trainerName.toLowerCase().includes(query) ||
        String(payout.accountSnapshot || '').toLowerCase().includes(query) ||
        String(payout.utr || '').toLowerCase().includes(query);
      const matchesStatus = filters.status === 'all' || payout.status === filters.status;
      const accountStatus = accountByTrainerId[payout.trainerId]?.status || 'missing';
      const matchesAccountStatus = filters.accountStatus === 'all' || accountStatus === filters.accountStatus;
      const requestDate = payout.requestedDate ? new Date(payout.requestedDate) : null;
      const hasValidDate = requestDate && !Number.isNaN(requestDate.getTime());
      const fromOk = !filters.from || (hasValidDate && requestDate >= new Date(`${filters.from}T00:00:00`));
      const toOk = !filters.to || (hasValidDate && requestDate <= new Date(`${filters.to}T23:59:59`));
      return matchesQuery && matchesStatus && matchesAccountStatus && fromOk && toOk;
    });
  }, [payouts, filters, accountByTrainerId]);

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / REQUEST_PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = filteredPayouts.length ? (activePage - 1) * REQUEST_PAGE_SIZE : 0;
  const endIndex = Math.min(startIndex + REQUEST_PAGE_SIZE, filteredPayouts.length);
  const paginatedPayouts = filteredPayouts.slice(startIndex, endIndex);
  const pageItems = getPageItems(activePage, totalPages);

  const updateFilters = (updater) => {
    setFilters(updater);
    setPage(1);
  };

  const handleReview = (payoutId) => {
    setReviewPayoutId(payoutId);
    setSelectedPayoutId(payoutId);
    setShowReview(true);
  };

  if (showHistory) {
    return <PayoutHistory payout={reviewPayout} onBack={() => setShowHistory(false)} />;
  }

  if (showReview) {
    return (
      <PayoutReview
        account={reviewAccount}
        payout={reviewPayout}
        earnings={reviewEarnings}
        rejectNote={rejectNote}
        setRejectNote={setRejectNote}
        setShowHistory={setShowHistory}
        onUpdateStatus={onUpdateStatus}
        onBack={() => setShowReview(false)}
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Payout Request Management</h2>
          <p className="mt-1 text-sm text-slate-500">Search, filter, and review trainer payout requests before manual approval.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500">{payouts.length} request{payouts.length === 1 ? '' : 's'}</div>
      </div>
      <div className="border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={filters.query}
              onChange={(event) => updateFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Search trainer, account, UTR"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <select value={filters.status} onChange={(event) => updateFilters((prev) => ({ ...prev, status: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All status</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filters.accountStatus} onChange={(event) => updateFilters((prev) => ({ ...prev, accountStatus: event.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All accounts</option>
            <option value="verified">Verified account</option>
            <option value="pending">Pending account</option>
            <option value="rejected">Rejected account</option>
            <option value="missing">Missing account</option>
          </select>
          <div className="flex gap-2 xl:col-span-2">
            <input type="date" value={filters.from} onChange={(event) => updateFilters((prev) => ({ ...prev, from: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" title="From date" />
            <input type="date" value={filters.to} onChange={(event) => updateFilters((prev) => ({ ...prev, to: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" title="To date" />
            <button type="button" onClick={() => updateFilters({ query: '', status: 'all', accountStatus: 'all', from: '', to: '' })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Reset
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Available Balance</th>
              <th className="px-4 py-3">Requested Date</th>
              <th className="px-4 py-3">Payout Account</th>
              <th className="px-4 py-3">Account Check</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPayouts.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-sm font-medium text-slate-500">No payout requests match the selected filters.</td></tr>
            ) : paginatedPayouts.map((payout, index) => {
              const account = accountByTrainerId[payout.trainerId];
              const accountStatus = account?.status || 'missing';
              return (
                <tr key={`${payout.id || 'payout'}-${startIndex + index}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{payout.trainerName}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(payout.requestedAmount)}</td>
                  <td className="px-4 py-3">{formatCurrency(payout.availableBalance)}</td>
                  <td className="px-4 py-3">{formatDate(payout.requestedDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{payout.accountSnapshot}</td>
                  <td className="px-4 py-3"><StatusBadge status={accountStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={payout.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleReview(payout.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Eye className="h-3.5 w-3.5" />
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredPayouts.length > 0 ? (
        <RequestPagination
          activePage={activePage}
          endIndex={endIndex}
          pageItems={pageItems}
          setPage={setPage}
          startIndex={startIndex}
          totalEntries={filteredPayouts.length}
          totalPages={totalPages}
        />
      ) : null}
    </section>
  );
};

const RequestPagination = ({ activePage, endIndex, pageItems, setPage, startIndex, totalEntries, totalPages }) => (
  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
    <div>
      Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
      <span className="font-semibold text-slate-900">{endIndex}</span> of{' '}
      <span className="font-semibold text-slate-900">{totalEntries}</span> requests
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={activePage <= 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
        <ChevronLeft className="h-3.5 w-3.5" /> Prev
      </button>
      <div className="flex items-center gap-1">
        {pageItems.map((item, index) =>
          item === 'gap' ? (
            <span key={`request-gap-${index}`} className="px-1 text-slate-400">...</span>
          ) : (
            <button key={item} type="button" onClick={() => setPage(item)} className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition-colors ${item === activePage ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {item}
            </button>
          )
        )}
      </div>
      <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={activePage >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
        Next <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const PayoutReview = ({ account, payout, earnings, rejectNote, setRejectNote, setShowHistory, onUpdateStatus, onBack }) => {
  const [actionError, setActionError] = useState('');
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const accountStatus = account?.status || 'missing';
  const isAccountVerified = accountStatus === 'verified';
  const canApprove = payout.status === 'requested' && isAccountVerified;
  const canReject = ['requested', 'approved'].includes(payout.status);
  const unverifiedNote = 'Payout account is not verified. Please upload and verify payout account details before requesting payout.';

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!payout?.trainerId || earnings.length === 0) return;
      setIsCalculating(true);
      try {
        const sessionIds = Array.from(new Set(earnings.map((e) => e.sessionId).filter(Boolean)));
        if (sessionIds.length === 0) {
          setIsCalculating(false);
          return;
        }

        const res = await getStudentAttendance(payout.trainerId);
        const attendanceRecords = res?.data || res || [];
        
        // Filter attendance to just the sessions tied to this payout
        const payoutAttendances = attendanceRecords.filter((a) => sessionIds.includes(a.sessionId));
        
        let totalRequiredSecs = 0;
        let totalAttendedSecs = 0;

        payoutAttendances.forEach(att => {
          const occ = att.session;
          if (occ && occ.startsAt && occ.endsAt) {
            const start = new Date(occ.startsAt);
            const end = new Date(occ.endsAt);
            const sessionDurationMins = Math.max(1, Math.round((end - start) / 60000));
            const requiredSecs = sessionDurationMins * 60;
            totalRequiredSecs += requiredSecs;
            totalAttendedSecs += att.totalDurationSeconds || 0;
          }
        });

        if (totalRequiredSecs > 0) {
          const pct = Math.min(100, (totalAttendedSecs / totalRequiredSecs) * 100);
          setAttendancePercentage(pct);
        } else {
          setAttendancePercentage(null);
        }
      } catch (err) {
        console.error("Failed to fetch trainer attendance:", err);
      } finally {
        setIsCalculating(false);
      }
    };
    fetchAttendance();
  }, [payout, earnings]);

  const handleUpdateStatus = async (status) => {
    setActionError('');
    try {
      await onUpdateStatus(status);
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update payout status.');
    }
  };

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        <ArrowLeft className="h-4 w-4" />
        Back to payout requests
      </button>

      {actionError ? (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Action Failed</p>
            <p className="mt-1">{actionError}</p>
          </div>
        </div>
      ) : null}

      {!isAccountVerified ? (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Payout account is not verified.</p>
            <p className="mt-1">Admin should reject this request and ask the trainer to upload verified payout account details before requesting payout again.</p>
          </div>
        </div>
      ) : null}

      {isCalculating ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
          Calculating trainer attendance...
        </div>
      ) : attendancePercentage !== null ? (
        <div className={`flex gap-3 rounded-lg border p-4 text-sm ${attendancePercentage < 85 ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Trainer Attendance: {attendancePercentage.toFixed(2)}%</p>
            <p className="mt-1">
              {attendancePercentage < 85 
                ? 'Trainer failed to meet the 85% attendance requirement for the sessions tied to this payout request.' 
                : 'Trainer meets the 85% attendance requirement for these sessions.'}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">{payout.trainerName}</h2>
              <p className="mt-1 text-sm text-slate-500">Payout request review</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={accountStatus} />
              <StatusBadge status={payout.status} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReviewField label="Requested amount" value={formatCurrency(payout.requestedAmount)} />
            <ReviewField label="Available balance" value={formatCurrency(payout.availableBalance)} />
            <ReviewField label="Requested date" value={formatDate(payout.requestedDate)} />
            <ReviewField label="Active request status" value={payout.status} />
            <ReviewField label="Payout account snapshot" value={payout.accountSnapshot} wide />
            <ReviewField label="Admin note" value={payout.adminNote || '-'} wide />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payout Account Verification</h3>
                <p className="mt-1 text-xs text-slate-500">Request approval is allowed only after account verification.</p>
              </div>
              <StatusBadge status={accountStatus} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <ReviewField label="Bank account" value={account?.bankName || 'Not submitted'} />
              <ReviewField label="UPI ID" value={account?.upi || '-'} />
              <ReviewField label="PAN" value={account?.pan || '-'} />
              <ReviewField label="Phone" value={account?.phone || '-'} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Review Action</h3>
          <p className="mt-1 text-sm text-slate-500">Reject requires an admin note.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => handleUpdateStatus('approved')} disabled={!canApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Approve Request
            </button>
            {!isAccountVerified ? (
              <button type="button" onClick={() => setRejectNote(unverifiedNote)} className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">
                Use Account Not Verified Note
              </button>
            ) : null}
            <button onClick={() => handleUpdateStatus('rejected')} disabled={!canReject} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
              Reject Request
            </button>
            <button onClick={() => setShowHistory(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <History className="h-4 w-4" />
              View History
            </button>
          </div>
          <textarea value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} placeholder="Admin note required for rejection" className="mt-3 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </div>
    </section>
  );
};

const PayoutHistory = ({ payout, onBack }) => {
  const events = [
    { label: 'Payout requested', status: 'requested', date: payout.requestedDate, note: `Trainer requested ${formatCurrency(payout.requestedAmount)}.` },
    payout.status !== 'requested' ? { label: `Current status: ${payout.status}`, status: payout.status, date: payout.paidDate || payout.requestedDate, note: payout.adminNote || 'Status updated by admin.' } : null,
    payout.utr ? { label: 'Manual payment reference added', status: 'paid', date: payout.paidDate, note: `Reference: ${payout.utr}` } : null,
  ].filter(Boolean);

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        <ArrowLeft className="h-4 w-4" />
        Back to payout review
      </button>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Payout Request History</h2>
            <p className="mt-1 text-sm text-slate-500">{payout.trainerName}</p>
          </div>
          <StatusBadge status={payout.status} />
        </div>
        <div className="mt-4 space-y-3">
          {events.map((event, index) => (
            <div key={`${event.label}-${index}`} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={event.status} />
                <span className="text-xs text-slate-500">{formatDate(event.date)}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{event.label}</p>
              <p className="mt-1 text-sm text-slate-600">{event.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ReviewField = ({ label, value, wide = false }) => (
  <div className={`rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 ${wide ? 'md:col-span-2' : ''}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

export default PayoutRequests;
