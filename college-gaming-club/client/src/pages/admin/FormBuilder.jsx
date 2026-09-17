import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  FileCode,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Eye,
  Edit3,
  Users,
  User,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Upload,
  Globe,
  Lock,
} from 'lucide-react';

const FIELD_TYPES = [
  { id: 'short_text', label: 'Short Answer' },
  { id: 'long_text', label: 'Paragraph / Long Answer' },
  { id: 'number', label: 'Number / Numeric UID' },
  { id: 'email', label: 'Email Address' },
  { id: 'phone', label: 'Phone / WhatsApp' },
  { id: 'dropdown', label: 'Dropdown Select' },
  { id: 'multiple_choice', label: 'Multiple Choice (Radio)' },
  { id: 'checkbox', label: 'Checkboxes (Multi-select)' },
  { id: 'image_upload', label: 'Image Upload (Photo / Logo)' },
  { id: 'file_upload', label: 'File Upload (ID Card / Proof)' },
];

const FormBuilder = () => {
  const { id } = useParams();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [activeMode, setActiveMode] = useState('builder'); // 'builder' | 'preview'

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState([]);

  // Preview form state
  const [previewValues, setPreviewValues] = useState({});

  useEffect(() => {
    fetchFormData();
  }, [id]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tournaments/${id}/form`);
      if (res.data.success) {
        const form = res.data.form;
        setFormTitle(form.title || `${res.data.tournament.name} Registration Form`);
        setFormDescription(form.description || '');
        setIsPublished(form.isPublished !== false);
        setQuestions(form.questions || []);
        setTournament(res.data.tournament);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournament form schema', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (scope = 'player') => {
    const newId = `q_${scope}_${Date.now()}`;
    const newQuestion = {
      id: newId,
      scope,
      label: scope === 'team' ? 'New Team Question' : 'New Player Question',
      helpText: '',
      fieldType: 'short_text',
      required: true,
      options: ['Option 1', 'Option 2'],
      placeholder: '',
      order: questions.length + 1,
      isPublic: scope === 'team' || false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index, updates) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    if (questions.length <= 1) {
      addToast('Form must have at least one question', 'warning');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== index);
    setQuestions(updated);
  };

  const handleMove = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  const handleApplyPreset = async (preset) => {
    if (!window.confirm(`Reset questions to the standard ${preset.toUpperCase()} template? Any unsaved edits will be replaced.`)) {
      return;
    }
    try {
      setSaving(true);
      const res = await API.post(`/tournaments/${id}/form/preset`, { preset });
      if (res.data.success) {
        setQuestions(res.data.form.questions || []);
        setFormTitle(res.data.form.title);
        addToast(`Applied ${preset.toUpperCase()} template!`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to apply preset', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      addToast('Please provide a form title', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle.trim(),
        description: formDescription,
        isPublished,
        questions: questions.map((q, idx) => ({ ...q, order: idx + 1 })),
      };

      const res = await API.put(`/tournaments/${id}/form`, payload);
      if (res.data.success) {
        addToast('Registration form schema saved successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save form', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview handler
  const handlePreviewChange = (qId, val) => {
    setPreviewValues({ ...previewValues, [qId]: val });
  };

  if (loading) return <Loading message="Loading Dynamic Form Builder..." />;

  const teamQuestions = questions.filter((q) => q.scope === 'team');
  const playerQuestions = questions.filter((q) => q.scope === 'player');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tournaments"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                {tournament?.game || 'Tournament'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Dynamic Form Builder</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {tournament?.name}
            </h1>
          </div>
        </div>

        {/* View Toggle & Save Button */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveMode('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'builder'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Builder
            </button>
            <button
              onClick={() => setActiveMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>

          <button
            onClick={handleSaveForm}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {activeMode === 'builder' ? (
        <div className="space-y-6">
          {/* Form Metadata Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" /> Form Settings & Presets
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('bgmi')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 border border-slate-700 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" /> Load BGMI Preset
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('free_fire')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-rose-400 border border-slate-700 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" /> Load Free Fire Preset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold text-slate-300">Form Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. BGMI Tech Fest 2026 Registration"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold text-slate-300">Form Description / Guidelines</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. All players must upload college ID card for verification."
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Questions</span>
              <span className="text-lg font-black text-cyan-400 font-mono">{questions.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Team Scope</span>
              <span className="text-lg font-black text-indigo-400 font-mono">{teamQuestions.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Player Scope</span>
              <span className="text-lg font-black text-fuchsia-400 font-mono">{playerQuestions.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Required Fields</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {questions.filter((q) => q.required).length}
              </span>
            </div>
          </div>

          {/* Questions Editor List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                Registration Questions Schema ({questions.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('team')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-xs font-bold text-indigo-300 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Team Question
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('player')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-xs font-bold text-cyan-300 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Player Question
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const isTeam = q.scope === 'team';
                const hasOptions = ['dropdown', 'multiple_choice', 'checkbox'].includes(q.fieldType);

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isTeam
                        ? 'bg-slate-900/80 border-indigo-900/60 shadow-lg shadow-indigo-950/20'
                        : 'bg-slate-900/80 border-slate-800 shadow-lg'
                    }`}
                  >
                    {/* Card Header & Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>

                        {/* Scope Toggle */}
                        <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(idx, { scope: 'team' })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                              isTeam
                                ? 'bg-indigo-900/80 text-indigo-200 shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Users className="w-3 h-3" /> Team Scope
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(idx, { scope: 'player' })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                              !isTeam
                                ? 'bg-cyan-900/80 text-cyan-200 shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <User className="w-3 h-3" /> Player Scope
                          </button>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors ml-2"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Label */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-[11px] font-mono font-bold text-slate-300">
                          Question Label / Title *
                        </label>
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => handleUpdateQuestion(idx, { label: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                          placeholder="e.g. College Registration ID"
                        />
                      </div>

                      {/* Field Type */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono font-bold text-slate-300">
                          Field Type
                        </label>
                        <select
                          value={q.fieldType}
                          onChange={(e) => handleUpdateQuestion(idx, { fieldType: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          {FIELD_TYPES.map((ft) => (
                            <option key={ft.id} value={ft.id}>
                              {ft.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Help Text */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-[11px] font-mono font-bold text-slate-400">
                          Help Text / Guidance (optional)
                        </label>
                        <input
                          type="text"
                          value={q.helpText || ''}
                          onChange={(e) => handleUpdateQuestion(idx, { helpText: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                          placeholder="Short instruction shown below field"
                        />
                      </div>

                      {/* Placeholder */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-mono font-bold text-slate-400">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={q.placeholder || ''}
                          onChange={(e) => handleUpdateQuestion(idx, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                          placeholder="e.g. 512345678"
                        />
                      </div>
                    </div>

                    {/* Options list for choice-based fields */}
                    {hasOptions && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                        <label className="block text-[11px] font-mono font-bold text-amber-400">
                          Choices / Options:
                        </label>
                        <div className="space-y-2">
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono w-4">{optIdx + 1}.</span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[optIdx] = e.target.value;
                                  handleUpdateQuestion(idx, { options: newOpts });
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOpts = q.options.filter((_, oI) => oI !== optIdx);
                                  handleUpdateQuestion(idx, { options: newOpts });
                                }}
                                className="p-1 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                              handleUpdateQuestion(idx, { options: newOpts });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline mt-1"
                          >
                            <Plus className="w-3 h-3" /> Add Choice
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Toggles Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-6">
                        {/* Required Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => handleUpdateQuestion(idx, { required: e.target.checked })}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-bold text-slate-200">Required Field</span>
                        </label>

                        {/* Public Visibility Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.isPublic}
                            onChange={(e) => handleUpdateQuestion(idx, { isPublic: e.target.checked })}
                            className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-bold text-slate-300 flex items-center gap-1">
                            {q.isPublic ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                            {q.isPublic ? 'Publicly Visible on Team Card' : 'Private (Admin Eyes Only)'}
                          </span>
                        </label>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: <code className="text-slate-400">{q.id}</code>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* LIVE STUDENT PREVIEW MODE */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Interactive Student Preview:</strong> Test this registration questionnaire exactly as players will experience it during tournament signup.
            </span>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Team Questions Section */}
            {teamQuestions.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-900/50 shadow-2xl space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase">
                    <Users className="w-4 h-4" /> Team Details
                  </div>
                  <h3 className="text-base font-bold text-white font-mono mt-1">Squad Information</h3>
                </div>

                <div className="space-y-4">
                  {teamQuestions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-200">
                        {q.label} {q.required && <span className="text-rose-400">*</span>}
                      </label>
                      {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}

                      {q.fieldType === 'dropdown' ? (
                        <select
                          value={previewValues[q.id] || ''}
                          onChange={(e) => handlePreviewChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        >
                          <option value="">{q.placeholder || 'Select an option'}</option>
                          {q.options?.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={q.fieldType === 'number' ? 'number' : 'text'}
                          value={previewValues[q.id] || ''}
                          onChange={(e) => handlePreviewChange(q.id, e.target.value)}
                          placeholder={q.placeholder || ''}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Questions Section */}
            {playerQuestions.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-900/40 shadow-2xl space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                    <User className="w-4 h-4" /> Player Information (Applied to each slot)
                  </div>
                  <h3 className="text-base font-bold text-white font-mono mt-1">Individual Gamer Verification</h3>
                </div>

                <div className="space-y-4">
                  {playerQuestions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-200">
                          {q.label} {q.required && <span className="text-rose-400">*</span>}
                        </label>
                        {!q.isPublic && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                            <Lock className="w-3 h-3" /> Private Document / PII
                          </span>
                        )}
                      </div>
                      {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}

                      {q.fieldType === 'long_text' ? (
                        <textarea
                          rows={3}
                          value={previewValues[q.id] || ''}
                          onChange={(e) => handlePreviewChange(q.id, e.target.value)}
                          placeholder={q.placeholder || ''}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      ) : q.fieldType === 'image_upload' || q.fieldType === 'file_upload' ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center text-xs text-slate-400">
                          <Upload className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                          <span className="text-slate-300 font-semibold">Upload {q.label}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Mock upload preview zone</p>
                        </div>
                      ) : q.fieldType === 'dropdown' ? (
                        <select
                          value={previewValues[q.id] || ''}
                          onChange={(e) => handlePreviewChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        >
                          <option value="">{q.placeholder || 'Select an option'}</option>
                          {q.options?.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={q.fieldType === 'number' ? 'number' : q.fieldType === 'email' ? 'email' : 'text'}
                          value={previewValues[q.id] || ''}
                          onChange={(e) => handlePreviewChange(q.id, e.target.value)}
                          placeholder={q.placeholder || ''}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
