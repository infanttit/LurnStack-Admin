import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

const Topbar = ({ onMenuClick }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-10">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden mr-3 text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-lg hover:bg-gray-50"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500 outline-none transition-all"
            placeholder="Search classes, students..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            AD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
