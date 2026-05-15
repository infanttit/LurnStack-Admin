import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLiveClass, updateLiveClass, fetchLiveClasses } from '../store/slices/liveClassSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, Clock, Video, Image as ImageIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../api/axiosClient';

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
    courseName: '',
    classTitle: '',
    instructor: '',
    description: '',
    date: '',
    timeInput: '',
    duration: '',
    meetLink: '',
    thumbnail: '', // URL or relative path
  });

  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && (!classes || classes.length === 0)) {
      dispatch(fetchLiveClasses());
    }
  }, [dispatch, isEditMode, classes]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!existing) return;

    const time = typeof existing.time === 'string' ? existing.time : '';
    const timeInput = amPmToTime24(time);

    setFormData({
      courseName: existing.courseName || '',
      classTitle: existing.classTitle || '',
      instructor: existing.instructor || '',
      description: existing.description || '',
      date: existing.date || '',
      timeInput,
      duration: existing.duration || '1 Hour',
      meetLink: existing.meetLink || '',
      thumbnail: existing.thumbnail || '',
    });

    setThumbnailPreview(existing.thumbnail ? resolveAssetUrl(existing.thumbnail) : '');
    setThumbnailFile(null);
  }, [existing, isEditMode]);

  const validate = () => {
    const newErrors = {};
    if (!formData.courseName) newErrors.courseName = 'Course name is required';
    if (!formData.classTitle) newErrors.classTitle = 'Class title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.timeInput) newErrors.timeInput = 'Time is required';
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const payload = {
        courseName: formData.courseName.trim(),
        classTitle: formData.classTitle.trim(),
        instructor: formData.instructor.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formattedTime,
        duration: formData.duration || '1 Hour',
        meetLink: formData.meetLink.trim(),
        thumbnail: formData.thumbnail.trim(),
        thumbnailFile,
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
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/live-classes" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Live Class' : 'Schedule Live Class'}</h1>
          <p className="text-gray-500 mt-1">{isEditMode ? 'Update the session details.' : 'Create a new live session and notify students.'}</p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.courseName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                placeholder="e.g. Full Stack Web Development"
              />
              {errors.courseName && <p className="text-red-500 text-xs mt-1">{errors.courseName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Title *</label>
              <input
                type="text"
                name="classTitle"
                value={formData.classTitle}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.classTitle ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                placeholder="e.g. React Hooks Deep Dive"
              />
              {errors.classTitle && <p className="text-red-500 text-xs mt-1">{errors.classTitle}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="What will be covered in this class?"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" /> Scheduled Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.date ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-400" /> Start Time *
              </label>
              <input
                type="time"
                name="timeInput"
                value={formData.timeInput}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.timeInput ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
              />
              {errors.timeInput && <p className="text-red-500 text-xs mt-1">{errors.timeInput}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select</option>
                <option value="1 Hour">1 Hour</option>
                <option value="1.5 Hours">1.5 Hours</option>
                <option value="2 Hours">2 Hours</option>
                <option value="3 Hours">3 Hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructor Name</label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Video className="w-4 h-4 mr-2 text-gray-400" /> Google Meet Link *
              </label>
              <input
                type="url"
                name="meetLink"
                value={formData.meetLink}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.meetLink ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                placeholder="https://meet.google.com/..."
              />
              {errors.meetLink && <p className="text-red-500 text-xs mt-1">{errors.meetLink}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2 text-gray-400" /> Thumbnail URL
              </label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.thumbnail ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                placeholder="https://example.com/image.jpg"
              />
              {errors.thumbnail && <p className="text-red-500 text-xs mt-1">{errors.thumbnail}</p>}
              <div className="mt-3 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload thumbnail</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onPickThumbnail} />
                </label>
                {thumbnailPreview ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
                      <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview('');
                        setThumbnailFile(null);
                        setFormData((prev) => ({ ...prev, thumbnail: '' }));
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-4">
          <Link
            to="/live-classes"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
          >
            {loading ? (isEditMode ? 'Saving...' : 'Scheduling...') : (isEditMode ? 'Save Changes' : 'Schedule Class')}
          </button>
        </div>
      </form>

    </div>
  );
};

export default CreateLiveClass;
