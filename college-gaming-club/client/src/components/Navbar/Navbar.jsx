import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GooeyNav from '../GooeyNav/GooeyNav';
import {
  Menu,
  X,
  Gamepad2,
  Trophy,
  Sparkles,
  Shield,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Flame,
  ArrowRight,
  Bell,
  Check,
  User,
  LogIn,
  Key,
  CheckCheck,
  Clock,
} from 'lucide-react';
import API from '../../services/api';

const Navbar = () => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Tournament Invitations & Notifications
  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('updates'); // 'updates' | 'invites'
  const [respondingId, setRespondingId] = useState(null);
  
  const profileMenuRef = useRef(null);
  const invitationsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'Points Table', href: '/points-table' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
  ];

  const profilePath = user?.role === 'admin' ? '/admin' : '/profile';

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch invitations for authenticated user
  const fetchInvitations = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await API.get('/registrations/invitations/my');
      if (res.data.success) {
        setInvitations(res.data.invitations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch match notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await API.get('/notifications/my');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvitations();
      fetchNotifications();
      const interval = setInterval(() => {
        fetchInvitations();
        fetchNotifications();
      }, 20000);
      return () => clearInterval(interval);
    } else {
      setInvitations([]);
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated]);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        API.patch(`/notifications/${notif._id}/read`).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      }
      setInvitationsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      setRespondingId(inviteId);
      const res = await API.post(`/registrations/invitations/${inviteId}/accept`);
      if (res.data.success) {
        setInvitationsOpen(false);
        fetchInvitations();
        navigate(`/tournaments/${res.data.tournamentSlug || res.data.tournamentId}/register`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      setRespondingId(inviteId);
      const res = await API.post(`/registrations/invitations/${inviteId}/decline`);
      if (res.data.success) {
        fetchInvitations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setRespondingId(null);
    }
  };

  // Close profile dropdown and invitations when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (invitationsRef.current && !invitationsRef.current.contains(event.target)) {
        setInvitationsOpen(false);
      }
    };
    if (profileDropdownOpen || invitationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen, invitationsOpen]);

  // Lock body scroll on mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Auto-close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1100) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Full-Width Sideways Transparent Header (Reference Esports Style) */}
      <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 px-4 sm:px-8 lg:px-12 pointer-events-none transition-all duration-300">
        <div className="w-full flex flex-col items-center">
          {/* Main Navbar Container - Fully Transparent */}
          <nav
            aria-label="Main Navigation"
            className="pointer-events-auto w-full transition-all duration-300 relative bg-transparent border-none shadow-none"
          >
            <div className="h-14 sm:h-16 flex items-center justify-between gap-4 w-full">
              {/* Brand Logo - Official College & Gaming Geeks Badges (Far Left) */}
              <Link
                to="/"
                className="flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {/* UEM College Crest Badge */}
                  <div className="h-9 sm:h-10 px-2 py-0.5 rounded-xl bg-white/95 border border-white/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all">
                    <img
                      src="/assets/uem-logo.png"
                      alt="UEM Jaipur Crest"
                      className="h-full w-auto object-contain"
                    />
                  </div>

                  {/* Gaming Geeks Club Crest */}
                  <div className="h-9 sm:h-10 w-9 sm:w-10 rounded-xl bg-black/85 border border-lime-400/40 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.25)] group-hover:shadow-[0_0_20px_rgba(163,230,53,0.5)] group-hover:scale-105 transition-all">
                    <img
                      src="/assets/gaming-geeks-logo.png"
                      alt="Gaming Geeks Club"
                      className="h-full w-auto object-contain drop-shadow-[0_0_6px_rgba(163,230,53,0.7)]"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="font-black text-sm sm:text-base tracking-wider text-white uppercase group-hover:text-cyan-200 transition-colors">
                      UEMJ
                    </span>
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase hidden min-[480px]:inline">
                      GAMING CLUB
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-slate-400 uppercase hidden sm:block">
                    GAMING GEEKS • UEM JAIPUR
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links (Centered Signature GooeyNav) */}
              <div className="hidden min-[1100px]:flex items-center">
                <GooeyNav
                  items={navLinks}
                  animationTime={500}
                  particleCount={12}
                  particleDistances={[70, 8]}
                  particleR={70}
                  timeVariance={250}
                  colors={[1, 2, 3, 4]}
                />
              </div>

              {/* Right Side Action / CTA Pill Button (Far Right) */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    {/* Notifications & Tournament Invitations Bell */}
                    <div className="relative" ref={invitationsRef}>
                      {(() => {
                        const totalAlerts = (unreadNotifCount || 0) + (invitations?.length || 0);
                        return (
                          <button
                            onClick={() => {
                              const nextOpen = !invitationsOpen;
                              setInvitationsOpen(nextOpen);
                              if (nextOpen) {
                                if (unreadNotifCount > 0) setActiveNotifTab('updates');
                                else if (invitations.length > 0) setActiveNotifTab('invites');
                              }
                            }}
                            className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Match Updates & Invitations"
                          >
                            <Bell className="w-4 h-4 text-cyan-400" />
                            {totalAlerts > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center animate-pulse">
                                {totalAlerts}
                              </span>
                            )}
                          </button>
                        );
                      })()}

                      {/* Notifications Dropdown */}
                      {invitationsOpen && (
                        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-[#090e1f]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.1)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                          {/* Tabs Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
                            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-white/10">
                              <button
                                type="button"
                                onClick={() => setActiveNotifTab('updates')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  activeNotifTab === 'updates'
                                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <Bell className="w-3 h-3" />
                                <span>Updates</span>
                                {unreadNotifCount > 0 && (
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                    activeNotifTab === 'updates' ? 'bg-slate-950 text-cyan-300' : 'bg-rose-500 text-white'
                                  }`}>
                                    {unreadNotifCount}
                                  </span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveNotifTab('invites')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  activeNotifTab === 'invites'
                                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>Invites</span>
                                {invitations.length > 0 && (
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                    activeNotifTab === 'invites' ? 'bg-slate-950 text-cyan-300' : 'bg-rose-500 text-white'
                                  }`}>
                                    {invitations.length}
                                  </span>
                                )}
                              </button>
                            </div>

                            {activeNotifTab === 'updates' && unreadNotifCount > 0 && (
                              <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                                title="Mark all as read"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Mark read</span>
                              </button>
                            )}
                          </div>

                          {/* Tab 1: Match & Tournament Updates */}
                          {activeNotifTab === 'updates' && (
                            <>
                              {notifications.length === 0 ? (
                                <div className="py-6 text-center space-y-1.5">
                                  <Gamepad2 className="w-7 h-7 text-slate-600 mx-auto" />
                                  <p className="text-xs font-semibold text-slate-300">No match updates yet</p>
                                  <p className="text-[10px] text-slate-500">
                                    Room ID, passwords and match updates will appear here.
                                  </p>
                                </div>
                              ) : (
                                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                  {notifications.map((notif) => {
                                    const isMatchCreds = notif.type === 'match_credentials';
                                    const isLive = notif.type === 'match_live';
                                    const isResults = notif.type === 'match_results' || notif.type === 'tournament_results';

                                    return (
                                      <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                                          !notif.isRead
                                            ? 'bg-cyan-950/30 hover:bg-cyan-950/50 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                            : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          <div
                                            className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                                              isMatchCreds
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : isLive
                                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                : isResults
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                            }`}
                                          >
                                            {isMatchCreds ? (
                                              <Key className="w-3.5 h-3.5" />
                                            ) : isLive ? (
                                              <Flame className="w-3.5 h-3.5 animate-pulse" />
                                            ) : isResults ? (
                                              <Trophy className="w-3.5 h-3.5" />
                                            ) : (
                                              <Gamepad2 className="w-3.5 h-3.5" />
                                            )}
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                              <span
                                                className={`text-xs font-bold truncate ${
                                                  !notif.isRead ? 'text-white' : 'text-slate-300'
                                                }`}
                                              >
                                                {notif.title}
                                              </span>
                                              <span className="text-[9px] font-mono text-slate-500 shrink-0">
                                                {formatTimeAgo(notif.createdAt)}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                              {notif.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                                              <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                <span>View match & credentials</span>
                                                <ArrowRight className="w-2.5 h-2.5" />
                                              </span>
                                              {!notif.isRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}

                          {/* Tab 2: Tournament Invitations */}
                          {activeNotifTab === 'invites' && (
                            <>
                              {invitations.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-5">
                                  No active tournament invitations.
                                </p>
                              ) : (
                                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                                  {invitations.map((inv) => (
                                    <div
                                      key={inv._id}
                                      className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={inv.sender?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80'}
                                          alt={inv.sender?.name}
                                          className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-white truncate">
                                            Team {inv.registration?.teamName || 'Squad'}
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate">
                                            Invited by @{inv.sender?.username} for {inv.tournament?.name}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button
                                          disabled={respondingId === inv._id}
                                          onClick={() => handleAcceptInvite(inv._id)}
                                          className="py-1.5 px-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                                        >
                                          <Check className="w-3 h-3" />
                                          {respondingId === inv._id ? 'Joining...' : 'Accept'}
                                        </button>
                                        <button
                                          disabled={respondingId === inv._id}
                                          onClick={() => handleDeclineInvite(inv._id)}
                                          className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-semibold text-[11px] uppercase transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User Profile Pill */}
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2 p-1 pr-2.5 sm:pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all cursor-pointer select-none group"
                        aria-expanded={profileDropdownOpen}
                      >
                        <img
                          src={
                            user.avatar ||
                            'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={user.name || 'User avatar'}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-cyan-400/60 group-hover:border-cyan-300"
                        />
                        <span className="hidden sm:inline-block text-xs font-bold text-slate-200 max-w-[90px] truncate">
                          {user.username || user.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                          {user.role}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            profileDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                          }`}
                        />
                      </button>

                      {/* Transparent Glass Profile Dropdown */}
                      {profileDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-64 rounded-3xl bg-[#090e1f]/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.1)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3.5 py-2.5 border-b border-white/10">
                            <p className="text-[11px] text-slate-400">Signed in as</p>
                            <p className="text-xs font-bold text-white truncate">{user.email}</p>
                          </div>

                          <div className="py-1.5 space-y-1">
                            {user.role === 'admin' || user.role === 'staff' ? (
                              <Link
                                to="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-fuchsia-300 bg-fuchsia-950/40 hover:bg-fuchsia-900/50 border border-fuchsia-500/30 rounded-xl transition-colors"
                              >
                                <Shield className="w-4 h-4 text-fuchsia-400 shrink-0" /> Admin Panel
                              </Link>
                            ) : (
                              <Link
                                to="/profile"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/50 rounded-xl transition-colors"
                              >
                                <User className="w-4 h-4 text-cyan-400 shrink-0" /> Player Profile
                              </Link>
                            )}
                          </div>

                          <div className="pt-1 border-t border-white/10">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors text-left cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 shrink-0" /> Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                      to="/login"
                      className="rounded-full px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-mono font-bold tracking-wider uppercase text-slate-100 bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.2)] hover:shadow-[0_0_24px_rgba(6,182,212,0.4)] active:scale-95 transition-all duration-300 flex items-center gap-2 select-none cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
                      <span>Login / Register</span>
                    </Link>
                  </div>
                )}

                {/* Mobile / Tablet Menu Toggle Pill Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="min-[1100px]:hidden p-2 rounded-full bg-white/6 hover:bg-white/12 text-slate-200 hover:text-white border border-white/12 transition-all active:scale-95 cursor-pointer ml-1"
                  aria-label="Toggle Navigation Menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Frosted Glass Menu Capsule */}
          {mobileMenuOpen && (
            <div className="pointer-events-auto min-[1100px]:hidden w-full mt-2.5 rounded-3xl bg-[#080d1a]/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.1)] p-4 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Navigation Grid */}
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center text-center transition-all ${
                        isActive
                          ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'text-slate-300 bg-white/5 border border-white/8 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* Mobile Auth & Profile Section */}
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            user.avatar ||
                            'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-cyan-400/70 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-cyan-400 font-mono truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0">
                        {user.role}
                      </span>
                    </div>

                    {user.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-fuchsia-300 bg-fuchsia-950/50 hover:bg-fuchsia-900/60 border border-fuchsia-500/40 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-fuchsia-400" /> Open Admin Panel
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/40 font-bold transition-colors"
                      >
                        <User className="w-4 h-4 text-cyan-400" /> Player Profile
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 transition-colors w-full cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-200 to-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.35)]"
                    >
                      LET'S GO
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 min-[1100px]:hidden transition-opacity"
        />
      )}
    </>
  );
};

export default Navbar;
