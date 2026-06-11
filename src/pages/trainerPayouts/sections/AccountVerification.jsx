import React, { useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, ChevronLeft, ChevronRight, Eye, EyeOff, History, Lock, Search, XCircle } from 'lucide-react';
import { StatusBadge } from '../components/Shared';
import { formatDate, getPageItems, maskAccount } from '../utils';

const ACCOUNT_PAGE_SIZE = 8;

const AccountVerification = ({
  accounts,
  selectedAccount,
  selectedAccountId,
  setSelectedAccountId,
  onLoadAccountDetail,
  activePayout,
  rejectReason,
  setRejectReason,
  onUpdateStatus,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({ query: '', status: 'all', lockState: 'all' });
  const [page, setPage] = useState(1);

  const filteredAccounts = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesQuery =
        !query ||
        account.trainerName.toLowerCase().includes(query) ||
        String(account.email || '').toLowerCase().includes(query) ||
        String(account.bankName || '').toLowerCase().includes(query) ||
        String(account.upi || '').toLowerCase().includes(query) ||
        String(account.pan || '').toLowerCase().includes(query);
      const matchesStatus = filters.status === 'all' || account.status === filters.status;
      const matchesLock =
        filters.lockState === 'all' ||
        (filters.lockState === 'locked' && account.locked) ||
        (filters.lockState === 'open' && !account.locked);
      return matchesQuery && matchesStatus && matchesLock;
    });
  }, [accounts, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / ACCOUNT_PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = filteredAccounts.length ? (activePage - 1) * ACCOUNT_PAGE_SIZE : 0;
  const endIndex = Math.min(startIndex + ACCOUNT_PAGE_SIZE, filteredAccounts.length);
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);
  const pageItems = getPageItems(activePage, totalPages);

  const handleView = async (accountId) => {
    setSelectedAccountId(accountId);
    await onLoadAccountDetail?.(accountId);
    setShowDetails(true);
  };

  const updateFilters = (updater) => {
    setFilters(updater);
    setPage(1);
  };

  if (showDetails) {
    return (
      <AccountDetail
        selectedAccount={selectedAccount}
        activePayout={activePayout}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onUpdateStatus={onUpdateStatus}
        onBack={() => setShowDetails(false)}
      />
    );
  }

  return (
    <section className="space-y-4">
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Trainer Payout Accounts</h2>
          <p className="mt-1 text-sm text-slate-500">Click View to inspect bank, UPI, PAN, phone, lock state, and verification history.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500">{accounts.length} submitted account{accounts.length === 1 ? '' : 's'}</div>
      </div>
      <div className="border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={filters.query}
              onChange={(event) => updateFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Search trainer, email, bank, UPI, PAN"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) => updateFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="flex gap-2">
            <select
              value={filters.lockState}
              onChange={(event) => updateFilters((prev) => ({ ...prev, lockState: event.target.value }))}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All lock states</option>
              <option value="locked">Locked</option>
              <option value="open">Open</option>
            </select>
            <button
              type="button"
              onClick={() => updateFilters({ query: '', status: 'all', lockState: 'all' })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
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
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">IFSC</th>
              <th className="px-4 py-3">UPI</th>
              <th className="px-4 py-3">PAN</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Lock</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                  No payout accounts match the selected filters.
                </td>
              </tr>
            ) : paginatedAccounts.map((account) => {
              const isSelected = account.id === selectedAccountId;
              return (
                <tr key={account.id} className={`${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{account.trainerName}</p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{account.bankName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{maskAccount(account.accountNumber)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{account.ifsc}</td>
                  <td className="px-4 py-3 text-slate-700">{account.upi || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{account.pan || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={account.status} /></td>
                  <td className="px-4 py-3">
                    {account.locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Open</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleView(account.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        isSelected ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredAccounts.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">{endIndex}</span> of{' '}
            <span className="font-semibold text-slate-900">{filteredAccounts.length}</span> accounts
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={activePage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <div className="flex items-center gap-1">
              {pageItems.map((item, index) =>
                item === 'gap' ? (
                  <span key={`account-gap-${index}`} className="px-1 text-slate-400">...</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition-colors ${
                      item === activePage ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={activePage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  </section>
  );
};

const AccountDetail = ({
  selectedAccount,
  activePayout,
  rejectReason,
  setRejectReason,
  onUpdateStatus,
  onBack,
}) => {
  const [isAccountMasked, setIsAccountMasked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const accountNumber = isAccountMasked ? maskAccount(selectedAccount.accountNumber) : selectedAccount.accountNumber;

  if (showHistory) {
    return (
      <AccountHistory
        selectedAccount={selectedAccount}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to accounts
      </button>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{selectedAccount.trainerName}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedAccount.email}</p>
            </div>
            <StatusBadge status={selectedAccount.status} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField label="Account holder name" value={selectedAccount.accountHolder} />
            <DetailField label="Bank name" value={selectedAccount.bankName} />
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Account number</p>
                <button
                  type="button"
                  onClick={() => setIsAccountMasked((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isAccountMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {isAccountMasked ? 'Show full' : 'Mask'}
                </button>
              </div>
              <p className="mt-1 break-words font-mono text-sm font-semibold text-slate-900">{accountNumber}</p>
            </div>
            <DetailField label="IFSC" value={selectedAccount.ifsc} />
            <DetailField label="UPI ID" value={selectedAccount.upi || '-'} />
            <DetailField label="PAN" value={selectedAccount.pan || '-'} />
            <DetailField label="Phone number" value={selectedAccount.phone || '-'} />
          </div>
          {activePayout ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Bank account cannot be changed while payout is {activePayout.status}.
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Verification Action</h3>
          <p className="mt-1 text-sm text-slate-500">Reject requires an admin reason for audit trail.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row xl:flex-col">
            <button onClick={() => onUpdateStatus('verified')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <BadgeCheck className="h-4 w-4" /> Mark Verified
            </button>
            <button onClick={() => onUpdateStatus('rejected')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
              <XCircle className="h-4 w-4" /> Reject Account
            </button>
            <button onClick={() => setShowHistory(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <History className="h-4 w-4" /> View History
            </button>
          </div>
          <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Reason required for rejection" className="mt-3 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </div>
    </section>
  );
};

const DetailField = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const AccountHistory = ({ selectedAccount, onBack }) => (
  <section className="space-y-4">
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to account details
    </button>
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Verification History</h3>
          <p className="mt-1 text-sm text-slate-500">{selectedAccount.trainerName} - {selectedAccount.email}</p>
        </div>
        <StatusBadge status={selectedAccount.status} />
      </div>
      <div className="mt-4 space-y-3">
        {selectedAccount.history.map((item, index) => (
          <div key={`${item.at}-${index}`} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={item.status} />
              <span className="text-xs text-slate-500">{formatDate(item.at)} - {item.admin}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AccountVerification;
