import React from 'react';
import { Users, BookOpen, Video, CheckCircle } from 'lucide-react';

const statCards = [
  { title: 'Total Courses', value: '124', icon: BookOpen, color: 'bg-blue-500' },
  { title: 'Total Students', value: '14,230', icon: Users, color: 'bg-green-500' },
  { title: 'Upcoming Live Classes', value: '12', icon: Video, color: 'bg-purple-500' },
  { title: 'Completed Classes', value: '458', icon: CheckCircle, color: 'bg-orange-500' },
];

const Dashboard = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
            <div className={`p-4 rounded-lg text-white ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Overview Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-400">Chart will be rendered here</p>
          </div>
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Live Class Scheduled</p>
                  <p className="text-xs text-gray-500">React Masterclass - Just now</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
