import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLiveClasses, deleteLiveClass } from '../../store/slices/liveClassSlice';
import { Plus, Edit2, Trash2, Search, Link as LinkIcon, Image as ImageIcon, Filter, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveAssetUrl } from '../../api/axiosClient';

const PAGE_SIZE = 8;

const safeLower = (value) => String(value || '').toLowerCase();
const getTitle = (cls) => cls?.classTitle || cls?.title || 'Untitled TIT Class';
const getCourse = (cls) => cls?.courseName || cls?.course?.name || cls?.courseTitle || '-';
const getInstructor = (cls) => cls?.instructor || cls?.trainerName || cls?.trainer?.name || '-';
const getMeetLink = (cls) => cls?.meetLink || cls?.meetingLink || '';
const getStartTime = (cls) => cls?.time || cls?.startTime || '-';
const getEndTime = (cls) => cls?.endTime || '';

const LiveClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { classes, loading, error } = useSelector((state) => state.liveClasses);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchLiveClasses());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this TIT class session?')) {
      dispatch(deleteLiveClass(id));
    }
  };

  const getStatus = (cls) => {
    if (cls?.status) return cls.status;
    if (!cls?.date) return 'Scheduled';
    const now = new Date();
    const dateOnly = new Date(`${cls.date}T00:00:00`);
    if (Number.isNaN(dateOnly.getTime())) return 'Scheduled';
    return dateOnly < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? 'Completed' : 'Scheduled';
  };

  const getStatusStyles = (status) => {
    if (status === 'Completed') return 'bg-green-100 text-green-800';
    if (status === 'Live') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const filteredClasses = (classes || []).filter(
    (c) => {
      const q = safeLower(searchTerm).trim();
      const matchesSearch =
        !q ||
        safeLower(getTitle(c)).includes(q) ||
        safeLower(getCourse(c)).includes(q) ||
        safeLower(getInstructor(c)).includes(q);

      const matchesCourse = !selectedCourse || String(getCourse(c)).trim() === selectedCourse;

      const status = getStatus(c);
      const matchesStatus = !selectedStatus || status === selectedStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    }
  );

  const courseOptions = Array.from(
    new Set((classes || []).map((c) => String(getCourse(c) || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCourse, selectedStatus]);

  const totalEntries = filteredClasses.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  const startIndex = totalEntries ? (page - 1) * PAGE_SIZE : 0;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const items = new Set([1, totalPages]);
    for (let p = page - 1; p <= page + 1; p += 1) {
      if (p > 1 && p < totalPages) items.add(p);
    }
    const sorted = Array.from(items).sort((a, b) => a - b);

    const withGaps = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && current - prev > 1) withGaps.push('gap');
      withGaps.push(current);
    }
    return withGaps;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedStatus('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TIT Classes</h1>
          <p className="text-gray-500 mt-1">Create and manage admin TIT sessions for the student TIT Classes section.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/live-classes/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>Create</span>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              placeholder="Search TIT classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full appearance-none text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Courses</option>
                {courseOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!searchTerm && !selectedCourse && !selectedStatus}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Instructor</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Meet Link</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Loading TIT classes...
                  </td>
                </tr>
              ) : paginatedClasses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No TIT classes found.
                  </td>
                </tr>
              ) : (
                paginatedClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[280px]">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                          {cls.thumbnail ? (
                            <img src={resolveAssetUrl(cls.thumbnail)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{getTitle(cls)}</p>
                          <p className="text-xs text-gray-500 truncate">{getCourse(cls)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{getInstructor(cls)}</td>
                    <td className="p-4">
                      <p className="text-gray-900">{cls.date || '-'}</p>
                      <p className="text-xs text-gray-500">
                        {getStartTime(cls)}{getEndTime(cls) ? ` - ${getEndTime(cls)}` : ''} ({cls.duration || '-'})
                      </p>
                    </td>
                    <td className="p-4">
                      {getMeetLink(cls) ? (
                        <a
                          href={getMeetLink(cls)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span className="truncate w-24 inline-block align-bottom">{getMeetLink(cls)}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const status = getStatus(cls);
                        return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        getStatusStyles(status)
                      }`}>
                        {status}
                      </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/live-classes/edit/${cls.id}`)}
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cls.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">Loading TIT classes...</div>
          ) : paginatedClasses.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No TIT classes found.</div>
          ) : (
            paginatedClasses.map((cls) => {
              const status = getStatus(cls);
              return (
                <div key={cls.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {cls.thumbnail ? (
                        <img src={resolveAssetUrl(cls.thumbnail)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{getTitle(cls)}</p>
                      <p className="text-xs text-gray-500 truncate">{getCourse(cls)}</p>
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Instructor</span>
                          <span className="truncate">{getInstructor(cls)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Date</span>
                          <span>{cls.date || '-'}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-gray-500">Time</span>
                          <span className="truncate">
                            {getStartTime(cls)}{getEndTime(cls) ? ` - ${getEndTime(cls)}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}
                        >
                          {status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/live-classes/edit/${cls.id}`)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {getMeetLink(cls) ? (
                        <a
                          href={getMeetLink(cls)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span className="truncate max-w-[260px]">{getMeetLink(cls)}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>
              Showing {totalEntries ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || totalEntries === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageItems().map((item, idx) =>
                item === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    disabled={totalEntries === 0}
                    className={`min-w-[36px] px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      item === page ? 'bg-blue-50 text-blue-700 border-blue-100' : 'border-gray-200 text-gray-700'
                    }`}
                    aria-current={item === page ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || totalEntries === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LiveClasses;

