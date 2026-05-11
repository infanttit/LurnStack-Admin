import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Users, Settings, BookOpen, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Courses', path: '/courses', icon: BookOpen },
  { name: 'Live Classes', path: '/live-classes', icon: Video },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-blue-400">LurnStack</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
