import React from 'react';
import { Clock, Save } from 'lucide-react';
import darkLogo from '../../Assets/Logo/Logo3.png';
import lightLogo from '../../Assets/Logo/Logo4.png';
import { emailTemplates } from './constants';
import { ReadOnlyField, SelectField, TextField } from './Fields';

const getTemplateName = (templateType) =>
  emailTemplates.find((template) => template.id === templateType)?.name || 'Offer Template';

const getSessionTitle = (form) => form.heading || form.offerTitle || 'Your LurnStack session is ready';

const getBullets = (form) => {
  const base = form.description || form.body || '';
  const lines = base
    .split(/\n|\. /)
    .map((item) => item.replace(/\.$/, '').trim())
    .filter(Boolean)
    .slice(0, 5);

  if (lines.length >= 3) return lines;

  return [
    'Learn with a structured live session',
    'Practice using real project examples',
    'Get clear guidance from LurnStack mentors',
    'Continue your learning path with confidence',
  ];
};

export const TemplateStep = ({ form, selectedTemplate, onChange, onHeroImageChange, onSaveTemplate }) => (
  <div className="space-y-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900">Email Template</h3>
        <p className="mt-1 text-sm text-slate-500">Choose a responsive LurnStack email format for offer or session communication.</p>
      </div>
      <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
        {selectedTemplate.name}
      </span>
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      <SelectField label="Template Type" name="templateType" value={form.templateType || 'offer'} onChange={onChange}>
        {emailTemplates.map((template) => (
          <option key={template.id} value={template.id}>{template.name}</option>
        ))}
      </SelectField>
      <SelectField label="Logo" name="showLogo" value={form.showLogo} onChange={onChange}>
        <option value="yes">Show LurnStack logo</option>
        <option value="no">Hide logo</option>
      </SelectField>
      <SelectField label="Email Theme" name="theme" value={form.theme} onChange={onChange}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </SelectField>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Session / Offer Image</label>
        <label className="flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm font-medium text-slate-500 transition-colors hover:border-slate-400">
          <span className="text-xs">+</span> Upload image
          <input type="file" accept="image/*" onChange={onHeroImageChange} className="hidden" />
        </label>
      </div>
    </div>

    <TextField label="Email Subject" name="subject" value={form.subject} onChange={onChange} />
    <TextField label="Email Heading" name="heading" value={form.heading} onChange={onChange} />

    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Body</label>
      <textarea
        name="body"
        value={form.body}
        onChange={onChange}
        rows={5}
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-300"
      />
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Button Text" name="buttonText" value={form.buttonText} onChange={onChange} />
      <ReadOnlyField label="Generated Login Redirect Link" value={form.buttonLink} />
    </div>

    <div className="flex justify-end pt-1">
      <button
        type="button"
        onClick={onSaveTemplate}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition active:scale-[0.98]"
      >
        <Save className="h-4 w-4" />
        Save as Template
      </button>
    </div>
  </div>
);

