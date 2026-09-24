import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  Search,
  LayoutDashboard,
  Trophy,
  Swords,
  Shield,
  Megaphone,
  Image,
  Users,
  Gamepad2,
  Plus,
  UserPlus,
  ArrowRight,
  Sparkles,
  Command,
  X,
} from 'lucide-react';

const AdminCommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    tournaments: [],
    announcements: [],
    users: [],
  });
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSearchResults({ tournaments: [], announcements: [], users: [] });
    }
  }, [isOpen]);

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search for tournaments, announcements, users
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults({ tournaments: [], announcements: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const [tRes, aRes, uRes] = await Promise.allSettled([
          API.get('/tournaments'),
          API.get('/announcements'),
          API.get('/users?limit=20'),
        ]);

        const q = query.toLowerCase();

        const tournaments =
          tRes.status === 'fulfilled'
            ? (tRes.value.data.tournaments || [])
                .filter(
                  (t) =>
                    t.name?.toLowerCase().includes(q) ||
                    t.game?.toLowerCase().includes(q)
                )
                .slice(0, 4)
            : [];

        const announcements =
          aRes.status === 'fulfilled'
            ? (aRes.value.data.announcements || [])
                .filter(
                  (a) =>
                    a.title?.toLowerCase().includes(q) ||
                    a.content?.toLowerCase().includes(q)
                )
                .slice(0, 4)
            : [];

        const users =
          uRes.status === 'fulfilled'
            ? (uRes.value.data.users || [])
                .filter(
                  (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.username?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
                )
                .slice(0, 4)
            : [];

        setSearchResults({ tournaments, announcements, users });
      } catch (err) {
        console.error('Command search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const quickNav = [
    { name: 'Mission Dashboard', path: '/admin', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Tournaments Console', path: '/admin/tournaments', icon: Trophy, category: 'Navigation' },
    { name: 'Matches & Scoring', path: '/admin/matches', icon: Swords, category: 'Navigation' },
    { name: 'Points Table / Standings', path: '/admin/points-table', icon: Trophy, category: 'Navigation' },
    { name: 'Teams & Rosters', path: '/admin/teams', icon: Shield, category: 'Navigation' },
    { name: 'Users & Roles', path: '/admin/users', icon: Users, category: 'Navigation' },
    { name: 'Create Admin Account', path: '/admin/users?role=admin&create=true', icon: UserPlus, category: 'Actions' },
    { name: 'Announcements Broadcast', path: '/admin/announcements', icon: Megaphone, category: 'Navigation' },
    { name: 'Media Gallery', path: '/admin/gallery', icon: Image, category: 'Navigation' },
    { name: 'BGMI Command Hub', path: '/admin/games/bgmi', icon: Gamepad2, image: 'https://wallpapercave.com/wp/wp9837300.jpg', fallbackImage: '/assets/bgmi-logo.jpg', category: 'Games' },
    { name: 'Free Fire Command Hub', path: '/admin/games/free-fire', icon: Gamepad2, image: 'https://wallpapers.com/images/hd/free-fire-logo-in-black-neggg4nr4exfv0yh.jpg', fallbackImage: '/assets/free-fire-logo.jpg', category: 'Games' },
    { name: 'Valorant Command Hub', path: '/admin/games/valorant', icon: Gamepad2, image: 'https://i.pinimg.com/originals/6f/20/7c/6f207c513f95b2a14e164c9c0b772874.jpg', fallbackImage: '/assets/valorant-logo.jpg', category: 'Games' },
  ];

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults =
    query.trim().length >= 2 &&
    (searchResults.tournaments.length > 0 ||
      searchResults.announcements.length > 0 ||
      searchResults.users.length > 0);

  const filteredActions = quickNav.filter((nav) =>
    nav.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-sky-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tournament, team, or player..."
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 admin-scrollbar text-xs">
          {/* Dynamic Search Results */}
          {hasResults && (
            <div className="space-y-3">
              {searching && (
                <p className="text-slate-400 px-3 py-1 animate-pulse">
                  Querying esports operations database...
                </p>
              )}
              {/* Tournaments Results */}
              {searchResults.tournaments.length > 0 && (
                <div>
                  <span className="px-3 text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                    Tournaments & Brackets
                  </span>
                  <div className="mt-1 space-y-1">
                    {searchResults.tournaments.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => handleSelect(`/admin/matches?tournament=${t._id}`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50/80 border border-transparent hover:border-sky-100 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-slate-800 font-semibold group-hover:text-sky-600 truncate">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{t.game}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements Results */}
              {searchResults.announcements.length > 0 && (
                <div>
                  <span className="px-3 text-[10px] uppercase font-bold text-fuchsia-600 tracking-wider">
                    Bulletins & Announcements
                  </span>
                  <div className="mt-1 space-y-1">
                    {searchResults.announcements.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => handleSelect(`/admin/announcements`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-fuchsia-50/80 border border-transparent hover:border-fuchsia-100 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Megaphone className="w-4 h-4 text-fuchsia-500 shrink-0" />
                          <span className="text-slate-800 font-semibold group-hover:text-fuchsia-600 truncate">
                            {a.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-fuchsia-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Results */}
              {searchResults.users.length > 0 && (
                <div>
                  <span className="px-3 text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                    Registered Users & Staff
                  </span>
                  <div className="mt-1 space-y-1">
                    {searchResults.users.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => handleSelect(`/admin/users`)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/80 border border-transparent hover:border-indigo-100 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-slate-800 font-semibold group-hover:text-indigo-600 truncate">
                            {u.name} (@{u.username})
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{u.role}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {query.trim().length >= 2 && !searching && !hasResults && (
            <p className="text-center py-6 text-slate-400">
              No records found matching "{query}".
            </p>
          )}

          {/* Quick Actions Navigation */}
          <div>
            <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {query ? 'Filter Navigation' : 'Fast Navigation'}
            </span>
            <div className="mt-1 space-y-1">
              {filteredActions.map((act) => (
                <button
                  key={act.path}
                  onClick={() => handleSelect(act.path)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {act.image ? (
                      <div className="w-4 h-4 rounded overflow-hidden shrink-0 bg-black border border-slate-200 flex items-center justify-center">
                        <img
                          src={act.image}
                          alt={act.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            if (act.fallbackImage) {
                              e.target.src = act.fallbackImage;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <act.icon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                    )}
                    <span className="text-slate-700 group-hover:text-slate-900 font-medium">
                      {act.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-mono">
                    {act.shortcut || act.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminCommandPalette;
