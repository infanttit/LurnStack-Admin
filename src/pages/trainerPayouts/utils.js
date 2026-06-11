export const formatCurrency = (amountInPaise) => {
  const value = Number(amountInPaise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const maskAccount = (accountNumber) => {
  const value = String(accountNumber || '');
  if (value.length <= 4) return value || '-';
  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

export const getSessionPricingRow = (session, index) => {
  const price = session.price ?? session.priceInPaise ?? session.amountPaise;
  const trainerShare = Number(session.trainerSharePercentage ?? session.trainerShare ?? 50);
  const pricingState = String(session.pricingState || session.priceState || '').toUpperCase();
  const freeMarker = String(session.priceType || session.sessionType || session.paymentType || '').toUpperCase();
  const isFreeSession =
    pricingState === 'FREE' ||
    freeMarker === 'FREE' ||
    session.isFree === true ||
    session.isFreeSession === true ||
    (price !== undefined && price !== null && Number(price) === 0);
  const hasPricing = isFreeSession || pricingState === 'PRICED' || (price !== undefined && price !== null);
  const dateValue =
    session.updatedAt ||
    session.createdAt ||
    session.date ||
    session.startDate ||
    session.scheduledDate ||
    session.startTime ||
    session.scheduledDates?.[0]?.date ||
    '';

  return {
    id: session.id || session.sessionId || `session-${index}`,
    title: session.classTitle || session.sessionTitle || session.title || 'Untitled session',
    trainerName: session.instructor || session.trainerName || session.trainer?.name || session.trainer?.fullName || '-',
    price,
    trainerShare,
    platformShare: 100 - trainerShare,
    paidStudents: session.paidStudentCount ?? session.paidStudents ?? session.studentsCount ?? 0,
    dateValue,
    isFreeSession,
    hasPricing,
    priceType: !hasPricing ? 'not_set' : isFreeSession ? 'free' : 'paid',
    status: hasPricing ? 'verified' : 'pending',
  };
};

export const getPageItems = (activePage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const items = new Set([1, totalPages]);
  for (let page = activePage - 1; page <= activePage + 1; page += 1) {
    if (page > 1 && page < totalPages) items.add(page);
  }
  const sorted = Array.from(items).sort((a, b) => a - b);
  const withGaps = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (index > 0 && current - previous > 1) withGaps.push('gap');
    withGaps.push(current);
  }
  return withGaps;
};
