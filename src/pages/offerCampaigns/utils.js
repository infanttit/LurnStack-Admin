const STUDENT_APP_URL = (process.env.REACT_APP_STUDENT_APP_URL || 'https://lurnstack.com').replace(/\/+$/, '');
const STUDENT_LOGIN_PATH = process.env.REACT_APP_STUDENT_LOGIN_PATH || '/login';

export const slugify = (value) =>
  String(value || 'general')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';

export const buildOfferCtaLink = ({ categoryIds = [], courseId = '', sessionId = '' }) => {
  let targetPath = '/categories';
  if (sessionId) targetPath = `/sessions/${encodeURIComponent(sessionId)}`;
  else if (courseId) targetPath = `/courses/${encodeURIComponent(courseId)}`;
  else if (categoryIds.length === 1) targetPath = `/categories/${encodeURIComponent(categoryIds[0])}`;
  else if (categoryIds.length > 1) targetPath = `/categories?ids=${encodeURIComponent(categoryIds.join(','))}`;

  const separator = STUDENT_LOGIN_PATH.includes('?') ? '&' : '?';
  return `${STUDENT_APP_URL}${STUDENT_LOGIN_PATH}${separator}redirect=${encodeURIComponent(targetPath)}`;
};

export const formatDiscount = (form) => {
  const value = String(form.discountValue || '').trim();
  if (!value) return 'Exclusive Learning Offer';
  return form.discountType === 'percentage' ? `${value}% OFF` : `Rs.${value} OFF`;
};

export const unwrapList = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.campaigns)) return json.data.campaigns;
  if (Array.isArray(json?.campaigns)) return json.campaigns;
  if (Array.isArray(json?.classes)) return json.classes;
  if (Array.isArray(json?.items)) return json.items;
  return [];
};

export const unwrapCampaign = (json) =>
  json?.data?.campaign ||
  json?.campaign ||
  json?.data?.offerCampaign ||
  json?.offerCampaign ||
  json?.data ||
  json;
