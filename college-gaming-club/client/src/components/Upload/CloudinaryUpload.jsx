import React, { useState, useRef } from 'react';
import API from '../../services/api';
import { Upload, CheckCircle2, AlertCircle, Loader2, X, FileText } from 'lucide-react';

const CloudinaryUpload = ({
  value = '',
  onChange,
  type = 'public', // 'public' | 'private'
  accept = 'image/*',
  label = 'Upload File',
  helpText = 'PNG, JPG or PDF up to 10MB',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Check size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum allowed 10MB limit');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.url) {
        onChange(res.data.url);
      } else {
        setError(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isImage = value && (
    value.startsWith('data:image') ||
    value.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) ||
    value.includes('cloudinary.com')
  );

  const isPdf = value && (value.includes('.pdf') || value.startsWith('data:application/pdf'));

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold text-slate-300 uppercase font-mono">{label}</label>}

      {value ? (
        <div className="relative p-3 rounded-xl border border-slate-700 bg-slate-900/80 flex items-center justify-between gap-3 group">
          <div className="flex items-center gap-3 min-w-0">
            {isImage ? (
              <img
                src={value}
                alt="Uploaded preview"
                className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            ) : isPdf ? (
              <div className="w-14 h-14 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Uploaded Successfully</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                {value.length > 50 ? `${value.substring(0, 47)}...` : value}
              </p>
              {type === 'private' && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800/50">
                  🔒 Private Verification Document
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200"
            >
              View
            </a>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-300 font-mono">Uploading to secure storage...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-1">
              <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-200">
                <span className="text-cyan-400 underline">Click to upload</span> or drag and drop
              </div>
              <p className="text-[10px] text-slate-400">{helpText}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
