import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authTokenStorage, getApiErrorMessage } from '../api/axiosClient';
import {
  createOfferCampaignApi,
  deleteOfferCampaignApi,
  fetchOfferCampaignsApi,
  fetchOfferTargetsApi,
  sendOfferCampaignApi,
  updateOfferCampaignApi,
} from '../api/offerCampaigns';
import { Alert } from './offerCampaigns/Fields';
import { BuilderView } from './offerCampaigns/BuilderView';
import { CampaignsView, HistoryView } from './offerCampaigns/CampaignViews';
import {
  audienceOptions,
  initialForm,
  initialTemplate,
  pageMeta,
} from './offerCampaigns/constants';
import { buildOfferCtaLink, unwrapCampaign, unwrapList } from './offerCampaigns/utils';

const normalizeCampaign = (item) => ({
  id: item?.id || item?._id || item?.campaignId,
  name: item?.campaignName || item?.name || 'Untitled Campaign',
  offerTitle: item?.offerTitle || '-',
  target: item?.target || item?.courseName || item?.categoryName || 'Selected audience',
  status: item?.status
    ? String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)
    : 'Draft',
  recipients: item?.recipientCount ?? item?.recipients ?? 0,
  sent: item?.sentCount ?? item?.sent ?? 0,
  failed: item?.failedCount ?? item?.failed ?? 0,
  updatedAt: item?.updatedAt || item?.createdAt || '-',
  raw: item || {},
});

const campaignToForm = (campaign) => {
  const item = campaign?.raw || campaign || {};
  return {
    campaignName: item.campaignName || item.name || '',
    offerTitle: item.offerTitle || '',
    description: item.description || '',
    discountType: item.discountType || 'percentage',
    discountValue: item.discountValue || '',
    validTill: item.validTill ? String(item.validTill).slice(0, 10) : '',
    categoryIds: Array.isArray(item.categoryIds) ? item.categoryIds : [],
    courseId: item.courseId || '',
    sessionId: item.sessionId || '',
    audienceType: item.audienceType || 'all_students',
    templateId: item.templateId || initialTemplate.id,
    showLogo: item.showLogo === false ? 'no' : 'yes',
    theme: item.theme || 'dark',
    heroImage: item.heroImageUrl || item.heroImage || '',
    heroImageFile: null,
    subject: item.subject || initialTemplate.subject,
    heading: item.heading || initialTemplate.heading,
    body: item.body || initialTemplate.body,
    buttonText: item.buttonText || initialTemplate.buttonText,
    buttonLink: item.buttonLink || '',
  };
};

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'ready') return 'ready';
  if (value === 'sent') return 'sent';
  return 'draft';
};

const getTargetArray = (targets, ...keys) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], targets);
    if (Array.isArray(value)) return value;
  }
  return [];
};

const normalizeTargetName = (item, fallback = 'Untitled') =>
  item?.name || item?.title || item?.label || item?.description || item?.categoryName || item?.courseName || item?.sessionName || fallback;

const normalizeOfferTargets = (targetJson) => {
  const targets = targetJson?.data || targetJson || {};
  const categories = getTargetArray(targets, 'categories', 'parentCategories', 'targets.categories', 'data.categories').map((category) => ({
    ...category,
    id: String(category.id || category._id || category.categoryId || category.value || category.description || category.name || ''),
    name: normalizeTargetName(category, 'Category'),
  })).filter((category) => category.id);
  const courses = getTargetArray(targets, 'courses', 'courseCategories', 'categoryCourses', 'targets.courses', 'data.courses').map((course) => ({
    ...course,
    id: String(course.id || course._id || course.courseId || course.value || ''),
    name: normalizeTargetName(course, 'Course'),
    categoryId: String(course.categoryId || course.parentCategoryId || course.parentId || course.category?.id || course.category?._id || course.parentCategory || ''),
  })).filter((course) => course.id);
  const sessions = getTargetArray(targets, 'sessions', 'liveSessions', 'classes', 'targets.sessions', 'data.sessions').map((session) => ({
    ...session,
    id: String(session.id || session._id || session.sessionId || session.liveSessionId || session.value || ''),
    name: normalizeTargetName(session, 'Session'),
    courseId: String(session.courseId || session.categoryId || session.course?.id || session.course?._id || session.category?.id || session.category?._id || ''),
  })).filter((session) => session.id);
  const responseSource = String(targets.source || targets.mode || targets.targetSource || targetJson?.source || targetJson?.data?.source || '').toLowerCase();
  const source = responseSource.includes('fallback') || responseSource.includes('mock') || responseSource.includes('demo')
    ? 'fallback'
    : 'live';

  return { categories, courses, sessions, source };
};

