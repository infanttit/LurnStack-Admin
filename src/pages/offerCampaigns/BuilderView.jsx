import React from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Save, Send, Users } from 'lucide-react';
import { audienceOptions, createSteps } from './constants';
import { PreviewPanel, TemplateStep } from './EmailTemplate';
import { SelectField, TextField } from './Fields';

const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
    <span className="text-slate-500">{label}</span>
    <span className="max-w-[220px] text-right font-medium text-slate-900">{value}</span>
  </div>
);

const ReviewItem = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const OfferStep = ({ form, onChange }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <TextField label="Campaign Name" name="campaignName" value={form.campaignName} onChange={onChange} placeholder="Weekend web development offer" />
    <TextField label="Offer Title" name="offerTitle" value={form.offerTitle} onChange={onChange} placeholder="25% off live sessions" />
    <TextField label="Valid Till" name="validTill" type="date" value={form.validTill} onChange={onChange} />
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-medium text-slate-700">Offer Description</label>
      <textarea name="description" value={form.description} onChange={onChange} rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
    </div>
  </div>
);

const AudienceStep = ({ form, categories, selectedAudience, selectedCategories, availableCourses, availableSessions, dataSource, error, onChange, onToggleCategory, onReloadTargets }) => (
  <div className="space-y-5">
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-700">Categories</label>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {dataSource === 'live' ? 'Live data' : dataSource === 'loading' ? 'Loading data' : dataSource === 'fallback' ? 'Fallback data' : 'Target data error'}
          </span>
          <button type="button" onClick={onReloadTargets} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400">
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const selected = form.categoryIds.includes(category.id);
          return (
            <button key={category.id} type="button" onClick={() => onToggleCategory(category.id)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${selected ? 'border-slate-900 bg-white text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>
              {category.name}
            </button>
          );
        })}
        {!categories.length && dataSource !== 'loading' ? (
          <div className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
            {error || 'No categories available from backend.'}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">Select one or more categories. Course and session filters are optional.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <SelectField label="Course (Optional)" name="courseId" value={form.courseId} onChange={onChange}>
        <option value="">All courses in selected categories</option>
        {availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
      </SelectField>
      <SelectField label="Session (Optional)" name="sessionId" value={form.sessionId} onChange={onChange}>
        <option value="">All matching sessions</option>
        {availableSessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
      </SelectField>
      <SelectField label="Audience" name="audienceType" value={form.audienceType} onChange={onChange}>
        {audienceOptions.map((audience) => <option key={audience.id} value={audience.id}>{audience.label}</option>)}
      </SelectField>
    </div>

    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      Recipients will be calculated by backend from <span className="font-bold">{selectedCategories.length || 0}</span> selected categories.
    </div>
  </div>
);

const ReviewStep = ({ form, selectedAudience, selectedCategories, selectedCourse, selectedSession, selectedTemplate }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <ReviewItem label="Campaign" value={form.campaignName || '-'} />
    <ReviewItem label="Offer" value={form.offerTitle || '-'} />
    <ReviewItem label="Valid Till" value={form.validTill || '-'} />
    <ReviewItem label="Categories" value={selectedCategories.map((category) => category.name).join(', ') || '-'} />
    <ReviewItem label="Course" value={selectedCourse?.name || 'All matching courses'} />
    <ReviewItem label="Session" value={selectedSession?.name || 'All matching sessions'} />
    <ReviewItem label="Audience" value={selectedAudience.label} />
    <ReviewItem label="Recipients" value="Calculated by backend" />
    <ReviewItem label="Template" value={selectedTemplate.name} />
  </div>
);

const SummaryPanel = ({ form, selectedAudience, selectedCategories, selectedCourse, selectedSession, selectedTemplate }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">Campaign Summary</h2>
      <Users className="h-5 w-5 text-slate-400" />
    </div>
    <div className="space-y-3 text-sm">
      <SummaryRow label="Campaign" value={form.campaignName || '-'} />
      <SummaryRow label="Audience" value={selectedAudience.label} />
      <SummaryRow label="Recipients" value="Calculated by backend" />
      <SummaryRow label="Categories" value={selectedCategories.map((category) => category.name).join(', ') || '-'} />
      <SummaryRow label="Course" value={selectedCourse?.name || 'All matching courses'} />
      <SummaryRow label="Session" value={selectedSession?.name || 'All matching sessions'} />
      <SummaryRow label="Template" value={selectedTemplate.name} />
    </div>
  </section>
);

export const BuilderView = (props) => {
  const { activeStep, form, selectedTemplate, onChange, onHeroImageChange, onSaveTemplate, onBack, onNext, onSaveDraft, onMarkReady, onSend, onReset } = props;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700">Step {activeStep + 1} of {createSteps.length}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{createSteps[activeStep].title}</h2>
              <p className="mt-1 text-sm text-slate-500">{createSteps[activeStep].description}</p>
            </div>
            <button type="button" onClick={onReset} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">Clear</button>
          </div>
          <div className="h-1.5 rounded-full border border-slate-200 bg-white">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${((activeStep + 1) / createSteps.length) * 100}%` }} />
          </div>
        </div>
        <div className="p-5">
          {activeStep === 0 && <OfferStep form={form} onChange={onChange} />}
          {activeStep === 1 && <AudienceStep {...props} />}
          {activeStep === 2 && <TemplateStep form={form} selectedTemplate={selectedTemplate} onChange={onChange} onHeroImageChange={onHeroImageChange} onSaveTemplate={onSaveTemplate} />}
          {activeStep === 3 && (
            <div className="space-y-5">
              <ReviewStep {...props} />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <SummaryPanel {...props} />
                <PreviewPanel form={form} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={onBack} disabled={activeStep === 0} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {activeStep < createSteps.length - 1 && (
              <button type="button" onClick={onNext} className="inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white">
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex">
            <button type="button" onClick={onSaveDraft} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            {activeStep === createSteps.length - 1 && (
              <>
                <button type="button" onClick={onMarkReady} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  <Eye className="h-4 w-4" />
                  Mark Ready
                </button>
                <button type="button" onClick={onSend} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  <Send className="h-4 w-4" />
                  Submit & Send
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
