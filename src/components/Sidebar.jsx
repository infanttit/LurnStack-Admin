import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Users, Settings, BookOpen, LogOut, UsersRound, UserCheck, X, Receipt, IndianRupee, ClipboardCheck } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Courses', path: '/courses', icon: BookOpen },
  { name: 'Live Classes', path: '/live-classes', icon: Video },
  { name: 'Collaborative', path: '/collaborative', icon: UsersRound },
  { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Trainers', path: '/trainers', icon: UserCheck },
  { name: 'Payments & Ledger', path: '/payments', icon: Receipt },
  { name: 'Finances & Revenue', path: '/revenue', icon: IndianRupee },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const SidebarBrand = ({ showClose = false, onClose }) => (
  <div className="flex items-center justify-between px-6 py-5">
    <div>
      <h1 className="text-2xl font-bold tracking-wider text-blue-400 leading-tight">LurnStack</h1>
      <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">Admin Panel</p>
    </div>
    {showClose ? (
      <button
        type="button"
        onClick={onClose}
        className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
        aria-label="Close menu"
      >
        <X className="w-5 h-5" />
      </button>
    ) : null}
  </div>
);

const SidebarNav = ({ onNavigate, onLogout }) => (
  <>
    <nav className="flex-1 px-4 space-y-2 mt-1">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.name}</span>
        </NavLink>
      ))}
    </nav>

    <div className="p-4 border-t border-gray-800">
      <button
        onClick={onLogout}
        className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  </>
);

const Sidebar = ({ mobileOpen = false, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
    onClose?.();
  };

  return (
    <>
      {/* Desktop */}
      <aside className="w-64 bg-gray-900 text-white min-h-screen flex-col hidden md:flex">
        <SidebarBrand />
        <SidebarNav onNavigate={undefined} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-gray-900 text-white flex flex-col transform transition-transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
        >
          <SidebarBrand showClose onClose={onClose} />
          <SidebarNav onNavigate={onClose} onLogout={onLogout} />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
