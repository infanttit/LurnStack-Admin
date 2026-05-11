import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLiveClasses, deleteLiveClass } from '../store/slices/liveClassSlice';
import { Plus, Edit2, Trash2, Users, Search, MoreVertical, Link as LinkIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LiveClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { classes, loading } = useSelector((state) => state.liveClasses);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchLiveClasses());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this live class?')) {
      dispatch(deleteLiveClass(id));
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.classTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-500 mt-1">Manage scheduled live sessions and Google Meet links.</p>
        </div>
        <Link
          to="/live-classes/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Live Class</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
              Filter by Course
            </button>
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
              Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Course / Title</th>
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
                    Loading classes...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No live classes found.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{cls.classTitle}</p>
                      <p className="text-xs text-gray-500">{cls.courseName}</p>
                    </td>
                    <td className="p-4 text-gray-700">{cls.instructor}</td>
                    <td className="p-4">
                      <p className="text-gray-900">{cls.startDate}</p>
                      <p className="text-xs text-gray-500">{cls.startTime} ({cls.duration})</p>
                    </td>
                    <td className="p-4">
                      <a 
                        href={cls.meetLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span className="truncate w-24 inline-block align-bottom">{cls.meetLink}</span>
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        cls.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        cls.status === 'Live' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/live-classes/attendance/${cls.id}`)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Attendance"
                        >
                          <Users className="w-4 h-4" />
                        </button>
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
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>Showing 1 to {filteredClasses.length} of {filteredClasses.length} entries</div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>Previous</button>
            <button className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveClasses;
