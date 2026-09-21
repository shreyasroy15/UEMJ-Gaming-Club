import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Pin,
  Search,
  X,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    image: '',
    pinned: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingUrl, setUploadingUrl] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await API.get('/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Upload local file to Cloudinary
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image file size exceeds 10MB limit', 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'uemj/announcements');

      const res = await API.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        addToast('✓ Image uploaded to Cloudinary successfully', 'success');
      } else {
        throw new Error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Cloudinary file upload error:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload remote URL to Cloudinary
  const handleUploadUrlToCloudinary = async () => {
    const url = formData.image?.trim();
    if (!url) {
      addToast('Please enter an image URL first', 'error');
      return;
    }

    if (url.includes('cloudinary.com')) {
      addToast('This image is already hosted on Cloudinary', 'info');
      return;
    }

    try {
      setUploadingUrl(true);
      const res = await API.post('/upload/url', {
        url,
        folder: 'uemj/announcements',
      });

      if (res.data.success && res.data.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        addToast('✓ Image URL uploaded to Cloudinary successfully', 'success');
      } else {
        throw new Error(res.data.message || 'URL upload failed');
      }
    } catch (err) {
      console.error('Cloudinary URL upload error:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to upload URL to Cloudinary', 'error');
    } finally {
      setUploadingUrl(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAnn(null);
    setFormData({
      title: '',
      content: '',
      category: 'General',
      image: '',
      pinned: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ann) => {
    setEditingAnn(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      category: ann.category || 'General',
      image: ann.image || '',
      pinned: !!ann.pinned,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingAnn) {
        await API.put(`/announcements/${editingAnn._id}`, formData);
        addToast('Announcement updated', 'success');
      } else {
        await API.post('/announcements', formData);
        addToast('Announcement published', 'success');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (annId, annTitle) => {
    if (!window.confirm(`Delete announcement "${annTitle}"?`)) return;

    try {
      await API.delete(`/announcements/${annId}`);
      addToast('Announcement deleted', 'success');
      fetchAnnouncements();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            CLUB ANNOUNCEMENTS
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Publish official notices, pin critical updates, and broadcast tournament alerts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {announcements.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 sm:py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-xs font-bold text-white shadow-md shadow-fuchsia-600/20 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      {loading ? (
        <Loading message="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements found" description="Create an announcement to broadcast." />
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <p className="text-xs text-slate-600 font-mono">
            No announcements found matching "{search}".
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-700 border border-slate-200 text-xs font-mono font-bold"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann._id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {ann.image && (
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                    <img
                      src={ann.image}
                      alt={ann.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {ann.pinned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] uppercase font-bold bg-slate-100 text-cyan-700 border border-slate-200 font-mono">
                      {ann.category}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono truncate">{ann.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  onClick={() => handleOpenEdit(ann)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  title="Edit Announcement"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(ann._id, ann.title)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnn ? 'Edit Announcement' : 'Publish Announcement'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
              >
                <option value="General">General</option>
                <option value="Tournament">Tournament</option>
                <option value="Community">Community</option>
                <option value="Update">Update</option>
                <option value="Important">Important</option>
              </select>
            </div>

            <div className="flex items-center sm:pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="rounded bg-slate-100 border-slate-300 text-cyan-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                Pin to top of bulletins
              </label>
            </div>
          </div>

          {/* Announcement Image / Banner with Cloudinary Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Announcement Banner / Image
              </label>
              {formData.image && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                  {formData.image.includes('cloudinary.com') ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cloudinary Hosted
                    </>
                  ) : (
                    'Direct Image URL'
                  )}
                </span>
              )}
            </div>

            {/* Hidden native file input for Cloudinary upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Upload Options Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* File Upload Button */}
              <button
                type="button"
                disabled={uploadingImage || uploadingUrl}
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/50 text-slate-600 hover:text-slate-900 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
                    <span className="text-xs font-mono font-bold text-cyan-700">
                      Uploading to Cloudinary...
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-cyan-600" />
                    <span className="text-xs font-bold font-mono">Upload Image File</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, WEBP to Cloudinary</span>
                  </>
                )}
              </button>

              {/* Paste URL with Cloudinary Upload */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-fuchsia-500 shrink-0" />
                  <span className="truncate">Or Image URL to Cloudinary</span>
                </span>
                <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-1.5">
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 min-w-0 px-2.5 py-2 min-[480px]:py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={!formData.image || uploadingUrl || uploadingImage}
                    onClick={handleUploadUrlToCloudinary}
                    title="Upload remote URL to Cloudinary"
                    className="px-3 py-2 min-[480px]:py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-mono text-[11px] min-[480px]:text-[10px] font-bold shrink-0 disabled:opacity-40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {uploadingUrl ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>To Cloudinary</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Image Preview */}
            {formData.image && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img
                  src={formData.image}
                  alt="Announcement Preview"
                  className="w-full h-32 sm:h-44 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end justify-between p-3 gap-2">
                  <span className="text-[10px] font-mono text-slate-100 truncate max-w-[180px] sm:max-w-xs">
                    {formData.image}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={formData.image}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg bg-white/90 text-slate-800 hover:text-black border border-slate-200"
                      title="Open full image"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="p-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300 cursor-pointer transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Content *
            </label>
            <textarea
              rows="4"
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Save Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAnnouncements;