const OfferCampaigns = ({ view = 'campaigns' }) => {
  const navigate = useNavigate();
  const currentView = pageMeta[view] ? view : 'campaigns';
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [templateList] = useState([initialTemplate]);
  const [targetData, setTargetData] = useState({
    categories: [],
    courses: [],
    sessions: [],
    source: 'loading',
  });
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [editingCampaignId, setEditingCampaignId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedTemplate = useMemo(
    () => templateList.find((template) => template.id === form.templateId) || initialTemplate,
    [form.templateId, templateList]
  );

  const applyTargetData = ({ categories, courses, sessions, source }) => {
    setTargetData({ categories, courses, sessions, source });
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((id) => categories.some((category) => category.id === id)).length
        ? prev.categoryIds
        : categories.slice(0, 1).map((category) => category.id),
      courseId: '',
      sessionId: '',
    }));
    if (source === 'fallback') {
      setError('Backend returned fallback target data. Please load real category/course/session IDs before sending.');
    }
  };

  const loadOfferTargets = async () => {
    setTargetData((prev) => ({ ...prev, source: 'loading' }));
    setError('');
    if (!authTokenStorage.get()) {
      setTargetData({ categories: [], courses: [], sessions: [], source: 'error' });
      setError('Admin token is missing. Please logout and login again.');
      return;
    }

    try {
      const targetJson = await fetchOfferTargetsApi();
      const normalizedTargets = normalizeOfferTargets(targetJson);
      if (!normalizedTargets.categories.length) {
        setTargetData({ categories: [], courses: [], sessions: [], source: 'error' });
        setError('No categories returned from /api/admin/offer-targets. Please check backend target response.');
        return;
      }
      applyTargetData(normalizedTargets);
    } catch (apiError) {
      setTargetData({ categories: [], courses: [], sessions: [], source: 'error' });
      setError(getApiErrorMessage(apiError, 'Unable to load offer target data.'));
    }
  };

  useEffect(() => {
    let active = true;
    const loadTargetData = async () => {
      if (!authTokenStorage.get()) {
        if (active) {
          setTargetData({ categories: [], courses: [], sessions: [], source: 'error' });
          setError('Admin token is missing. Please logout and login again.');
        }
        return;
      }

      try {
        const targetJson = await fetchOfferTargetsApi();
        const normalizedTargets = normalizeOfferTargets(targetJson);
        if (!active) return;
        const { categories } = normalizedTargets;
        if (!categories.length) {
          setTargetData({ categories: [], courses: [], sessions: [], source: 'error' });
          setError('No categories returned from /api/admin/offer-targets. Please check backend target response.');
          return;
        }

        applyTargetData(normalizedTargets);
      } catch (apiError) {
        if (active) {
          setTargetData({ categories: [], courses: [], sessions: [], source: 'error' });
          setError(getApiErrorMessage(apiError, 'Unable to load offer target data.'));
        }
      }
    };

    loadTargetData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCampaigns = async () => {
      try {
        const json = await fetchOfferCampaignsApi();
        const list = unwrapList(json);
        if (!active) return;
        const normalized = list.map(normalizeCampaign);
        setCampaigns(normalized);
        setHistory(
          normalized
            .filter((item) => item.status === 'Sent')
            .map((item) => ({
              id: item.id,
              name: item.name,
              sentAt: item.updatedAt,
              recipients: item.recipients,
              sent: item.sent,
              failed: item.failed,
            }))
        );
      } catch {
        if (active) {
          setCampaigns([]);
          setHistory([]);
        }
      }
    };

    loadCampaigns();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const buttonLink = buildOfferCtaLink({
      categoryIds: form.categoryIds,
      courseId: form.courseId,
      sessionId: form.sessionId,
    });
    setForm((prev) => (prev.buttonLink === buttonLink ? prev : { ...prev, buttonLink }));
  }, [form.categoryIds, form.courseId, form.sessionId]);

  const selectedCourse = useMemo(
    () => targetData.courses.find((course) => course.id === form.courseId) || null,
    [form.courseId, targetData.courses]
  );
  const selectedCategories = useMemo(
    () => targetData.categories.filter((category) => form.categoryIds.includes(category.id)),
    [form.categoryIds, targetData.categories]
  );
  const availableCourses = useMemo(
    () => targetData.courses.filter((course) => !form.categoryIds.length || form.categoryIds.includes(course.categoryId)),
    [form.categoryIds, targetData.courses]
  );
  const availableSessions = useMemo(
    () =>
      targetData.sessions.filter((session) => {
        if (form.courseId) return session.courseId === form.courseId;
        const course = targetData.courses.find((item) => item.id === session.courseId);
        return !form.categoryIds.length || form.categoryIds.includes(course?.categoryId);
      }),
    [form.categoryIds, form.courseId, targetData.courses, targetData.sessions]
  );
  const selectedSession = useMemo(
    () => targetData.sessions.find((session) => session.id === form.sessionId) || null,
    [form.sessionId, targetData.sessions]
  );
  const selectedAudience = useMemo(
    () => audienceOptions.find((audience) => audience.id === form.audienceType) || audienceOptions[0],
    [form.audienceType]
  );

  const stats = [
    { label: 'Drafts', value: campaigns.filter((item) => item.status === 'Draft').length },
    { label: 'Ready', value: campaigns.filter((item) => item.status === 'Ready').length },
    { label: 'Sent Emails', value: history.reduce((total, item) => total + item.sent, 0) },
    { label: 'Recipients', value: campaigns.reduce((total, item) => total + item.recipients, 0) },
  ];

  const onChange = (event) => {
    const { name, value } = event.target;
    setNotice('');
    setError('');
    if (name === 'courseId') {
      setForm((prev) => ({ ...prev, courseId: value, sessionId: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (categoryId) => {
    setForm((prev) => {
      const categoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      const courseStillValid = !prev.courseId || targetData.courses.some((course) => course.id === prev.courseId && categoryIds.includes(course.categoryId));
      return { ...prev, categoryIds, courseId: courseStillValid ? prev.courseId : '', sessionId: courseStillValid ? prev.sessionId : '' };
    });
  };

  const onHeroImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, heroImage: URL.createObjectURL(file), heroImageFile: file }));
  };

  const validateStep = (step = activeStep) => {
    if (step === 1 && targetData.source !== 'live') return 'Live backend target data is not loaded. Please check /api/admin/offer-targets before sending.';
    if (step === 0 && !form.campaignName.trim()) return 'Campaign name is required.';
    if (step === 0 && !form.offerTitle.trim()) return 'Offer title is required.';
    if (step === 0 && !form.validTill) return 'Offer expiry date is required.';
    if (step === 1 && !form.categoryIds.length) return 'Select at least one category.';
    if (step === 2 && (!form.subject.trim() || !form.heading.trim() || !form.body.trim())) return 'Complete the email subject, heading, and body.';
    return '';
  };

  const resetBuilder = () => {
    setForm(initialForm);
    setEditingCampaignId('');
    setActiveStep(0);
    setError('');
    setNotice('');
  };

  const saveCurrentAsTemplate = () => {
    setError('Template saving must be handled by backend before enabling this action in production.');
  };

  const buildPayload = (status) => ({
    campaignName: form.campaignName.trim(),
    offerTitle: form.offerTitle.trim(),
    description: form.description.trim(),
    discountType: form.discountType,
    discountValue: form.discountValue,
    validTill: form.validTill,
    categoryIds: form.categoryIds,
    courseId: form.courseId,
    sessionId: form.sessionId,
    audienceType: form.audienceType,
    templateId: form.templateId,
    subject: form.subject.trim(),
    heading: form.heading.trim(),
    body: form.body.trim(),
    buttonText: form.buttonText.trim(),
    buttonLink: form.buttonLink,
    showLogo: form.showLogo === 'yes',
    theme: form.theme,
    status: normalizeStatus(status),
    heroImageFile: form.heroImageFile,
  });

  const upsertCampaign = (campaign) => {
    setCampaigns((prev) => [campaign, ...prev.filter((item) => item.id !== campaign.id)]);
  };

  const saveDraft = async () => finishCampaign('Draft', '/offer-campaigns', 'Draft campaign saved.');
  const markReady = async () => finishCampaign('Ready', '/offer-campaigns', 'Campaign marked ready.');
  const sendCampaign = async () => {
    const validationError = validateAll();
    if (validationError) return setError(validationError);
    try {
      const payload = buildPayload('Ready');
      const createdJson = editingCampaignId
        ? await updateOfferCampaignApi(editingCampaignId, payload)
        : await createOfferCampaignApi(payload);
      const created = normalizeCampaign(unwrapCampaign(createdJson));
      if (!created.id) throw new Error('Campaign created, but backend response did not include campaign id.');
      const sentJson = await sendOfferCampaignApi(created.id);
      const sent = normalizeCampaign(unwrapCampaign(sentJson) || { ...created, status: 'sent' });
      upsertCampaign(sent);
      setHistory((prev) => [
        {
          id: sent.id,
          name: sent.name,
          sentAt: sent.updatedAt,
          recipients: sent.recipients,
          sent: sent.sent,
          failed: sent.failed || 0,
        },
        ...prev,
      ]);
      resetBuilder();
      navigate('/offer-campaigns/history');
      setNotice('Campaign sent through backend. ZeptoMail delivery will update in history.');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Campaign send failed. Please check backend validation.'));
    }
  };

  const finishCampaign = async (status, path, message) => {
    const validationError = status === 'Draft'
      ? validateStep(0) || validateStep(1)
      : validateAll();
    if (validationError) return setError(validationError);
    try {
      const payload = buildPayload(status);
      const json = editingCampaignId
        ? await updateOfferCampaignApi(editingCampaignId, payload)
        : await createOfferCampaignApi(payload);
      upsertCampaign(normalizeCampaign(unwrapCampaign(json)));
      setEditingCampaignId('');
      resetBuilder();
      navigate(path);
      setNotice(message);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Campaign save failed. Please check backend validation.'));
    }
  };

  const validateAll = () => {
    for (let index = 0; index <= 2; index += 1) {
      const validationError = validateStep(index);
      if (validationError) return validationError;
    }
    return '';
  };

  const goToView = (nextView) => navigate({ campaigns: '/offer-campaigns', builder: '/offer-campaigns/create', history: '/offer-campaigns/history' }[nextView]);

  const deleteCampaign = async (id) => {
    try {
      await deleteOfferCampaignApi(id);
      setNotice('Campaign deleted.');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Campaign delete failed.'));
      return;
    }
    setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Mail className="h-4 w-4" />
              Offers & Emails
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{pageMeta[currentView].title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">{pageMeta[currentView].description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right">
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {notice ? <Alert tone="success" message={notice} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      {currentView === 'campaigns' && (
        <CampaignsView
          campaigns={campaigns}
          onCreate={() => goToView('builder')}
          onEdit={(campaign) => {
            setEditingCampaignId(campaign.id);
            setForm((prev) => ({ ...prev, ...campaignToForm(campaign) }));
            setActiveStep(0);
            goToView('builder');
          }}
          onDelete={deleteCampaign}
        />
      )}
      {currentView === 'builder' && (
        <BuilderView
          activeStep={activeStep}
          form={form}
          categories={targetData.categories}
          selectedAudience={selectedAudience}
          selectedCategories={selectedCategories}
          selectedCourse={selectedCourse}
          selectedSession={selectedSession}
          selectedTemplate={selectedTemplate}
          availableCourses={availableCourses}
          availableSessions={availableSessions}
          dataSource={targetData.source}
          error={error}
          onReloadTargets={loadOfferTargets}
          onChange={onChange}
          onToggleCategory={toggleCategory}
          onHeroImageChange={onHeroImageChange}
          onSaveTemplate={saveCurrentAsTemplate}
          onBack={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
          onNext={() => {
            const validationError = validateStep();
            if (validationError) setError(validationError);
            else setActiveStep((prev) => Math.min(prev + 1, 3));
          }}
          onSaveDraft={saveDraft}
          onMarkReady={markReady}
          onSend={sendCampaign}
          onReset={resetBuilder}
        />
      )}
      {currentView === 'history' && <HistoryView history={history} onCreate={() => goToView('builder')} />}
    </div>
  );
};

export default OfferCampaigns;
