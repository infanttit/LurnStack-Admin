import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  Settings, 
  BookOpen, 
  LogOut, 
  UsersRound, 
  UserCheck, 
  X, 
  Receipt, 
  HandCoins,
  ClipboardCheck, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Clock,
  MailPlus
} from 'lucide-react';
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
  { name: 'Trainer Payouts', path: '/trainer-payouts', icon: HandCoins },
  { name: 'Pending Reviews', path: '/pending-sessions', icon: Clock },
  {
    name: 'Offers & Emails',
    path: '/offer-campaigns',
    icon: MailPlus,
    children: [
      { name: 'Campaigns', path: '/offer-campaigns' },
      { name: 'Create Campaign', path: '/offer-campaigns/create' },
      { name: 'Send History', path: '/offer-campaigns/history' },
    ],
  },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const SidebarBrand = ({ isCollapsed, onToggleCollapse, showClose = false, onClose }) => (
  <div className={`flex items-center px-6 py-5 border-b border-gray-800/40 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
    {!isCollapsed && (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-wider text-blue-400 leading-tight">LurnStack</h1>
        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">Admin Panel</p>
      </div>
    )}
    {/* Toggle Collapse Button for desktop, close button for mobile */}
    <div className="flex items-center">
      {!showClose ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all active:scale-95"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
);

const SidebarNav = ({ isCollapsed, onNavigate, onLogout }) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const activeSections = navItems.reduce((acc, item) => {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const isSectionActive =
        location.pathname === item.path ||
        (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

      if (hasChildren && isSectionActive) {
        acc[item.name] = true;
      }

      return acc;
    }, {});

    if (Object.keys(activeSections).length) {
      setOpenSections((prev) => ({ ...prev, ...activeSections }));
    }
  }, [location.pathname]);

  const toggleSection = (itemName) => {
    setOpenSections((prev) => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  return (
    <>
    <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar pr-1">
      {navItems.map((item) => {
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
        const isSectionActive =
          location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
        const isSectionOpen = !!openSections[item.name];

        return (
          <div key={item.name}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleSection(item.name)}
                title={isCollapsed ? item.name : undefined}
                className={`flex w-full items-center rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
                } ${
                  isSectionActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium animate-fade-in whitespace-nowrap text-sm flex-1 text-left">{item.name}</span>
                    {isSectionOpen ? (
                      <ChevronDown className={`h-4 w-4 ${isSectionActive ? 'text-blue-100' : 'text-gray-500'}`} />
                    ) : (
                      <ChevronRight className={`h-4 w-4 ${isSectionActive ? 'text-blue-100' : 'text-gray-500'}`} />
                    )}
                  </>
                )}
              </button>
            ) : (
              <NavLink
                to={item.path}
                onClick={onNavigate}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all duration-200 ${
                    isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
                  } ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium animate-fade-in whitespace-nowrap text-sm">{item.name}</span>}
              </NavLink>
            )}

            {hasChildren && !isCollapsed && isSectionOpen ? (
              <div className="mt-2 ml-5 space-y-1 border-l border-gray-700 pl-3">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    end={child.path === item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800/70 hover:text-white'
                      }`
                    }
                  >
                    {child.name}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>

    <div className="p-4 border-t border-gray-800">
      <button
        onClick={onLogout}
        title={isCollapsed ? "Logout" : undefined}
        className={`flex items-center w-full text-left text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 ${
          isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
        }`}
      >
        <LogOut className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span className="font-medium animate-fade-in whitespace-nowrap text-sm">Logout</span>}
      </button>
    </div>
    </>
  );
};

const Sidebar = ({ mobileOpen = false, onClose, isCollapsed = false, onToggleCollapse }) => {
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
      <aside className={`bg-gray-900 text-white h-screen flex flex-col hidden md:flex sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarBrand isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
        <SidebarNav isCollapsed={isCollapsed} onNavigate={undefined} onLogout={onLogout} />
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
          <SidebarBrand showClose onClose={onClose} isCollapsed={false} onToggleCollapse={undefined} />
          <SidebarNav isCollapsed={false} onNavigate={onClose} onLogout={onLogout} />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
