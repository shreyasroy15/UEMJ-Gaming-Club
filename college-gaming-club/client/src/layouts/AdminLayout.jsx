import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Shield,
  Swords,
  Megaphone,
  Image,
  LogOut,
  Menu,
  X,
  Gamepad2,
  Flame,
  Crosshair,
  UserCheck,
  Radio,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const gameItems = [
    { name: 'BGMI', path: '/admin/users?game=BGMI', icon: Gamepad2, color: 'text-amber-400', badge: 'Battle Royale' },
    { name: 'Free Fire', path: '/admin/users?game=Free Fire', icon: Flame, color: 'text-orange-400', badge: 'Survival' },
    { name: 'Valorant', path: '/admin/users?game=Valorant', icon: Crosshair, color: 'text-rose-400', badge: 'Tactical' },
  ];

  const settingItems = [
    { name: 'Admins', path: '/admin/users?role=admin', icon: UserCheck },
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
    <div className="min-h-screen bg-[#080A12] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#080A12]/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-sm tracking-wider font-mono">UEM GAMING CLUB</span>
          </div>
        </div>

        <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Console Live</span>
        </div>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#0B0E18] border-r border-slate-800/80 p-4 sm:p-5 
          flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Logo & Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-purple-400/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white font-mono tracking-wide leading-tight">UEM ESPORTS</h2>
                <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider block">
                  Admin Panel
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

          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
              Management
            </span>
            <nav className="space-y-1 pt-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-950/50 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/70 border border-transparent'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Section: Games */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block pt-3">
              Games
            </span>
            <nav className="space-y-1 pt-1">
              {gameItems.map((game) => (
                <Link
                  key={game.name}
                  to={game.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    location.search.includes(`game=${encodeURIComponent(game.name)}`)
                      ? 'bg-slate-900 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <game.icon className={`w-3.5 h-3.5 ${game.color}`} />
                    <span>{game.name}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-slate-800">
                    {game.badge}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Section: Settings */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block pt-3">
              Settings
            </span>
            <nav className="space-y-1 pt-1">
              {settingItems.map((setting) => (
                <Link
                  key={setting.name}
                  to={setting.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    location.search.includes('role=admin')
                      ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <setting.icon className="w-3.5 h-3.5 text-pink-400" />
                  <span>{setting.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5 mt-4">
          {/* Admin Console indicator */}
          <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-400">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Admin Console</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-bold">
              ONLINE
            </span>
          </div>

          {/* Current Admin Card */}
          <div className="px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Admin'}
                  className="w-7 h-7 rounded-full object-cover border border-purple-400/50 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Administrator'}</p>
                <p className="text-[9px] text-purple-300 uppercase font-mono">{user?.role || 'Admin'}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
