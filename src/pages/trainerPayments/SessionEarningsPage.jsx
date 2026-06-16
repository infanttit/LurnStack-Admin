import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, IndianRupee, KeyRound, RefreshCw, Search } from 'lucide-react';
import { fetchTrainerPaymentSummary, fetchTrainerSessionEarnings } from '../../api/trainerPayouts';
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

const unwrapEarnings = (json) => {
  const source = json?.data?.data || json?.data || json?.summary || json || {};
  if (Array.isArray(source)) return source;
  if (Array.isArray(source.sessions)) {
    return source.sessions.flatMap((session) => {
      const rows = Array.isArray(session.earnings) ? session.earnings : [];
      if (rows.length === 0) return [session];
      return rows.map((earning) => ({
        ...earning,
        sessionId: session.sessionId || earning.sessionId,
        sessionTitle: session.sessionTitle || earning.sessionTitle,
        sessionPricePaise: earning.sessionPricePaise ?? session.adminSetPricePaise,
        trainerSharePercentage: earning.trainerSharePercentage ?? session.trainerSharePercentage,
      }));
    });
  }
  if (Array.isArray(source.sessionEarnings?.sessions)) {
    return unwrapEarnings({ data: { sessions: source.sessionEarnings.sessions } });
  }
  if (Array.isArray(source.result?.sessions)) {
    return unwrapEarnings({ data: { sessions: source.result.sessions } });
  }
  if (Array.isArray(source.earnings)) return source.earnings;
  if (Array.isArray(source.sessionEarnings)) return source.sessionEarnings;
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.payments)) return source.payments;
  return [];
};

const normalizeEarning = (item, index) => {
  const session = item.session || item.liveSession || {};
  const price = item.sessionPricePaise ?? item.pricePaise ?? item.priceInPaise ?? item.sessionPrice ?? 0;
  const trainerShare = item.trainerSharePercentage ?? item.trainerShare ?? 0;
  const earning = item.finalPayablePaise ?? item.trainerEarningPaise ?? item.earningPaise ?? item.amountPaise ?? 0;
  const sessionTitle = item.sessionTitle || session.title || session.classTitle || 'Untitled session';
  const sessionId = item.sessionId || session.id || item.liveSessionId || '';
  return {
    id: item.id || item.earningId || `${item.sessionId || session.id || 'session'}-${index}`,
    sessionId,
    sessionKey: sessionId || sessionTitle.trim().toLowerCase(),
    sessionTitle,
    paidStudents: item.paidStudentCount ?? item.paidStudents ?? item.studentCount ?? 1,
    price,
    trainerShare,
    earning,
    status: String(item.status || item.earningStatus || 'unpaid').toLowerCase(),
    date: item.createdAt || item.paymentDate || item.updatedAt || item.date || '',
    reference: item.paymentId || item.bookingId || item.reference || item.id || '-',
  };
};

const groupBySession = (earnings) => {
  const map = new Map();
  earnings.forEach((item) => {
    const key = item.sessionKey || item.sessionId || item.sessionTitle.trim().toLowerCase();
    const current = map.get(key) || {
      sessionId: key,
      sessionTitle: item.sessionTitle,
      count: 0,
      paidStudents: 0,
      gross: 0,
      earning: 0,
      latestDate: item.date,
      statuses: new Set(),
      rows: [],
    };
    current.count += 1;
    current.paidStudents += Number(item.paidStudents || 0);
    current.gross += Number(item.price || 0) * Number(item.paidStudents || 0);
    current.earning += Number(item.earning || 0);
    current.latestDate = new Date(item.date) > new Date(current.latestDate || 0) ? item.date : current.latestDate;
    current.statuses.add(item.status);
    current.rows.push(item);
    map.set(key, current);
  });
  return Array.from(map.values()).map((item) => ({ ...item, statuses: Array.from(item.statuses) }));
};

const Metric = ({ label, value }) => (
  <div className="border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
  </div>
);

const StatusPill = ({ status }) => (
  <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">
    {status}
  </span>
);

const SessionEarningsPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [tokenDraft, setTokenDraft] = useState(() => trainerTokenStorage.get());
  const [earnings, setEarnings] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await fetchTrainerSessionEarnings();
      let rows = unwrapEarnings(json);
      if (rows.length === 0) {
        const fallbackJson = await fetchTrainerPaymentSummary();
        rows = unwrapEarnings(fallbackJson);
      }
      setEarnings(rows.map(normalizeEarning));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to fetch session earnings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const sessions = useMemo(() => {
    const grouped = groupBySession(earnings);
    const value = query.trim().toLowerCase();
    return grouped.filter((item) => !value || item.sessionTitle.toLowerCase().includes(value));
  }, [earnings, query]);

  const selectedSession = sessions.find((item) => encodeURIComponent(item.sessionId) === sessionId);
  const totalEarning = earnings.reduce((sum, item) => sum + Number(item.earning || 0), 0);
  const totalSessions = groupBySession(earnings).length;

  const saveToken = () => {
    trainerTokenStorage.set(tokenDraft.trim());
    setSuccess('Trainer token saved locally.');
    loadEarnings();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="LurnStack" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Session-wise Earnings</h1>
              <p className="text-sm text-slate-500">View each session once, then open its earning history.</p>
            </div>
          </div>
          <button onClick={loadEarnings} disabled={loading} className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
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
            <input type="password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600" placeholder="Paste trainer JWT token" autoComplete="off" />
            <button type="button" onClick={saveToken} className="bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800">Save Token</button>
          </div>
        </section>

        {error ? <ErrorBanner message={error} /> : null}
        {success ? <div className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</div> : null}

        {loading ? <LoadingSpinner label="Loading session earnings..." /> : sessionId ? (
          <SessionDetail
            session={selectedSession}
            onBack={() => navigate('/trainer/session-earnings')}
          />
        ) : (
          <>
            <section className="mb-5 grid gap-4 md:grid-cols-3">
              <Metric label="Total Sessions" value={totalSessions} />
              <Metric label="Earning Records" value={earnings.length} />
              <Metric label="Total Earning" value={formatCurrency(totalEarning)} />
            </section>
            <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search session" className="w-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[880px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Session</th>
                      <th className="px-5 py-3">Paid Students</th>
                      <th className="px-5 py-3">Gross</th>
                      <th className="px-5 py-3">Trainer Earning</th>
                      <th className="px-5 py-3">Latest</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.length === 0 ? (
                      <tr><td colSpan="6" className="px-5 py-10 text-center text-sm font-bold text-slate-500">No session earnings found.</td></tr>
                    ) : sessions.map((session, index) => (
                      <tr key={`${session.sessionId}-${index}`} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-900">{session.sessionTitle}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{session.count} earning record{session.count === 1 ? '' : 's'}</p>
                        </td>
                        <td className="px-5 py-4 font-bold">{session.paidStudents}</td>
                        <td className="px-5 py-4 font-bold">{formatCurrency(session.gross)}</td>
                        <td className="px-5 py-4 font-black text-emerald-700">{formatCurrency(session.earning)}</td>
                        <td className="px-5 py-4">{formatDate(session.latestDate)}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => navigate(`/trainer/session-earnings/${encodeURIComponent(session.sessionId)}`)} className="border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">View earnings</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const SessionDetail = ({ session, onBack }) => {
  if (!session) {
    return (
      <section className="space-y-5">
        <button onClick={onBack} className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
          Back to sessions
        </button>
        <div className="border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-black text-slate-900">Session earnings not found</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">The session may not exist in the current earnings response.</p>
        </div>
      </section>
    );
  }

  return (
  <section className="space-y-5">
    <button onClick={onBack} className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
      <ArrowLeft className="h-4 w-4" />
      Back to sessions
    </button>
    <div className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">{session.sessionTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Complete earning history for this session only.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-slate-500">Session earning</p>
          <p className="text-2xl font-black text-emerald-700">{formatCurrency(session.earning)}</p>
        </div>
      </div>
    </div>
    <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Reference</th>
            <th className="px-5 py-3">Price</th>
            <th className="px-5 py-3">Trainer Share</th>
            <th className="px-5 py-3">Earning</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {session.rows.map((item, index) => (
            <tr key={`${item.id}-${index}`} className="hover:bg-slate-50">
              <td className="px-5 py-4"><CalendarClock className="mr-2 inline h-4 w-4 text-slate-400" />{formatDate(item.date)}</td>
              <td className="px-5 py-4 font-mono text-xs text-slate-600">{item.reference}</td>
              <td className="px-5 py-4 font-bold">{formatCurrency(item.price)}</td>
              <td className="px-5 py-4">{item.trainerShare}%</td>
              <td className="px-5 py-4 font-black text-emerald-700"><IndianRupee className="mr-1 inline h-4 w-4" />{formatCurrency(item.earning).replace('₹', '')}</td>
              <td className="px-5 py-4"><StatusPill status={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
  );
};

export default SessionEarningsPage;

