import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { Megaphone, Pin, Calendar, User, Search } from 'lucide-react';

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
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Megaphone className="w-4 h-4" />
            <span>Club Communications</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
            ANNOUNCEMENTS & NEWS
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Stay updated with tournament rule modifications, scrim schedule releases, and executive announcements.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
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

      {/* Announcements List */}
      {loading ? (
        <Loading message="Loading announcements..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No news found"
          description="There are currently no announcements in this category."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className={`p-6 rounded-2xl border transition-all ${
                item.pinned
                  ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border-cyan-500/40 shadow-lg shadow-cyan-900/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.publishedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-mono">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                    {item.content}
                  </p>

                  {item.author && (
                    <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Posted by <strong>{item.author.name || item.author.username}</strong></span>
                    </div>
                  )}
                </div>

                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border border-slate-800 shrink-0 hidden sm:block"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;
