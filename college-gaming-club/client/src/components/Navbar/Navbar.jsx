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
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'Points Table', href: '/points-table' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
  ];

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  // Scroll detection for enhanced glass dynamic opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

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
      {/* Floating Pill Capsule Header */}
      <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Main Pill Navbar Container */}
          <nav
            aria-label="Main Navigation"
            className={`pointer-events-auto w-full rounded-full transition-all duration-500 relative ${
              scrolled
                ? 'bg-[#080d1a]/70 border-white/20 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),0_0_30px_rgba(0,240,255,0.08)]'
                : 'bg-[#090e1f]/45 border-white/12 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.5),0_0_25px_rgba(0,240,255,0.05)]'
            } backdrop-blur-2xl backdrop-saturate-150 border hover:border-white/25 hover:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.75),0_0_35px_rgba(0,240,255,0.12)]`}
            style={{
              boxShadow: scrolled
                ? '0 16px 40px -8px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 0 25px rgba(0, 240, 255, 0.08)'
                : '0 12px 36px -6px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), 0 0 20px rgba(0, 240, 255, 0.05)',
            }}
          >
            {/* Ambient Top Specular Light Highlight */}
            <div className="absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-full" />
            <div className="absolute inset-x-24 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

            <div className="h-14 sm:h-16 px-3.5 sm:px-6 flex items-center justify-between gap-3">
              {/* Brand Logo */}
              <Link
                to="/"
                className="flex items-center gap-2.5 group shrink-0 select-none cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-cyan-500/30 via-indigo-500/20 to-fuchsia-500/30 border border-cyan-400/40 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:shadow-[0_0_22px_rgba(0,240,255,0.5)] group-hover:scale-105 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Gamepad2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300 group-hover:text-cyan-200 group-hover:rotate-6 transition-all duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="font-black text-sm sm:text-base tracking-wider text-white uppercase group-hover:text-cyan-200 transition-colors">
                    UEMJ
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase hidden min-[400px]:inline">
                    GAMING
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links (Signature GooeyNav) */}
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

              {/* Right Side Action / CTA Pill Button */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2" ref={profileMenuRef}>
                    {/* User Profile Pill */}
                    <div className="relative">
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
                            {user.role === 'admin' && (
                              <Link
                                to="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-fuchsia-300 bg-fuchsia-950/40 hover:bg-fuchsia-900/50 border border-fuchsia-500/30 rounded-xl transition-colors"
                              >
                                <Shield className="w-4 h-4 text-fuchsia-400 shrink-0" /> Admin Panel
                              </Link>
                            )}

                            <Link
                              to="/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/50 rounded-xl transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-cyan-400 shrink-0" /> Player Dashboard
                            </Link>
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
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {/* Login Link */}
                    <Link
                      to="/login"
                      className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-[13px] font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Log In
                    </Link>

                    {/* Prominent Reference-Style "LET'S GO" Pill Button */}
                    <Link
                      to="/register"
                      className="rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#fef08a] via-[#fde047] to-[#facc15] hover:from-white hover:to-[#fde047] shadow-[0_0_20px_rgba(253,224,71,0.4)] hover:shadow-[0_0_28px_rgba(253,224,71,0.6)] active:scale-95 transition-all duration-300 flex items-center gap-1 shrink-0 select-none cursor-pointer"
                    >
                      <span>LET'S GO</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3] hidden min-[480px]:inline-block" />
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

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-fuchsia-300 bg-fuchsia-950/50 hover:bg-fuchsia-900/60 border border-fuchsia-500/40 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-fuchsia-400" /> Open Admin Panel
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/40 font-bold transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Open Player Dashboard
                    </Link>

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
