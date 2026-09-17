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
  Settings,
  Layers,
  Info,
  UserPlus,
  X,
  FileText,
  Clock,
  Shield,
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
  { id: 'image_upload', label: 'Image Upload (Photo / Avatar)' },
  { id: 'file_upload', label: 'File Upload (PDF Document)' },
];

const FormBuilder = () => {
  const { id } = useParams();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tournament, setTournament] = useState(null);
  const [activeMode, setActiveMode] = useState('builder'); // 'builder' | 'preview'

  // Form metadata
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState([]);

  // Sizing & Roster Rules
  const [minTeamSize, setMinTeamSize] = useState(4);
  const [maxTeamSize, setMaxTeamSize] = useState(5);
  const [allowSubstitutes, setAllowSubstitutes] = useState(true);
  const [maxSubstitutes, setMaxSubstitutes] = useState(1);
  const [identityProofDeadline, setIdentityProofDeadline] = useState('');

  // Preview form state
  const [previewValues, setPreviewValues] = useState({});
  const [previewSlotCount, setPreviewSlotCount] = useState(4);

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

        // Sanitize questions: STRICTLY remove identity_proof from player scope
        let rawQuestions = form.questions || [];
        let sanitized = rawQuestions.filter((q) => {
          if (q.scope === 'player' && (q.id === 'identity_proof' || q.id === 'student_id_proof' || q.id === 'team_identity_proof')) {
            return false;
          }
          return true;
        });

        // Ensure Team Identity Proof exists in team scope
        const hasTeamProof = sanitized.some(
          (q) => q.scope === 'team' && (q.id === 'team_identity_proof' || q.id === 'identity_proof')
        );
        if (!hasTeamProof) {
          sanitized.push({
            id: 'team_identity_proof',
            scope: 'team',
            label: 'Team Identity / College Proof',
            helpText: 'Upload ONE PDF containing the identity/college proof of all registered team members. For UEM students, include the required IEMCRP/college proof for each member.',
            fieldType: 'file_upload',
            required: true,
            options: [],
            placeholder: '',
            order: 3,
            isPublic: false,
          });
        }

        setQuestions(sanitized);
        setTournament(res.data.tournament);

        const minS = res.data.tournament.minTeamSize || 4;
        const maxS = res.data.tournament.maxTeamSize || 5;
        setMinTeamSize(minS);
        setMaxTeamSize(maxS);
        setAllowSubstitutes(res.data.tournament.allowSubstitutes !== false);
        setMaxSubstitutes(res.data.tournament.maxSubstitutes || 1);
        setPreviewSlotCount(minS);

        const idDeadline = res.data.tournament.identityProofDeadline || res.data.tournament.registrationDeadline;
        if (idDeadline) {
          setIdentityProofDeadline(new Date(idDeadline).toISOString().slice(0, 16));
        }
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
      isPublic: scope === 'team' ? true : false,
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

    if (minTeamSize < 1) {
      addToast('Required players must be at least 1', 'error');
      return;
    }

    if (maxTeamSize < minTeamSize) {
      addToast('Maximum players cannot be less than required players', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle.trim(),
        description: formDescription,
        isPublished,
        questions: questions.map((q, idx) => ({ ...q, order: idx + 1 })),
        teamConfig: {
          minTeamSize: Number(minTeamSize),
          maxTeamSize: Number(maxTeamSize),
          allowSubstitutes: Boolean(allowSubstitutes),
          maxSubstitutes: Number(maxSubstitutes),
          identityProofDeadline: identityProofDeadline ? new Date(identityProofDeadline).toISOString() : undefined,
        },
      };

      const res = await API.put(`/tournaments/${id}/form`, payload);
      if (res.data.success) {
        addToast('Registration form & squad sizing rules saved successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save form', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview handlers
  const handlePreviewChange = (key, val) => {
    setPreviewValues({ ...previewValues, [key]: val });
  };

  const handlePreviewAddSlot = () => {
    if (previewSlotCount < maxTeamSize) {
      setPreviewSlotCount(previewSlotCount + 1);
      addToast(`Added Player ${previewSlotCount + 1} slot in preview`, 'info');
    } else {
      addToast(`Maximum ${maxTeamSize} players reached`, 'warning');
    }
  };

  const handlePreviewRemoveSlot = (slotNum) => {
    if (previewSlotCount > minTeamSize) {
      setPreviewSlotCount(previewSlotCount - 1);
      addToast(`Removed Player ${slotNum} slot from preview`, 'info');
    }
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeMode === 'builder'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Builder
            </button>
            <button
              onClick={() => {
                setActiveMode('preview');
                setPreviewSlotCount(minTeamSize);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
          {/* 1. SQUAD SIZING & PLAYER COUNT CONFIGURATION */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" /> Player Count & Squad Configuration
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Controls squad rules & deadlines</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  Required Players *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400">
                  e.g. 2 for Duo, 4 for Squad.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  Maximum Players *
                </label>
                <input
                  type="number"
                  min={minTeamSize}
                  max="12"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Math.max(minTeamSize, parseInt(e.target.value) || minTeamSize))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400">
                  Total cap with optional slots.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  Allow Substitutes
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={allowSubstitutes}
                      onChange={(e) => setAllowSubstitutes(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                    />
                    <span>Enable Subs</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  Extra slots become substitute.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  Max Substitutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={maxSubstitutes}
                  disabled={!allowSubstitutes}
                  onChange={(e) => setMaxSubstitutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono font-bold disabled:opacity-40"
                />
                <p className="text-[10px] text-slate-400">
                  Usually 1 for esports.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Identity Proof Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={identityProofDeadline}
                  onChange={(e) => setIdentityProofDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  After this deadline, user uploads are closed.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Squad Architecture:</strong> Initial registration shows exactly{' '}
                <span className="text-cyan-300 font-bold font-mono">{minTeamSize} required player slot(s)</span>.
                Captains can use <span className="text-indigo-300 font-bold font-mono">[+ Add Player]</span> to add optional slots
                up to {maxTeamSize}. Once all required players complete their player profiles, the{' '}
                <strong className="text-amber-300">ONE Team Identity Proof PDF</strong> upload unlocks.
              </span>
            </div>
          </div>

          {/* 2. FORM METADATA & PRESETS CARD */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" /> Form Settings & Presets
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('bgmi')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Load BGMI Preset
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('free_fire')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-rose-400 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
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
                  placeholder="e.g. All squads must upload one consolidated college proof PDF."
                />
              </div>
            </div>
          </div>

          {/* 3. QUICK STATS BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Questions</span>
              <span className="text-lg font-black text-cyan-400 font-mono">{questions.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Team Scope (Once)</span>
              <span className="text-lg font-black text-indigo-400 font-mono">{teamQuestions.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Player Template Fields</span>
              <span className="text-lg font-black text-fuchsia-400 font-mono">{playerQuestions.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Required Fields</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {questions.filter((q) => q.required).length}
              </span>
            </div>
          </div>

          {/* 4. SECTION 1: TEAM QUESTIONS (FILLED ONCE FOR SQUAD) */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> 1. Team Fields ({teamQuestions.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Filled <strong>once</strong> for the entire squad (Team Category, Team Identity Proof PDF, Bio).
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddQuestion('team')}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-xs font-bold text-indigo-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Team Field
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                if (q.scope !== 'team') return null;
                return renderQuestionCard(q, idx);
              })}
            </div>
          </div>

          {/* 5. SECTION 2: PLAYER FIELD TEMPLATE (BLUEPRINT REPEATED FOR EACH PLAYER) */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> 2. Reusable Player Field Template ({playerQuestions.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    Blueprint Auto-Repeats
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ⚡ <strong>Defined ONCE:</strong> Repeated automatically for Player 1 (Leader), Player 2, Player 3, etc.
                  (Identity Proof is handled at the team level, NOT per-player).
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddQuestion('player')}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Player Field
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                if (q.scope !== 'player') return null;
                return renderQuestionCard(q, idx);
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIVE STUDENT PREVIEW MODE ================= */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Interactive Student Preview:</strong> Required Starters ({minTeamSize}) with dynamic{' '}
                <strong>[+ Add Player]</strong> capability up to Maximum Players ({maxTeamSize}).
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-300">
                Slots in Preview: {previewSlotCount} / {maxTeamSize}
              </span>
              {previewSlotCount < maxTeamSize && (
                <button
                  type="button"
                  onClick={handlePreviewAddSlot}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" /> + Add Player
                </button>
              )}
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Team Questions Section in Preview */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-900/50 shadow-2xl space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase">
                  <Users className="w-4 h-4" /> Team Details (Filled Once)
                </div>
                <h3 className="text-base font-bold text-white font-mono mt-1">Squad Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 font-mono">Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Predators"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 font-mono">Team Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. APEX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              {teamQuestions.map((q) => {
                const isTeamIdProof = q.id === 'team_identity_proof' || q.fieldType === 'file_upload';
                if (isTeamIdProof) return null; // rendered in dedicated section below

                return (
                  <div key={q.id} className="space-y-1.5 pt-2">
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
                );
              })}
            </div>

            {/* Dynamic Repeated Player Slots Simulation */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> Player Slots ({previewSlotCount} Active Slots)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Each slot below auto-renders the Player Field Template blueprint (no document uploads inside player slots).
                  </p>
                </div>

                {previewSlotCount < maxTeamSize && (
                  <button
                    type="button"
                    onClick={handlePreviewAddSlot}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> [+ Add Player Slot]
                  </button>
                )}
              </div>

              {Array.from({ length: previewSlotCount }).map((_, slotIdx) => {
                const slotNum = slotIdx + 1;
                const isCaptain = slotNum === 1;
                const isRequiredStarter = slotNum <= minTeamSize;
                const isSubstitute = slotNum > minTeamSize;

                return (
                  <div
                    key={`slot-${slotNum}`}
                    className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
                      isCaptain
                        ? 'bg-slate-900/90 border-amber-900/40'
                        : isSubstitute
                        ? 'bg-slate-900/80 border-purple-900/40'
                        : 'bg-slate-900/90 border-cyan-900/40'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                          {slotNum}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono">
                            PLAYER {slotNum}{' '}
                            {isCaptain ? '(Team Leader)' : isSubstitute ? '(Substitute)' : '(Required Starter)'}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {isRequiredStarter ? 'Mandatory for squad completion' : 'Optional player slot'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isCaptain
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                              : isSubstitute
                              ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                          }`}
                        >
                          {isCaptain ? 'Team Leader' : isSubstitute ? 'Substitute' : 'Starter'}
                        </span>

                        {isSubstitute && (
                          <button
                            type="button"
                            onClick={() => handlePreviewRemoveSlot(slotNum)}
                            className="p-1 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 cursor-pointer"
                            title="Remove optional slot"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Repeated Template Questions for This Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {playerQuestions.map((q) => {
                        const fieldKey = `p${slotNum}_${q.id}`;

                        return (
                          <div
                            key={fieldKey}
                            className={`space-y-1.5 ${
                              q.fieldType === 'long_text' ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-200">
                                {q.label} {q.required && <span className="text-rose-400">*</span>}
                              </label>
                              {!q.isPublic && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                                  <Lock className="w-3 h-3" /> Private
                                </span>
                              )}
                            </div>
                            {q.helpText && <p className="text-[10px] text-slate-400">{q.helpText}</p>}

                            {q.fieldType === 'image_upload' ? (
                              <div className="p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center text-xs text-slate-400">
                                <Upload className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                                <span className="text-slate-300 font-semibold">Upload Photo</span>
                              </div>
                            ) : q.fieldType === 'dropdown' ? (
                              <select
                                value={previewValues[fieldKey] || ''}
                                onChange={(e) => handlePreviewChange(fieldKey, e.target.value)}
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
                                value={previewValues[fieldKey] || ''}
                                onChange={(e) => handlePreviewChange(fieldKey, e.target.value)}
                                placeholder={q.placeholder || ''}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {previewSlotCount < maxTeamSize && (
                <div
                  onClick={handlePreviewAddSlot}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/30 text-center cursor-pointer group transition-all"
                >
                  <span className="text-xs font-bold font-mono text-slate-400 group-hover:text-cyan-400 flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" /> [+ Add Player {previewSlotCount + 1} Slot (Optional)]
                  </span>
                </div>
              )}
            </div>

            {/* Dedicated ONE Team Identity Proof Upload (Combined PDF) */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-900/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white font-mono uppercase">
                    3. Team Identity / College Proof (Single Combined PDF)
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-red-950 text-red-300 border border-red-800">
                  🔒 Private / Admin Only
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Upload ONE PDF containing the identity/college proof of all registered team members. For UEM students, include the required IEMCRP/college proof for each member.
              </p>

              <div className="p-5 rounded-2xl border-2 border-dashed border-amber-800/60 bg-amber-950/10 text-center space-y-2">
                <FileText className="w-8 h-8 mx-auto text-amber-400" />
                <div className="text-xs font-bold text-white">
                  ONE Combined Team Identity Proof (PDF)
                </div>
                <p className="text-[11px] text-slate-400">
                  ⚡ Unlocks automatically once all {minTeamSize} required starters have filled their player profiles.
                </p>
                {identityProofDeadline && (
                  <p className="text-[10px] text-amber-400 font-mono">
                    Submission Deadline: {new Date(identityProofDeadline).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for each question editor card
  function renderQuestionCard(q, idx) {
    const isTeam = q.scope === 'team';
    const hasOptions = ['dropdown', 'multiple_choice', 'checkbox'].includes(q.fieldType);
    const isTeamIdentityProof = q.id === 'team_identity_proof' || q.id === 'identity_proof';

    return (
      <div
        key={q.id || idx}
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isTeamIdentityProof
            ? 'bg-slate-900/80 border-amber-900/60 shadow-lg shadow-amber-950/20'
            : isTeam
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

            {/* Scope Badge */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                isTeamIdentityProof
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : isTeam
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
              }`}
            >
              {isTeamIdentityProof
                ? 'Team Identity Proof (1 PDF for squad)'
                : isTeam
                ? 'Team Scope (Once)'
                : 'Player Template (Repeats for all)'}
            </span>

            {isTeamIdentityProof && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-red-950 text-red-300 border border-red-800">
                🔒 Private / Admin Only
              </span>
            )}
          </div>

          {/* Card Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleMove(idx, 'up')}
              disabled={idx === 0}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
              title="Move Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleMove(idx, 'down')}
              disabled={idx === questions.length - 1}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
              title="Move Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {!isTeamIdentityProof && (
              <button
                type="button"
                onClick={() => handleDeleteQuestion(idx)}
                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-300 transition-colors cursor-pointer"
                title="Delete Question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Question Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Label */}
          <div className="md:col-span-6 space-y-1">
            <label className="block text-[11px] font-mono font-bold text-slate-300">Question Label / Title *</label>
            <input
              type="text"
              value={q.label}
              onChange={(e) => handleUpdateQuestion(idx, { label: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              placeholder="e.g. In-Game Name (IGN)"
            />
          </div>

          {/* Field Type Select */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-mono font-bold text-slate-300">Field Input Type</label>
            <select
              value={q.fieldType}
              disabled={isTeamIdentityProof}
              onChange={(e) => handleUpdateQuestion(idx, { fieldType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-60"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.id} value={ft.id}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Selection */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-mono font-bold text-slate-300">Target Scope</label>
            <select
              value={q.scope}
              disabled={isTeamIdentityProof}
              onChange={(e) => handleUpdateQuestion(idx, { scope: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-60"
            >
              <option value="player">Player Template (Repeated)</option>
              <option value="team">Team Scope (Once)</option>
            </select>
          </div>

          {/* Help Text / Guidance */}
          <div className="md:col-span-8 space-y-1">
            <label className="block text-[11px] font-mono font-bold text-slate-300">
              Guidance / Help Instructions
            </label>
            <input
              type="text"
              value={q.helpText || ''}
              onChange={(e) => handleUpdateQuestion(idx, { helpText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              placeholder="e.g. Upload ONE PDF containing identity proof of all members"
            />
          </div>

          {/* Placeholder */}
          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-mono font-bold text-slate-300">Placeholder Text</label>
            <input
              type="text"
              value={q.placeholder || ''}
              onChange={(e) => handleUpdateQuestion(idx, { placeholder: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              placeholder="e.g. 5123456789"
            />
          </div>
        </div>

        {/* Options Management for Choice Fields */}
        {hasOptions && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="block text-[11px] font-mono font-bold text-slate-300">
              Selection Options ({q.options?.length || 0})
            </label>
            <div className="space-y-1.5">
              {(q.options || []).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(q.options || [])];
                      newOpts[optIdx] = e.target.value;
                      handleUpdateQuestion(idx, { options: newOpts });
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOpts = q.options.filter((_, oI) => oI !== optIdx);
                      handleUpdateQuestion(idx, { options: newOpts });
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 cursor-pointer"
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
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline mt-1 cursor-pointer"
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
                checked={isTeamIdentityProof ? false : q.isPublic}
                disabled={isTeamIdentityProof}
                onChange={(e) => handleUpdateQuestion(idx, { isPublic: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer disabled:opacity-50"
              />
              <span className="font-bold text-slate-300 flex items-center gap-1">
                {isTeamIdentityProof || !q.isPublic ? (
                  <Lock className="w-3 h-3 text-amber-400" />
                ) : (
                  <Globe className="w-3 h-3 text-emerald-400" />
                )}
                {isTeamIdentityProof
                  ? 'Private / Admin Only (Enforced)'
                  : q.isPublic
                  ? 'Publicly Visible on Team Card'
                  : 'Private (Admin Eyes Only)'}
              </span>
            </label>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            Key: <code className="text-slate-400">{q.id}</code>
          </span>
        </div>
      </div>
    );
  }
};

export default FormBuilder;
