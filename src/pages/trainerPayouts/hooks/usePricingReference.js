import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPendingSessionsApi } from '../../../api/liveClasses';
import { fetchAdminTrainerEarnings } from '../../../api/trainerPayouts';
import { getApiErrorMessage } from '../../../api/axiosClient';
import { PRICING_PAGE_SIZE } from '../constants';
import { getPageItems, getSessionPricingRow } from '../utils';
import { initialSessions } from '../mockData';

const unwrapList = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.sessions)) return json.sessions;
  if (Array.isArray(json?.earnings)) return json.earnings;
  return [];
};

const earningToSession = (earning) => ({
  id: earning.sessionId || earning.session?.id || earning.id,
  title: earning.sessionTitle || earning.session?.title || earning.session?.classTitle || 'Untitled session',
  trainerName: earning.trainerName || earning.trainer?.fullName || earning.trainer?.name || '-',
  price: earning.sessionPricePaise ?? earning.sessionPrice ?? earning.priceInPaise ?? earning.price,
  trainerShare: earning.trainerSharePercentage ?? earning.trainerShare ?? 50,
  paidStudents: earning.paidStudentCount ?? earning.paidStudents ?? 0,
  updatedAt: earning.updatedAt || earning.createdAt || earning.date || '',
  pricingState: 'PRICED',
});

const pendingToSession = (session) => ({
  ...session,
  price: session.price ?? session.priceInPaise ?? session.amountPaise,
  pricingState: session.pricingState || session.priceState || 'PENDING_PRICE',
});

const mergeSessionsById = (...groups) => {
  const merged = new Map();
  groups.flat().forEach((session, index) => {
    const key = String(session?.id || session?.sessionId || `session-${index}`);
    const previous = merged.get(key) || {};
    merged.set(key, { ...previous, ...session });
  });
  return Array.from(merged.values());
};

export const usePricingReference = () => {
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');
  const [pricingPage, setPricingPage] = useState(1);
  const [pricingFilters, setPricingFilters] = useState({
    query: '',
    trainer: 'all',
    priceType: 'all',
    status: 'all',
    from: '',
    to: '',
  });

  const loadSessions = useCallback(async (isActive = () => true) => {
    setSessionsLoading(true);
    setSessionsError('');
    try {
      const [earningsResult, pendingResult] = await Promise.allSettled([
        fetchAdminTrainerEarnings(),
        fetchPendingSessionsApi(),
      ]);
      if (!isActive()) return;

      const pricedSessions =
        earningsResult.status === 'fulfilled'
          ? unwrapList(earningsResult.value).map(earningToSession)
          : [];
      const pendingSessions =
        pendingResult.status === 'fulfilled'
          ? unwrapList(pendingResult.value).map(pendingToSession)
          : [];
      const nextSessions = mergeSessionsById(pricedSessions, pendingSessions);

      setSessions(nextSessions.length ? nextSessions : initialSessions);

      const firstError =
        earningsResult.status === 'rejected'
          ? earningsResult.reason
          : pendingResult.status === 'rejected'
          ? pendingResult.reason
          : null;
      if (firstError && !nextSessions.length) {
        setSessionsError(getApiErrorMessage(firstError, 'Unable to load admin session pricing data.'));
      }
    } catch (error) {
      if (!isActive()) return;
      setSessionsError(getApiErrorMessage(error, 'Unable to load admin session pricing data.'));
    } finally {
      if (isActive()) setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadSessions(() => active);
    return () => {
      active = false;
    };
  }, [loadSessions]);

  const pricingRows = useMemo(() => {
    return sessions.map(getSessionPricingRow);
  }, [sessions]);

  const trainerOptions = useMemo(() => {
    return Array.from(new Set(pricingRows.map((row) => row.trainerName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [pricingRows]);

  const filteredRows = useMemo(() => {
    const query = pricingFilters.query.trim().toLowerCase();
    return pricingRows.filter((row) => {
      const matchesQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.trainerName.toLowerCase().includes(query);
      const matchesTrainer = pricingFilters.trainer === 'all' || row.trainerName === pricingFilters.trainer;
      const matchesType = pricingFilters.priceType === 'all' || row.priceType === pricingFilters.priceType;
      const matchesStatus = pricingFilters.status === 'all' || row.status === pricingFilters.status;
      const rowDate = row.dateValue ? new Date(row.dateValue) : null;
      const hasValidRowDate = rowDate && !Number.isNaN(rowDate.getTime());
      const fromOk = !pricingFilters.from || (hasValidRowDate && rowDate >= new Date(`${pricingFilters.from}T00:00:00`));
      const toOk = !pricingFilters.to || (hasValidRowDate && rowDate <= new Date(`${pricingFilters.to}T23:59:59`));
      return matchesQuery && matchesTrainer && matchesType && matchesStatus && fromOk && toOk;
    });
  }, [pricingRows, pricingFilters]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PRICING_PAGE_SIZE));
  const activePage = Math.min(Math.max(1, pricingPage), totalPages);
  const startIndex = totalEntries ? (activePage - 1) * PRICING_PAGE_SIZE : 0;
  const endIndex = Math.min(startIndex + PRICING_PAGE_SIZE, totalEntries);
  const rows = filteredRows.slice(startIndex, endIndex);

  useEffect(() => {
    setPricingPage(1);
  }, [pricingFilters, sessions]);

  return {
    sessions,
    filters: pricingFilters,
    setFilters: setPricingFilters,
    loading: sessionsLoading,
    error: sessionsError,
    rows,
    filteredRows,
    trainerOptions,
    totalEntries,
    totalPages,
    activePage,
    startIndex,
    endIndex,
    setPage: setPricingPage,
    pageItems: getPageItems(activePage, totalPages),
    refresh: loadSessions,
  };
};
