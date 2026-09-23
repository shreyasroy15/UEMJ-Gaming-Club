import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { Megaphone, Pin, Calendar, User, Search, X } from 'lucide-react';

const News = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCategory]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const url =
        selectedCategory === 'all'
          ? '/announcements'
          : `/announcements?category=${encodeURIComponent(selectedCategory)}`;
      const res = await API.get(url);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Tournament', 'General', 'Community', 'Update', 'Important'];

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Megaphone className="w-4 h-4" />
            <span>Club Communications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-mono mt-1">
            ANNOUNCEMENTS & NEWS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Stay updated with tournament rule modifications, scrim schedule releases, and executive announcements.
          </p>
        </div>

        {/* Controls: Search + Categories */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search news..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <Loading message="Loading announcements..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No news found"
          description={
            search
              ? `No announcements matching "${search}". Try a different keyword.`
              : 'There are currently no announcements in this category.'
          }
        />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {filtered.map((item) => {
            const hasImage = item.image && item.image.trim().length > 0;

            return (
              <div
                key={item._id}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col ${hasImage ? 'md:flex-row' : ''} ${
                  item.pinned
                    ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border-cyan-500/40 shadow-lg shadow-cyan-900/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {hasImage && (
                  <div className="w-full md:w-72 lg:w-80 h-44 sm:h-52 md:h-auto shrink-0 relative overflow-hidden bg-slate-950">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Hide entire image container on error
                        const container = e.target.closest('.shrink-0');
                        if (container) container.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/70 via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-4 sm:p-6 flex-1 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {item.pinned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                        {item.category}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {new Date(item.publishedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white font-mono break-words">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-1 break-words">
                      {item.content}
                    </p>
                  </div>

                  {item.author && (
                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        Posted by <strong className="text-slate-200">{item.author.name || item.author.username}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default News;
