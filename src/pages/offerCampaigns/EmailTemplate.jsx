import React from 'react';
import { CalendarDays, Save } from 'lucide-react';
import logoImage from '../../Assets/Logo/Logo3.png';
import { ReadOnlyField, SelectField, TextField } from './Fields';

export const TemplateStep = ({ form, selectedTemplate, onChange, onHeroImageChange, onSaveTemplate }) => (
  <div className="space-y-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-base font-bold text-slate-900">Fixed Email Template</h3>
      <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
        {selectedTemplate.name}
      </span>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <SelectField label="Logo" name="showLogo" value={form.showLogo} onChange={onChange}>
        <option value="yes">Show LurnStack logo</option>
        <option value="no">Hide logo</option>
      </SelectField>
      <SelectField label="Email Theme" name="theme" value={form.theme} onChange={onChange}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </SelectField>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Offer Image</label>
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
      <ReadOnlyField label="Generated View Offer Link" value={form.buttonLink} />
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
  const palette = {
    shell: dark ? '#111111' : '#ffffff',
    text: dark ? '#f8fafc' : '#111827',
    muted: dark ? '#cbd5e1' : '#4b5563',
    border: dark ? '#363636' : '#e5e7eb',
    accent: '#0b7cff',
    footer: dark ? '#a3a3a3' : '#6b7280',
  };

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Email Preview</h2>
          <p className="text-xs text-slate-400">Compact customer-facing layout</p>
        </div>
        {form.subject ? (
          <span className="max-w-xs truncate rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
            {form.subject}
          </span>
        ) : null}
      </div>

      <div
        className="mx-auto w-full max-w-[640px]"
        style={{
          background: palette.shell,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ padding: '28px 32px' }}>
          {form.showLogo === 'yes' ? (
            <img src={logoImage} alt="LurnStack" style={{ width: 170, maxWidth: '46%', height: 'auto', marginBottom: 28 }} />
          ) : null}

          <p style={{ margin: '0 0 20px', fontSize: 18, lineHeight: 1.5, color: palette.text }}>
            Hey learner,
          </p>

          <h1 style={{ margin: '0 0 18px', fontSize: 28, lineHeight: 1.25, fontWeight: 700, color: palette.text }}>
            {form.heading || 'Your learning offer is ready'}
          </h1>

          {form.offerTitle ? (
            <div
              style={{
                margin: '0 0 22px',
                padding: '14px 16px',
                borderLeft: `5px solid ${palette.accent}`,
                background: palette.shell,
              }}
            >
              <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: palette.accent }}>
                Your Offer
              </p>
              <p style={{ margin: 0, fontSize: 22, lineHeight: 1.35, fontWeight: 800, color: palette.text }}>
                {form.offerTitle}
              </p>
            </div>
          ) : null}

          {form.heroImage ? (
            <img
              src={form.heroImage}
              alt=""
              style={{ width: '100%', maxHeight: 190, objectFit: 'cover', display: 'block', margin: '0 0 22px' }}
            />
          ) : null}

          <p style={{ margin: '0 0 24px', fontSize: 18, lineHeight: 1.65, color: palette.text }}>
            {form.body || 'We selected this offer based on your learning interest. Reserve your seat before the offer expires.'}
          </p>

          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                display: 'inline-block',
                background: palette.shell,
                border: `1px solid ${palette.text}`,
                borderRadius: 999,
                padding: '13px 30px',
                fontSize: 20,
                fontWeight: 700,
                color: palette.text,
                lineHeight: 1,
              }}
            >
              {form.buttonText || 'View Offer'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, color: palette.muted, fontSize: 14 }}>
            <CalendarDays style={{ width: 15, height: 15 }} />
            <span>{form.validTill ? `Offer valid till ${form.validTill}` : 'Offer expiry date not selected'}</span>
          </div>

          {form.buttonLink ? (
            <p style={{ margin: '0 0 28px', wordBreak: 'break-all', fontSize: 12, lineHeight: 1.55, color: palette.footer }}>
              If the button does not open, copy this link: {form.buttonLink}
            </p>
          ) : null}

          <p style={{ margin: '0 0 4px', fontSize: 18, color: palette.text }}>Regards,</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: palette.text }}>Team Tamil Info Technology</p>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: palette.footer }}>LurnStack, Chennai, India</p>
        </div>
      </div>
    </section>
  );
};
