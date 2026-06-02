const STUDENT_APP_URL = (process.env.REACT_APP_STUDENT_APP_URL || 'https://lurnstack.com').replace(/\/+$/, '');

export const slugify = (value) =>
  String(value || 'general')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';

export const buildOfferCtaLink = ({ categoryIds = [], courseId = '', sessionId = '' }) => {
  if (sessionId) return `${STUDENT_APP_URL}/sessions/${encodeURIComponent(sessionId)}`;
  if (courseId) return `${STUDENT_APP_URL}/courses/${encodeURIComponent(courseId)}`;
  if (categoryIds.length === 1) return `${STUDENT_APP_URL}/categories/${encodeURIComponent(categoryIds[0])}`;
  if (categoryIds.length > 1) return `${STUDENT_APP_URL}/categories?ids=${encodeURIComponent(categoryIds.join(','))}`;
  return `${STUDENT_APP_URL}/categories`;
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
