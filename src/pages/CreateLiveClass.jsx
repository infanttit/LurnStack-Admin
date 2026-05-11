import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLiveClass } from '../store/slices/liveClassSlice';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, Clock, Video, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateLiveClass = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.liveClasses);

  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '', // Usually fetched from course list
    classTitle: '',
    instructor: '',
    description: '',
    startDate: '',
    startTime: '',
    duration: '',
    meetLink: '',
    status: 'Scheduled'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.courseId) newErrors.courseId = 'Course is required';
    if (!formData.classTitle) newErrors.classTitle = 'Class title is required';
    if (!formData.startDate) newErrors.startDate = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Time is required';
    if (!formData.meetLink) newErrors.meetLink = 'Meet link is required';
    else if (!formData.meetLink.includes('meet.google.com')) {
      newErrors.meetLink = 'Must be a valid Google Meet link';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // In a real app we'd get courseName from the selected courseId
      const submissionData = {
        ...formData,
        courseName: formData.courseId === 'c1' ? 'React Masterclass' : 'Other Course'
      };
      
      dispatch(createLiveClass(submissionData)).then((res) => {
        if (!res.error) {
          navigate('/live-classes');
        }
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
          <h1 className="text-2xl font-bold text-gray-900">Schedule Live Class</h1>
          <p className="text-gray-500 mt-1">Create a new live session and notify students.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course *</label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.courseId ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
              >
                <option value="">-- Select a Course --</option>
                <option value="c1">React Masterclass</option>
                <option value="c2">Node.js for Beginners</option>
              </select>
              {errors.courseId && <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>}
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
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.startDate ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-400" /> Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full p-2.5 bg-gray-50 border ${errors.startTime ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
              />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
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

          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">Upload Class Materials</p>
            <p className="text-xs text-gray-500 mt-1">PDF, Video, or Notes (Max 50MB)</p>
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
            {loading ? 'Scheduling...' : 'Schedule Class'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLiveClass;
