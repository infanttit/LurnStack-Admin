import React from 'react';
import { Calendar, Clock, Video } from 'lucide-react';

const ScheduleSection = ({ formData, handleChange, setFormData, errors }) => {
  return (
    <section className="p-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">Schedule And Access</h2>
        <p className="mt-1 text-sm text-slate-500">Set timing, meeting link, and recurrence details.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 flex items-center text-sm font-semibold text-slate-700">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" /> Scheduled Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-400' : 'border-slate-200'}`}
          />
          {errors.date && <p className="mt-1 text-xs font-medium text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label className="mb-2 flex items-center text-sm font-semibold text-slate-700">
            <Clock className="mr-2 h-4 w-4 text-slate-400" /> Start Time *
          </label>
          <input
            type="time"
            name="timeInput"
            value={formData.timeInput}
            onChange={handleChange}
            className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.timeInput ? 'border-red-400' : 'border-slate-200'}`}
          />
          {errors.timeInput && <p className="mt-1 text-xs font-medium text-red-500">{errors.timeInput}</p>}
        </div>

        <div>
          <label className="mb-2 flex items-center text-sm font-semibold text-slate-700">
            <Clock className="mr-2 h-4 w-4 text-slate-400" /> End Time *
          </label>
          <input
            type="time"
            name="endTimeInput"
            value={formData.endTimeInput}
            onChange={handleChange}
            className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.endTimeInput ? 'border-red-400' : 'border-slate-200'}`}
          />
          {errors.endTimeInput && <p className="mt-1 text-xs font-medium text-red-500">{errors.endTimeInput}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Duration</label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="1 Hour">1 Hour</option>
            <option value="1.5 Hours">1.5 Hours</option>
            <option value="2 Hours">2 Hours</option>
            <option value="3 Hours">3 Hours</option>
          </select>
        </div>

        <div className="md:col-span-2 xl:col-span-4">
          <label className="mb-2 flex items-center text-sm font-semibold text-slate-700">
            <Video className="mr-2 h-4 w-4 text-slate-400" /> Google Meet Link *
          </label>
          <input
            type="url"
            name="meetLink"
            value={formData.meetLink}
            onChange={handleChange}
            className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.meetLink ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="https://meet.google.com/..."
          />
          {errors.meetLink && <p className="mt-1 text-xs font-medium text-red-500">{errors.meetLink}</p>}
        </div>

        <div className="md:col-span-2 xl:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Recurrence</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Recurring session
            </label>
            <select
              name="recurrenceType"
              value={formData.recurrenceType}
              onChange={handleChange}
              disabled={!formData.isRecurring}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {formData.isRecurring && (
          <div className="md:col-span-2 xl:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Recurring Days of the Week</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Sun', value: 0 },
                { label: 'Mon', value: 1 },
                { label: 'Tue', value: 2 },
                { label: 'Wed', value: 3 },
                { label: 'Thu', value: 4 },
                { label: 'Fri', value: 5 },
                { label: 'Sat', value: 6 }
              ].map((day) => {
                const isChecked = formData.recurringDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`relative flex h-10 cursor-pointer items-center justify-center rounded-lg border px-4 text-xs font-semibold transition ${
                      isChecked
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => {
                          const newDays = checked
                            ? [...prev.recurringDays, day.value]
                            : prev.recurringDays.filter((d) => d !== day.value);
                          return { ...prev, recurringDays: newDays.sort() };
                        });
                      }}
                    />
                    {day.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Checked days only.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ScheduleSection;
