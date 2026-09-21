import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  'Tournaments',
  'LAN Parties',
  'Ceremonies',
  'Setups',
  'Community',
  'Free Fire',
  'BGMI'
];

const AdminGallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  
  // File upload state
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Image URL state
  const [imageUrl, setImageUrl] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState(null); // null | true | false

  // Form metadata
  const [formData, setFormData] = useState({
    title: '',
    category: 'Tournaments',
    event: 'College Esports 2025',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  // Manage object URLs for file previews to avoid memory leaks
  useEffect(() => {
    if (files.length === 0) {
      setFilePreviews([]);
      return;
    }
    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2)
    }));
    setFilePreviews(newPreviews);

    return () => {
      newPreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [files]);

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
    setFiles([]);
    setFilePreviews([]);
    setImageUrl('');
    setUrlPreviewValid(null);
    setFormData({
      title: '',
      category: 'Tournaments',
      event: 'College Esports 2025',
      description: ''
    });
    setMode('upload');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'upload') {
      if (files.length === 0) {
        return addToast('Please select at least one photo to upload', 'error');
      }

      const data = new FormData();
      files.forEach(file => data.append('files', file));
      data.append('category', formData.category);
      data.append('event', formData.event);
      data.append('captions', JSON.stringify(files.map(() => formData.title || filePreviews[0]?.name || 'Gallery Photo')));

      try {
        setSubmitting(true);
        const res = await API.post('/gallery/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        addToast(
          res.data.count > 1 
            ? `${res.data.count} photos uploaded successfully!` 
            : 'Photo uploaded to gallery!', 
          'success'
        );
        setModalOpen(false);
        fetchGallery();
      } catch (err) {
        console.error(err);
        addToast(err.response?.data?.message || 'Failed to upload photo(s)', 'error');
      } finally {
        setSubmitting(false);
      }
    } else {
      // URL mode
      if (!imageUrl.trim()) {
        return addToast('Please enter an image URL', 'error');
      }

      try {
        setSubmitting(true);
        await API.post('/gallery', {
          image: imageUrl.trim(),
          title: formData.title.trim() || 'Gallery Image',
          category: formData.category,
          event: formData.event || 'College Esports 2025',
          description: formData.description.trim()
        });
        addToast('Photo added from image URL!', 'success');
        setModalOpen(false);
        fetchGallery();
      } catch (err) {
        console.error(err);
        addToast(err.response?.data?.message || 'Failed to save photo from URL', 'error');
      } finally {
        setSubmitting(false);
      }
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

  const handleCopyLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast('Image link copied to clipboard!', 'success');
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-mono tracking-wide">
            MEDIA & GALLERY ASSETS
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Showcase collegiate moments, victory podiums, and battle station photography.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <Loading message="Loading gallery assets..." />
      ) : gallery.length === 0 ? (
        <EmptyState 
          icon={ImageIcon} 
          title="Gallery is empty" 
          description="Add photos from campus events using file upload or direct image URLs." 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gallery.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 overflow-hidden flex flex-col justify-between transition-all duration-300 group shadow-sm"
            >
              {/* Image Preview Box */}
              <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400/f1f5f9/64748b?text=Image+Unavailable';
                  }}
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(item)}
                    title="View Full Size"
                    className="p-1.5 rounded-lg bg-white/90 text-slate-700 border border-slate-200 hover:bg-white transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item.image, item._id)}
                    title="Copy Image URL"
                    className="p-1.5 rounded-lg bg-white/90 text-cyan-700 border border-cyan-200 hover:bg-cyan-50 transition-colors shadow-xs"
                  >
                    {copiedId === item._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    title="Delete photo"
                    className="p-1.5 rounded-lg bg-white/90 text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Direct link badge */}
                <div className="absolute bottom-2 left-2 max-w-[85%]">
                  <a
                    href={item.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 text-[10px] text-slate-700 border border-slate-200 hover:text-cyan-700 truncate max-w-full backdrop-blur-sm shadow-xs"
                  >
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{item.image}</span>
                  </a>
                </div>
              </div>

              {/* Meta information */}
              <div className="p-3.5 space-y-1.5 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 truncate">{item.event}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 font-mono truncate" title={item.title}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload / Add Photo Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Gallery Photos">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Option Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Choose Method
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'url'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>
          </div>

          {/* Mode 1: File Upload */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Photos *
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-4 text-center bg-slate-50 hover:bg-cyan-50/30 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <Upload className="w-6 h-6 text-cyan-600" />
                    <p className="text-xs font-semibold text-slate-800">
                      Click or drag photos here to upload
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Supports JPG, PNG, WEBP, GIF (Up to 10MB each)
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Files Preview List */}
              {filePreviews.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Selected Photos ({filePreviews.length}):</span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {filePreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-900 truncate font-medium">{preview.name}</p>
                            <p className="text-[10px] text-slate-500">{preview.size} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Direct Image URL */}
          {mode === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Image URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required={mode === 'url'}
                    placeholder="https://example.com/photos/championship-trophy.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setUrlPreviewValid(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Live URL Preview */}
              {imageUrl.trim() && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-500 uppercase">Live Image Preview:</span>
                    {urlPreviewValid === true && (
                      <span className="text-emerald-600 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" /> Image Loaded
                      </span>
                    )}
                    {urlPreviewValid === false && (
                      <span className="text-rose-600 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3 h-3" /> Failed to load image
                      </span>
                    )}
                  </div>

                  <div className="h-36 w-full rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                    <img
                      src={imageUrl.trim()}
                      alt="URL Preview"
                      className="w-full h-full object-contain"
                      onLoad={() => setUrlPreviewValid(true)}
                      onError={() => setUrlPreviewValid(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category & Event Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Event Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Finals 2025"
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Title / Caption */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Title / Caption {mode === 'upload' && '(Optional)'}
            </label>
            <input
              type="text"
              placeholder="e.g. Grand Trophy Presentation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (mode === 'upload' && files.length === 0) || (mode === 'url' && !imageUrl.trim())}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-bold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting
                ? mode === 'upload' ? 'Uploading Photos...' : 'Saving Photo...'
                : mode === 'upload' ? 'Upload Photos' : 'Save Photo URL'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Image Preview Lightbox */}
      {previewImage && (
        <Modal 
          isOpen={Boolean(previewImage)} 
          onClose={() => setPreviewImage(null)} 
          title={previewImage.title || 'Photo Details'}
        >
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <img
                src={previewImage.image}
                alt={previewImage.title}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-cyan-700 uppercase">{previewImage.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Event Tag:</span>
                <span className="font-mono text-slate-900 font-bold">{previewImage.event}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Image Link:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewImage.image}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-800 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(previewImage.image, previewImage._id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === previewImage._id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminGallery;
