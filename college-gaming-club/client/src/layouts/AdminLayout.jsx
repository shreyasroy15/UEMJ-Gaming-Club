import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import Avatar from '../components/Avatar/Avatar';
import AdminCommandPalette from '../components/Admin/AdminCommandPalette';
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
  Search,
  ChevronDown,
  Gamepad2,
  Calendar,
  ExternalLink,
  Flame,
  CheckCircle2,
  Sparkles,
  Command,
  Activity,
  Plus,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [paletteOpen, setPaletteOpen] = useState(false); // Command palette
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Handle desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Structured Navigation Groups
  const navSections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
        { name: 'Tournaments', path: '/admin/tournaments', icon: Trophy },
        { name: 'Matches', path: '/admin/matches', icon: Swords },
        { name: 'Points Table', path: '/admin/points-table', icon: Trophy },
        { name: 'Teams', path: '/admin/teams', icon: Shield },
        { name: 'Users', path: '/admin/users', icon: Users },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
        { name: 'Gallery', path: '/admin/gallery', icon: Image },
      ],
    },
    {
      title: 'GAMES',
      items: [
        {
          name: 'BGMI',
          path: '/admin/games/bgmi',
          icon: Gamepad2,
          tag: 'BR',
          color: 'text-cyan-400',
          indicatorColor: 'bg-cyan-400',
        },
        {
          name: 'Free Fire',
          path: '/admin/games/free-fire',
          icon: Gamepad2,
          tag: 'SURV',
          color: 'text-orange-400',
          indicatorColor: 'bg-orange-400',
        },
        {
          name: 'Valorant',
          path: '/admin/games/valorant',
          icon: Gamepad2,
          tag: 'FPS',
          color: 'text-rose-400',
          indicatorColor: 'bg-rose-400',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen admin-grid-bg text-slate-800 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* ========================================================================= */}
      {/* TOP HEADER COMMAND BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 h-16 sm:h-20 admin-glass-panel border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-6 shadow-sm">
        {/* Left: Logo, Branding & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Mobile drawer toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin" className="flex items-center gap-2.5 sm:gap-3.5 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-950 border border-lime-400/40 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.25)] group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <img
                src="/assets/gaming-geeks-logo.png"
                alt="Gaming Geeks Club"
                className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(163,230,53,0.6)]"
              />
            </div>
            <div className="hidden min-[480px]:block text-left">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xs sm:text-base tracking-tight text-slate-800 group-hover:text-sky-600 transition-colors">
                  GAMING GEEKS CLUB
                </h1>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block"></div>
                <span className="bg-sky-50 text-sky-600 border border-sky-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
                  Admin Core
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono tracking-wider mt-0.5 truncate max-w-[200px] sm:max-w-none">
                UEM Jaipur Esports Console
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Global Search / Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-1 sm:mx-4 min-w-0">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-between text-xs group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
              <span className="truncate text-xs font-medium hidden sm:inline">Search commands, tournaments, rosters...</span>
              <span className="truncate text-xs font-medium sm:hidden">Quick Search...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 shadow-xs shrink-0">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* New Room / Launch Match Quick Action */}
          <Link
            to="/admin/matches"
            className="hidden sm:flex admin-gradient-accent hover:opacity-95 text-white font-bold rounded-xl px-4 py-2 admin-shadow-glow-accent transition-all hover:scale-105 items-center gap-2 border border-sky-300/30 text-xs shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="tracking-wide">New Room</span>
          </Link>

          {/* Admin Avatar & Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-sm border border-indigo-400/50 cursor-pointer hover:ring-2 ring-indigo-200 transition-all"
              aria-label="User Profile"
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 sm:w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in duration-150 space-y-3 font-sans">
                <div className="pb-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Super Admin'}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">@{user?.username || 'admin'}</p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Console</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BODY WITH FULL RESPONSIVE SIDEBAR & CONTENT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Mobile Backdrop overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-150"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 sm:top-20 inset-y-0 left-0 z-50 md:z-30 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]
            w-72 max-w-[85vw] md:w-64 admin-glass-panel border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0 shadow-sm
            transition-transform duration-300 ease-in-out select-none admin-scrollbar
            ${sidebarOpen ? 'translate-x-0 shadow-2xl bg-white' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Top Section: Nav Groups */}
          <div className="space-y-6 overflow-y-auto pr-1 admin-scrollbar">
            {/* Mobile Drawer Header with Close */}
            <div className="md:hidden flex items-center justify-between pb-3 mb-1 border-b border-slate-200 px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-950 border border-lime-400/40 p-0.5 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                  <img
                    src="/assets/gaming-geeks-logo.png"
                    alt="Gaming Geeks"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-xs text-slate-800">ADMIN CORE</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                {/* Section Header */}
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-3">
                  {sec.title === 'COMMAND CENTER' ? 'System Console' : sec.title === 'GAMES' ? 'Active Titles' : sec.title}
                </h3>

                {/* Items */}
                <nav className="space-y-1 pt-0.5">
                  {sec.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                          isActive
                            ? 'bg-gradient-to-r from-sky-50 to-transparent text-sky-600 border-l-2 border-[#38BDF8] rounded-r-xl'
                            : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800 border-l-2 border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3 truncate">
                            <item.icon
                              className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                                isActive ? 'text-sky-500' : item.color || 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.tag && (
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                                item.name === 'BGMI'
                                  ? 'text-sky-600 bg-sky-50 border border-sky-100'
                                  : item.name === 'Free Fire'
                                  ? 'text-orange-600 bg-orange-50 border border-orange-100'
                                  : 'text-rose-600 bg-rose-50 border border-rose-100'
                              }`}
                            >
                              {item.name === 'BGMI' ? 'Battle Royale' : item.name === 'Free Fire' ? 'Survival' : 'Tactical'}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Bottom Sidebar: Admin Profile */}
          <div className="pt-3 border-t border-slate-200/80 mt-2">
            <div className="flex items-center justify-between bg-white rounded-xl p-2.5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="truncate text-left leading-tight">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {user?.name || 'Super Admin'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Admin
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN ADMIN CONTENT AREA */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto admin-scrollbar pb-20 md:pb-8">
          <div className="p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (Native App Feel on Mobile) */}
      {/* ========================================================================= */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 py-1 px-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Overview</span>
        </NavLink>

        <NavLink
          to="/admin/tournaments"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Trophy className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Tourneys</span>
        </NavLink>

        <NavLink
          to="/admin/matches"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Swords className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Matches</span>
        </NavLink>

        <NavLink
          to="/admin/teams"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Shield className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Teams</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Users</span>
        </NavLink>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">More</span>
        </button>
      </nav>


      {/* Global Command Palette Modal */}
      <AdminCommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AdminLayout;
