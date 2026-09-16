import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { Image as ImageIcon, Sparkles } from 'lucide-react';

const Gallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchGallery();
  }, [selectedCategory]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' ? '/gallery' : `/gallery?category=${encodeURIComponent(selectedCategory)}`;
      const res = await API.get(url);
      setGallery(res.data.gallery || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Tournaments', 'LAN Parties', 'Ceremonies', 'Setups', 'Community'];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <ImageIcon className="w-4 h-4" />
            <span>Campus Memories</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
            MEDIA & EVENT GALLERY
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Moments captured from collegiate championships, late night LAN parties, and trophy celebrations.
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

      {/* Gallery Grid */}
      {loading ? (
        <Loading message="Loading gallery highlights..." />
      ) : gallery.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No photos in this category"
          description="Check out other media categories above."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map((item) => (
            <div
              key={item._id}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
            >
              <div className="h-64 w-full overflow-hidden bg-slate-950">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                />
              </div>

              {/* Overlay info */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.event}</span>
                </div>
                <h3 className="text-sm font-bold text-white font-mono">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