export const PreviewPanel = ({ form }) => {
  const dark = form.theme === 'dark';
  const logoImage = dark ? darkLogo : lightLogo;
  const templateType = form.templateType || 'offer';
  const isSessionTemplate = templateType === 'session_intimation';
  const bg = dark ? '#10201f' : '#ffffff';
  const text = dark ? '#f8fafc' : '#111827';
  const muted = dark ? '#d1d5db' : '#4b5563';
  const panel = dark ? '#0b3f37' : '#e9f8f1';
  const footer = dark ? '#2f806f' : '#3c8f7c';
  const ctaBg = dark ? '#edff00' : '#111827';
  const ctaText = dark ? '#111827' : '#ffffff';
  const bullets = getBullets(form);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Email Preview</h2>
          <p className="text-xs text-slate-400">Responsive mobile and desktop email layout</p>
        </div>
        <span className="max-w-xs truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
          {getTemplateName(templateType)}
        </span>
      </div>

      <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div
          className="px-5 py-6 sm:px-8 sm:py-8"
          style={{ background: bg, color: text, fontFamily: 'Arial, sans-serif' }}
        >
          {form.showLogo === 'yes' ? (
            <img src={logoImage} alt="Tamil Info Technology" className="mb-7 h-auto w-[150px] max-w-[48%]" />
          ) : null}

          <p className="mb-6 text-[18px] leading-8 sm:text-[20px]" style={{ color: text }}>
            Hi,
          </p>

          <p className="mb-7 whitespace-pre-line text-[20px] leading-8 sm:text-[24px] sm:leading-10" style={{ color: text }}>
            {isSessionTemplate
              ? (form.body || 'Your seat has been confirmed for today’s session.\nWe are going live soon.')
              : (form.body || 'A new LurnStack learning offer is ready for you.\nReserve your seat before it expires.')}
          </p>

          <div className="mb-6 text-center">
            <a
              href={form.buttonLink || '#'}
              style={{ background: ctaBg, color: ctaText }}
              className="inline-block rounded-lg px-8 py-4 text-center text-[18px] font-black uppercase tracking-wide no-underline"
            >
              {form.buttonText || (isSessionTemplate ? 'Join Live Now' : 'View Offer')}
            </a>
          </div>

          <div className="mb-7 overflow-hidden" style={{ background: panel }}>
            {form.heroImage ? (
              <img src={form.heroImage} alt="" className="block h-auto w-full object-cover" />
            ) : (
              <div className="relative min-h-[230px] px-6 py-7 sm:min-h-[280px] sm:px-9">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, #ffffff 95%), linear-gradient(0deg, transparent 95%, #ffffff 95%)', backgroundSize: '28px 28px' }} />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-full bg-emerald-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-950">
                    LurnStack Live
                  </div>
                  <h3 className="max-w-[520px] text-[26px] font-black leading-tight text-white sm:text-[34px]">
                    {getSessionTitle(form)}
                  </h3>
                  <p className="mt-4 max-w-[460px] text-sm font-semibold leading-6 text-emerald-50 sm:text-base">
                    {form.description || form.offerTitle || 'Boost your learning with a focused LurnStack session and practical guidance.'}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
                    <span>{form.offerTitle || 'LurnStack Session'}</span>
                    <span>{form.validTill ? `Valid till ${form.validTill}` : 'Limited seats'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 text-[19px] leading-8 sm:text-[22px] sm:leading-9" style={{ color: text }}>
            <p className="mb-2">Inside this session, you will learn how to:</p>
            <ul className="m-0 list-none p-0">
              {bullets.map((item) => (
                <li key={item} className="flex gap-3">
                  <span style={{ color: '#0076d6' }}>◆</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8 space-y-2 text-[20px] leading-8 sm:text-[24px] sm:leading-9" style={{ color: text }}>
            <p className="m-0 font-black">🎓 {getSessionTitle(form)}</p>
            <p className="m-0">
              <Clock className="mr-2 inline h-6 w-6 align-[-4px]" />
              {form.validTill ? `Offer valid till ${form.validTill}` : 'Today'} | LurnStack Online
            </p>
            <p className="m-0 text-[18px] leading-8 sm:text-[21px]" style={{ color: muted }}>
              {isSessionTemplate
                ? 'If you are serious about building real-world skills, do not miss this session.'
                : 'Use this offer to continue your learning journey with LurnStack.'}
            </p>
          </div>

          <p className="mb-8 text-[20px] leading-8 sm:text-[22px]" style={{ color: text }}>
            See you inside,<br />
            Team Tamil Info Technology
          </p>

          <div className="px-5 py-7 text-center text-white sm:px-8" style={{ background: footer }}>
            {form.showLogo === 'yes' ? <img src={darkLogo} alt="Tamil Info Technology" className="mx-auto mb-5 h-auto w-[190px] max-w-[70%]" /> : null}
            <p className="mx-auto max-w-[520px] text-[18px] leading-8 sm:text-[22px]">
              Tamil Info Technology helps learners build practical technology skills through live sessions, projects, and mentor-led guidance.
            </p>
            <div className="mx-auto my-5 h-px max-w-[520px] bg-white/60" />
            <p className="m-0 text-[16px] underline">Unsubscribe</p>
          </div>

          {form.buttonLink ? (
            <p className="mt-5 break-all text-xs leading-5" style={{ color: muted }}>
              If the button does not open, copy this link: {form.buttonLink}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

