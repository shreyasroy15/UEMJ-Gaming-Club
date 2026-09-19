import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Swords,
  Megaphone,
  Image,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Tournaments', path: '/admin/tournaments', icon: Trophy },
    { name: 'Matches', path: '/admin/matches', icon: Swords },
    { name: 'Points Table', path: '/admin/points-table', icon: Trophy },
    { name: 'Teams', path: '/admin/teams', icon: Shield },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { name: 'Gallery', path: '/admin/gallery', icon: Image },
    { name: 'Users', path: '/admin/users', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Close on desktop resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-fuchsia-400" />
            <span className="font-bold text-sm tracking-wider font-mono">ADMIN PORTAL</span>
          </div>
        </div>

        <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar - Off-canvas on mobile, fixed left column on desktop */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-950 border-r border-slate-800/80 p-5 
          flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Logo & Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white font-mono leading-tight">ESPORTS ADMIN</h2>
                <span className="text-[10px] text-fuchsia-400 font-semibold uppercase tracking-wider">
                  Management Suite
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2 mt-6">
          <div className="px-3.5 py-2 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs font-mono text-cyan-400">
            <span>Admin Console</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="px-3.5 py-2 bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user?.name}
                className="w-7 h-7 rounded-full object-cover border border-fuchsia-400/50"
              />
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 uppercase">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
