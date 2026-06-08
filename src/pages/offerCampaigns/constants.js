export const createSteps = [
  { title: 'Offer Details', description: 'Campaign name, offer title, discount, and expiry.' },
  { title: 'Audience & Target', description: 'Choose category, course, session, and recipients.' },
  { title: 'Email Message', description: 'Prepare subject, body, and call to action.' },
  { title: 'Final Review', description: 'Review summary and preview before submitting.' },
];

export const initialTemplate = {
  id: 'fixed-offer',
  name: 'LurnStack Offer Template',
  subject: 'Special offer for your next LurnStack session',
  heading: 'Your learning offer is ready',
  body: 'We selected this offer based on your learning interest. Reserve your seat before the offer expires.',
  buttonText: 'View Offer',
};

export const audienceOptions = [
  { id: 'all_students', label: 'All registered students' },
  { id: 'category_students', label: 'Students by selected category' },
  { id: 'course_students', label: 'Students enrolled in selected course' },
  { id: 'session_students', label: 'Students linked to selected session' },
  { id: 'inactive_students', label: 'Inactive students' },
];

export const initialForm = {
  campaignName: '',
  offerTitle: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  validTill: '',
  categoryIds: [],
  courseId: '',
  sessionId: '',
  audienceType: audienceOptions[0].id,
  templateId: initialTemplate.id,
  showLogo: 'yes',
  theme: 'dark',
  heroImage: '',
  heroImageFile: null,
  subject: initialTemplate.subject,
  heading: initialTemplate.heading,
  body: initialTemplate.body,
  buttonText: initialTemplate.buttonText,
  buttonLink: '',
};

export const pageMeta = {
  campaigns: { title: 'Offer Campaigns', description: 'Manage draft, ready, and sent manual email offers from one admin workspace.' },
  builder: { title: 'Create Offer Campaign', description: 'Build the offer, choose the audience, prepare the email template, and review before sending.' },
  history: { title: 'Send History', description: 'Review campaign delivery summaries and ZeptoMail results after backend connection.' },
};

export const statusStyles = {
  Draft: 'border-slate-300 bg-white text-slate-700',
  Ready: 'border-slate-900 bg-white text-slate-900',
  Sending: 'border-amber-200 bg-amber-50 text-amber-800',
  Sent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Failed: 'border-red-200 bg-red-50 text-red-800',
};
