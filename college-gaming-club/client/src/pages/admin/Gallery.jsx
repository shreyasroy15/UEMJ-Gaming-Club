import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

const AdminGallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    description: '',
    category: 'Tournaments',
    event: 'College Esports 2025',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await API.get('/gallery');
      setGallery(res.data.gallery || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load gallery items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      image: '',
      description: '',
      category: 'Tournaments',
      event: 'College Esports 2025',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await API.post('/gallery', formData);
      addToast('Media uploaded to gallery!', 'success');
      setModalOpen(false);
      fetchGallery();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload media', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this photo from the media gallery?')) return;

    try {
      await API.delete(`/gallery/${itemId}`);
      addToast('Media item deleted', 'success');
      fetchGallery();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">
            MEDIA & GALLERY ASSETS
          </h1>
          <p className="text-xs text-slate-400">
            Showcase collegiate LAN moments, victory podiums, and battle station photography.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-bold text-white shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>

      {loading ? (
        <Loading message="Loading gallery assets..." />
      ) : gallery.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Gallery is empty" description="Add photos from campus events." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gallery.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden space-y-2 flex flex-col justify-between"
            >
              <div className="h-44 w-full bg-slate-950 overflow-hidden relative">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(item._id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800 hover:bg-rose-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {item.category}
                </span>
                <h4 className="text-xs font-bold text-white font-mono truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-500">{item.event}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Gallery Photo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. LAN Arena Main Stage Crowd"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Image URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              >
                <option value="Tournaments">Tournaments</option>
                <option value="LAN Parties">LAN Parties</option>
                <option value="Ceremonies">Ceremonies</option>
                <option value="Setups">Setups</option>
                <option value="Community">Community</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Event Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Finals 2025"
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add to Gallery'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminGallery;
