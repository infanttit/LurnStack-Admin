import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLiveClass, updateLiveClass, fetchLiveClasses } from '../../store/slices/liveClassSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, Clock, Video, Image as ImageIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../api/axiosClient';
import { getLiveClassApi } from '../../api/liveClasses';
import ScheduleSection from './ScheduleSection';

const time24ToAmPm = (time24) => {
  const match = String(time24 || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  let hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours)) return '';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${suffix}`;
};

const amPmToTime24 = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!match) {
    const direct = raw.match(/^(\d{1,2}):(\d{2})$/);
    return direct ? `${direct[1].padStart(2, '0')}:${direct[2]}` : '';
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = match[3].toUpperCase();
  if (Number.isNaN(hours)) return '';
  if (hours === 12) hours = 0;
  if (suffix === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const CreateLiveClass = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { loading, classes, error } = useSelector((state) => state.liveClasses);

  const existing = useMemo(() => {
    if (!id) return null;
    return classes.find((c) => String(c.id) === String(id)) || null;
  }, [classes, id]);

  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    classTitle: '',
    instructor: '',
    description: '',
    date: '',
    timeInput: '',
    endTimeInput: '',
    duration: '',
    meetLink: '',
    thumbnail: '', // URL or relative path
    isRecurring: false,
    recurrenceType: 'daily',
    trainerInstructions: '',
    recurringDays: [],
    classType: 'course', // 'course' | 'TIT'
  });

  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [errors, setErrors] = useState({});

  const [singleClass, setSingleClass] = useState(null);
  const [isFetchingSingle, setIsFetchingSingle] = useState(false);

  useEffect(() => {
    if (isEditMode && (!classes || classes.length === 0)) {
      dispatch(fetchLiveClasses());
    }
  }, [dispatch, isEditMode, classes]);

  useEffect(() => {
    if (isEditMode && id) {
      setIsFetchingSingle(true);
      getLiveClassApi(id)
        .then((res) => {
          const data = res?.data?.class || res?.data || res;
          setSingleClass(data);
        })
        .catch(console.error)
        .finally(() => setIsFetchingSingle(false));
    }
  }, [isEditMode, id]);

  useEffect(() => {
    if (!isEditMode) return;
    
    const dataToUse = singleClass || existing;
    if (!dataToUse) return;

    const time = typeof dataToUse.time === 'string' ? dataToUse.time : '';

    let parsedRecurringDays = [];
    if (Array.isArray(dataToUse.recurringDays)) {
      parsedRecurringDays = dataToUse.recurringDays;
    } else if (typeof dataToUse.recurringDays === 'string' && dataToUse.recurringDays.trim() !== '') {
      try {
        parsedRecurringDays = dataToUse.recurringDays.startsWith('[')
          ? JSON.parse(dataToUse.recurringDays)
          : dataToUse.recurringDays.split(',').map(Number).filter(n => !Number.isNaN(n));
      } catch (e) {
        parsedRecurringDays = [];
      }
    }

    const isSessionTIT = dataToUse.sectionType === 'TIT' || dataToUse.sessionType === 'TIT' || dataToUse.source === 'admin_tit_classes';
    setFormData({
      courseId: dataToUse.courseId || dataToUse.course_id || dataToUse.course?.id || dataToUse.course?._id || '',
      courseName: dataToUse.courseName || dataToUse.course?.name || dataToUse.courseTitle || '',
      classTitle: dataToUse.classTitle || dataToUse.title || '',
      instructor: dataToUse.instructor || dataToUse.trainerName || dataToUse.trainer?.name || '',
      description: dataToUse.description || '',
      date: dataToUse.date || '',
      timeInput: amPmToTime24(dataToUse.startTime || dataToUse.time || time),
      endTimeInput: amPmToTime24(dataToUse.endTime || dataToUse.endsAt || dataToUse.end_time || ''),
      duration: dataToUse.duration || '1 Hour',
      meetLink: dataToUse.meetLink || dataToUse.meetingLink || '',
      thumbnail: dataToUse.thumbnail || '',
      isRecurring: Boolean(dataToUse.isRecurring),
      recurrenceType: dataToUse.recurrenceType || 'daily',
      trainerInstructions: dataToUse.trainerInstructions || '',
      recurringDays: parsedRecurringDays,
      classType: isSessionTIT ? 'TIT' : 'course',
    });

    setThumbnailPreview(dataToUse.thumbnail ? resolveAssetUrl(dataToUse.thumbnail) : '');
    setThumbnailFile(null);
  }, [existing, singleClass, isEditMode]);

  const validate = () => {
    const newErrors = {};
    if (!formData.courseId.trim()) newErrors.courseId = 'Course ID is required';
    if (!formData.courseName) newErrors.courseName = 'Course name is required';
    if (!formData.classTitle) newErrors.classTitle = 'Class title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.timeInput) newErrors.timeInput = 'Time is required';
    if (!formData.endTimeInput) newErrors.endTimeInput = 'End time is required';
    if (formData.timeInput && formData.endTimeInput && formData.endTimeInput <= formData.timeInput) {
      newErrors.endTimeInput = 'End time must be after start time';
    }
    if (!formData.meetLink) newErrors.meetLink = 'Meet link is required';
    else if (!formData.meetLink.includes('meet.google.com')) {
      newErrors.meetLink = 'Must be a valid Google Meet link';
    }
    if (formData.thumbnail && !/^https?:\/\//i.test(formData.thumbnail) && !/^(uploads\/|\/uploads\/)/i.test(formData.thumbnail)) {
      newErrors.thumbnail = 'Thumbnail must be a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const onPickThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setThumbnailFile(file);
    setFormData((prev) => ({ ...prev, thumbnail: '' }));
    setThumbnailPreview(objectUrl);
    if (errors.thumbnail) setErrors((prev) => ({ ...prev, thumbnail: '' }));
    e.target.value = '';
  };

  useEffect(() => {
    if (thumbnailFile) return;
    const value = formData.thumbnail?.trim();
    if (!value) {
      setThumbnailPreview('');
      return;
    }
    setThumbnailPreview(resolveAssetUrl(value));
  }, [formData.thumbnail, thumbnailFile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const formattedTime = time24ToAmPm(formData.timeInput);
      const isTIT = formData.classType === 'TIT';
      const payload = {
        sectionType: isTIT ? 'TIT' : null,
        sessionType: isTIT ? 'TIT' : null,
        source: isTIT ? 'admin_tit_classes' : 'admin_course_classes',
        createdByRole: 'admin',
        publishState: isTIT ? 'DRAFT' : 'PUBLISHED',
        pricingState: isTIT ? 'PENDING_PRICE' : 'FREE',
        requiresAdminReview: isTIT,
        courseId: formData.courseId.trim(),
        course_id: formData.courseId.trim(),
        courseName: formData.courseName.trim(),
        classTitle: formData.classTitle.trim(),
        title: formData.classTitle.trim(),
        instructor: formData.instructor.trim(),
        instructorName: formData.instructor.trim(),
        trainerName: formData.instructor.trim(),
        trainer_name: formData.instructor.trim(),
        teacher: formData.instructor.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formattedTime,
        startTime: formData.timeInput,
        endTime: formData.endTimeInput,
        endsAt: formData.endTimeInput,
        end_time: formData.endTimeInput,
        duration: formData.duration || '1 Hour',
        meetLink: formData.meetLink.trim(),
        meetingLink: formData.meetLink.trim(),
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined,
        thumbnail: formData.thumbnail.trim(),
        thumbnailFile,
        trainerInstructions: formData.trainerInstructions.trim(),
        recurringDays: formData.isRecurring ? JSON.stringify(formData.recurringDays) : undefined,
        recurring_days: formData.isRecurring ? JSON.stringify(formData.recurringDays) : undefined,
      };

      const action = isEditMode
        ? updateLiveClass({ id, data: payload })
        : createLiveClass(payload);

      dispatch(action).then((res) => {
        if (!res.error) navigate('/live-classes');
      });
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl pb-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/live-classes"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="mb-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              {formData.classType === 'TIT' ? 'TIT Classes' : 'Standard Course Section'}
            </div>
            <h1 className="text-2xl font-bold text-slate-950">
              {isEditMode 
                ? (formData.classType === 'TIT' ? 'Edit TIT Class' : 'Edit Course Class') 
                : (formData.classType === 'TIT' ? 'Create TIT Class' : 'Create Course Class')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {formData.classType === 'TIT' 
                ? 'Create a TIT session for review, pricing, and student publishing.' 
                : 'Create a regular session tracked for attendance.'}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            <section className="p-6 bg-slate-50/50">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Class Type Selection</h2>
                <p className="mt-1 text-sm text-slate-500">Choose whether this class belongs to a standard course or is a TIT class.</p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Class Type *</label>
                  <select
                    name="classType"
                    value={formData.classType}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="course">Standard Course Section (Tracked for Attendance)</option>
                    <option value="TIT">TIT Class (Pending Review & Pricing)</option>
                  </select>
                </div>
              </div>
            </section>
            
            <section className="p-6">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Course And Session Details</h2>
                <p className="mt-1 text-sm text-slate-500">Map this class to the course and title shown to students.</p>
              </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Course ID *</label>
                <input
                  type="text"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.courseId ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="Course/category ID"
                />
                {errors.courseId && <p className="mt-1 text-xs font-medium text-red-500">{errors.courseId}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Course Name *</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.courseName ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="e.g. Full Stack Web Development"
                />
                {errors.courseName && <p className="mt-1 text-xs font-medium text-red-500">{errors.courseName}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Today Titles *</label>
                <input
                  type="text"
                  name="classTitle"
                  value={formData.classTitle}
                  onChange={handleChange}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.classTitle ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="e.g. React Hooks Deep Dive"
                />
                {errors.classTitle && <p className="mt-1 text-xs font-medium text-red-500">{errors.classTitle}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Instructor Name</label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">TIT Class Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
                  placeholder="What will be covered in this TIT class?"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Trainer Instructions / Notes for Students</label>
                <textarea
                  name="trainerInstructions"
                  value={formData.trainerInstructions}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Classes will be conducted only from Monday to Thursday"
                />
              </div>
            </div>
          </section>

          <ScheduleSection
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            errors={errors}
          />

          <section className="p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">Media</h2>
              <p className="mt-1 text-sm text-slate-500">Attach a thumbnail by URL or upload a local image.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_220px]">
              <div>
                <label className="mb-2 flex items-center text-sm font-semibold text-slate-700">
                  <ImageIcon className="mr-2 h-4 w-4 text-slate-400" /> Thumbnail URL
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${errors.thumbnail ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.thumbnail && <p className="mt-1 text-xs font-medium text-red-500">{errors.thumbnail}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Upload className="h-4 w-4" />
                    Upload thumbnail
                    <input type="file" accept="image/*" className="hidden" onChange={onPickThumbnail} />
                  </label>
                  {thumbnailPreview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview('');
                        setThumbnailFile(null);
                        setFormData((prev) => ({ ...prev, thumbnail: '' }));
                      }}
                      className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="" className="h-32 w-full rounded-lg object-cover" />
                ) : (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <ImageIcon className="mx-auto mb-2 h-6 w-6" />
                    No thumbnail
                  </div>
                )}
              </div>
            </div>
          </section>
          </div>

        <aside className="border-t border-slate-100 bg-slate-50/70 p-6 rounded-b-xl">
          {formData.classType === 'TIT' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <h3 className="font-bold">Review And Pricing Flow</h3>
              <p className="mt-2 leading-relaxed">
                This TIT class is saved as pending price review. Set the price from Pending Reviews before publishing to students.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <h3 className="font-bold">Standard Course Class</h3>
              <p className="mt-2 leading-relaxed">
                This session will be immediately published to students under standard course listings, and will generate occurrences tracked by the attendance system.
              </p>
            </div>
          )}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Publish State</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Section</span>
                <span className="font-semibold text-slate-900">
                  {formData.classType === 'TIT' ? 'TIT' : 'Standard Course'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  formData.classType === 'TIT' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {formData.classType === 'TIT' ? 'Pending Price' : 'Active & Published'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Visibility</span>
                <span className="font-semibold text-slate-900">
                  {formData.classType === 'TIT' ? 'After Review' : 'Immediate'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : (formData.classType === 'TIT' ? 'Create TIT Class' : 'Create Course Class'))}
            </button>
            <Link
              to="/live-classes"
              className="flex h-11 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-200 bg-white px-8 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CreateLiveClass;

