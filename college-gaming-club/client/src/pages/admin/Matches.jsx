import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Trophy,
  Swords,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Key,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  Crown,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Search,
  Filter,
  CheckSquare,
  Square,
} from 'lucide-react';

const AdminMatches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTournament = searchParams.get('tournament') || '';
  const { addToast } = useToast();

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(initialTournament);
  const [loading, setLoading] = useState(true);
  const [structureLoading, setStructureLoading] = useState(false);

  // Tournament Stages & Structure Data
  const [structure, setStructure] = useState({
    tournament: null,
    stages: [],
    allRegistrations: [],
    matches: [],
  });

  // Active Stage
  const [activeStageId, setActiveStageId] = useState(null);

  // Modals state
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageFormData, setStageFormData] = useState({
    name: '',
    order: 1,
    status: 'upcoming',
    isFinal: false,
  });

  const [lobbyModalOpen, setLobbyModalOpen] = useState(false);
  const [editingLobby, setEditingLobby] = useState(null);
  const [lobbyFormData, setLobbyFormData] = useState({
    name: '',
    maxTeams: 25,
  });

  const [assignTeamsModalOpen, setAssignTeamsModalOpen] = useState(false);
  const [targetLobbyForAssign, setTargetLobbyForAssign] = useState(null);
  const [selectedLobbyTeamIds, setSelectedLobbyTeamIds] = useState([]);

  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [targetLobbyForMatch, setTargetLobbyForMatch] = useState(null);
  const [matchFormData, setMatchFormData] = useState({
    title: '',
    map: 'Erangel',
    matchNumber: 1,
    scheduledAt: '',
    status: 'scheduled',
    roomId: '',
    roomPassword: '',
    streamUrl: '',
    notes: '',
    winner: '',
  });

  // Sub-tab for Active Stage: 'lobbies' | 'qualification'
  const [stageSubTab, setStageSubTab] = useState('lobbies');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all'); // 'all' | 'qualified' | 'not-qualified' | 'unassigned'

  // Manual Qualification & Advance modal
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [selectedAdvancingTeamIds, setSelectedAdvancingTeamIds] = useState([]);
  const [advanceTargetType, setAdvanceTargetType] = useState('new'); // 'new' | 'existing'
  const [advanceNextStageId, setAdvanceNextStageId] = useState('');
  const [advanceNewStageName, setAdvanceNewStageName] = useState('');
  const [advanceIsFinal, setAdvanceIsFinal] = useState(false);
  const [advanceMode, setAdvanceMode] = useState('replace'); // 'replace' | 'append'
  const [advanceSearchTerm, setAdvanceSearchTerm] = useState('');

  // Admin Override Teams for Active Stage
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTeamIds, setOverrideTeamIds] = useState([]);
  const [overrideSearchTerm, setOverrideSearchTerm] = useState('');

  // Roster inspection modal
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [viewingRosterTeam, setViewingRosterTeam] = useState(null);

  // Toggle room password visibility
  const [showPasswordMap, setShowPasswordMap] = useState({});

  const [submitting, setSubmitting] = useState(false);

  // Load all tournaments
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tournaments');
      const list = res.data.tournaments || [];
      setTournaments(list);

      if (list.length > 0) {
        const found = list.find((t) => t._id === initialTournament);
        const chosen = found ? found._id : list[0]._id;
        setSelectedTournamentId(chosen);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load stage structure when tournament changes
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
      fetchStructure(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const fetchStructure = async (tournamentId) => {
    try {
      setStructureLoading(true);
      const res = await API.get(`/tournaments/${tournamentId}/stages-structure`);
      if (res.data.success) {
        setStructure(res.data);
        const stages = res.data.stages || [];
        if (stages.length > 0) {
          // Keep active stage if it still exists, else pick first
          setActiveStageId((prev) => {
            const exists = stages.some((s) => s._id === prev);
            return exists ? prev : stages[0]._id;
          });
        } else {
          setActiveStageId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load stages structure:', err);
      addToast(err.response?.data?.message || 'Failed to load tournament stages', 'error');
    } finally {
      setStructureLoading(false);
    }
  };

  // Active Stage object
  const activeStage = useMemo(() => {
    return (structure.stages || []).find((s) => s._id === activeStageId) || null;
  }, [structure.stages, activeStageId]);

  // Eligible teams for active stage
  // If stage 1 and qualifiedTeams is empty, treat all verified registrations as eligible
  const eligibleStageTeams = useMemo(() => {
    if (!activeStage) return [];
    if (activeStage.qualifiedTeams && activeStage.qualifiedTeams.length > 0) {
      return activeStage.qualifiedTeams;
    }
    // Fallback for Stage 1 if qualifiedTeams was not prefilled
    if (structure.stages?.[0]?._id === activeStage._id) {
      return structure.allRegistrations || [];
    }
    return [];
  }, [activeStage, structure.allRegistrations, structure.stages]);

  // Helper map of all matches by lobbyId
  const matchesByLobby = useMemo(() => {
    const map = {};
    (structure.matches || []).forEach((m) => {
      const lid = m.lobbyId?.toString() || 'unassigned';
      if (!map[lid]) map[lid] = [];
      map[lid].push(m);
    });
    return map;
  }, [structure.matches]);

  // Teams already assigned in active stage's other lobbies
  const assignedTeamIdSet = useMemo(() => {
    const set = new Set();
    if (!activeStage?.lobbies) return set;
    activeStage.lobbies.forEach((lobby) => {
      (lobby.teams || []).forEach((tm) => {
        const id = tm._id ? tm._id.toString() : tm.toString();
        set.add(id);
      });
    });
    return set;
  }, [activeStage]);

  // Map of teamId -> Lobby Name in active stage
  const teamLobbyMap = useMemo(() => {
    const map = {};
    if (!activeStage?.lobbies) return map;
    activeStage.lobbies.forEach((lobby) => {
      (lobby.teams || []).forEach((tm) => {
        const id = tm._id ? tm._id.toString() : tm.toString();
        map[id] = lobby.name;
      });
    });
    return map;
  }, [activeStage]);

  // Keep selected advancing team IDs in sync with active stage's advancedTeams
  useEffect(() => {
    if (activeStage) {
      const adv = (activeStage.advancedTeams || []).map((t) =>
        t._id ? t._id.toString() : t.toString()
      );
      setSelectedAdvancingTeamIds(adv);
    }
  }, [activeStageId, activeStage?.advancedTeams]);

  // Filtered stage teams for the Teams & Qualification dashboard
  const filteredStageTeams = useMemo(() => {
    let list = eligibleStageTeams || [];
    if (teamSearchTerm.trim()) {
      const q = teamSearchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.teamName?.toLowerCase().includes(q) ||
          t.teamTag?.toLowerCase().includes(q) ||
          t.captain?.name?.toLowerCase().includes(q)
      );
    }
    const advSet = new Set(
      (activeStage?.advancedTeams || []).map((t) => (t._id ? t._id.toString() : t.toString()))
    );

    if (teamFilter === 'qualified') {
      list = list.filter((t) => advSet.has(t._id?.toString()));
    } else if (teamFilter === 'not-qualified') {
      list = list.filter((t) => !advSet.has(t._id?.toString()));
    } else if (teamFilter === 'unassigned') {
      list = list.filter((t) => !teamLobbyMap[t._id?.toString()]);
    }
    return list;
  }, [eligibleStageTeams, teamSearchTerm, teamFilter, activeStage?.advancedTeams, teamLobbyMap]);

  // Filtered tournament registrations for Admin Override modal
  const filteredOverrideTeams = useMemo(() => {
    const all = structure.allRegistrations || [];
    if (!overrideSearchTerm.trim()) return all;
    const q = overrideSearchTerm.toLowerCase();
    return all.filter(
      (t) =>
        t.teamName?.toLowerCase().includes(q) ||
        t.teamTag?.toLowerCase().includes(q) ||
        t.captain?.name?.toLowerCase().includes(q)
    );
  }, [structure.allRegistrations, overrideSearchTerm]);

  // ==========================================
  // STAGE ACTIONS
  // ==========================================
  const handleOpenCreateStage = () => {
    setEditingStage(null);
    const count = structure.stages?.length || 0;
    setStageFormData({
      name: count === 0 ? 'Round 1 (Group Stage)' : `Round ${count + 1}`,
      order: count + 1,
      status: 'upcoming',
      isFinal: false,
    });
    setStageModalOpen(true);
  };

  const handleOpenEditStage = (stage) => {
    setEditingStage(stage);
    setStageFormData({
      name: stage.name,
      order: stage.order || 1,
      status: stage.status || 'upcoming',
      isFinal: Boolean(stage.isFinal),
    });
    setStageModalOpen(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    if (!stageFormData.name.trim()) {
      addToast('Please enter a stage name', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editingStage) {
        await API.put(`/tournaments/${selectedTournamentId}/stages/${editingStage._id}`, stageFormData);
        addToast('Stage updated successfully', 'success');
      } else {
        const res = await API.post(`/tournaments/${selectedTournamentId}/stages`, stageFormData);
        addToast(res.data.message || 'Stage created', 'success');
        if (res.data.stage) {
          setActiveStageId(res.data.stage._id);
        }
      }
      setStageModalOpen(false);
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save stage', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Delete this stage and all its lobbies & scheduled matches?')) return;
    try {
      await API.delete(`/tournaments/${selectedTournamentId}/stages/${stageId}`);
      addToast('Stage deleted', 'success');
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete stage', 'error');
    }
  };

  // ==========================================
  // LOBBY ACTIONS
  // ==========================================
  const handleOpenCreateLobby = () => {
    if (!activeStage) return;
    setEditingLobby(null);
    const count = activeStage.lobbies?.length || 0;
    setLobbyFormData({
      name: `Lobby ${count + 1}`,
      maxTeams: 25,
    });
    setLobbyModalOpen(true);
  };

  const handleOpenEditLobby = (lobby) => {
    setEditingLobby(lobby);
    setLobbyFormData({
      name: lobby.name,
      maxTeams: lobby.maxTeams || 25,
    });
    setLobbyModalOpen(true);
  };

  const handleSaveLobby = async (e) => {
    e.preventDefault();
    if (!lobbyFormData.name.trim()) {
      addToast('Please enter a lobby name', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editingLobby) {
        await API.put(
          `/tournaments/${selectedTournamentId}/stages/${activeStageId}/lobbies/${editingLobby._id}`,
          lobbyFormData
        );
        addToast('Lobby updated', 'success');
      } else {
        await API.post(
          `/tournaments/${selectedTournamentId}/stages/${activeStageId}/lobbies`,
          lobbyFormData
        );
        addToast('Lobby created', 'success');
      }
      setLobbyModalOpen(false);
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save lobby', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLobby = async (lobbyId) => {
    if (!window.confirm('Delete this lobby and its matches?')) return;
    try {
      await API.delete(
        `/tournaments/${selectedTournamentId}/stages/${activeStageId}/lobbies/${lobbyId}`
      );
      addToast('Lobby deleted', 'success');
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete lobby', 'error');
    }
  };

  // ==========================================
  // ASSIGN TEAMS TO LOBBY
  // ==========================================
  const handleOpenAssignTeams = (lobby) => {
    setTargetLobbyForAssign(lobby);
    const currentIds = (lobby.teams || []).map((t) => (t._id ? t._id.toString() : t.toString()));
    setSelectedLobbyTeamIds(currentIds);
    setAssignTeamsModalOpen(true);
  };

  const handleToggleLobbyTeam = (teamId) => {
    setSelectedLobbyTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSaveLobbyTeams = async () => {
    try {
      setSubmitting(true);
      await API.post(
        `/tournaments/${selectedTournamentId}/stages/${activeStageId}/lobbies/${targetLobbyForAssign._id}/assign-teams`,
        { teamIds: selectedLobbyTeamIds }
      );
      addToast(`Assigned ${selectedLobbyTeamIds.length} teams to ${targetLobbyForAssign.name}`, 'success');
      setAssignTeamsModalOpen(false);
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to assign teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // MATCH ACTIONS
  // ==========================================
  const handleOpenCreateMatch = (lobby) => {
    setTargetLobbyForMatch(lobby);
    setEditingMatch(null);
    const existing = matchesByLobby[lobby._id.toString()] || [];
    const num = existing.length + 1;
    setMatchFormData({
      title: `Match ${num} - Erangel`,
      map: 'Erangel',
      matchNumber: num,
      scheduledAt: new Date().toISOString().slice(0, 16),
      status: 'scheduled',
      roomId: '',
      roomPassword: '',
      streamUrl: '',
      notes: '',
      winner: '',
    });
    setMatchModalOpen(true);
  };

  const handleOpenEditMatch = (match, lobby) => {
    setTargetLobbyForMatch(lobby);
    setEditingMatch(match);
    setMatchFormData({
      title: match.title || `Match ${match.matchNumber}`,
      map: match.map || 'Erangel',
      matchNumber: match.matchNumber || 1,
      scheduledAt: match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0, 16) : '',
      status: match.status || 'scheduled',
      roomId: match.roomId || '',
      roomPassword: match.roomPassword || '',
      streamUrl: match.streamUrl || '',
      notes: match.notes || '',
      winner: match.winner?._id || match.winner || '',
    });
    setMatchModalOpen(true);
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingMatch) {
        await API.put(
          `/tournaments/${selectedTournamentId}/matches/${editingMatch._id}`,
          matchFormData
        );
        addToast('Match updated successfully', 'success');
      } else {
        await API.post(
          `/tournaments/${selectedTournamentId}/stages/${activeStageId}/lobbies/${targetLobbyForMatch._id}/matches`,
          matchFormData
        );
        addToast('Match scheduled for lobby', 'success');
      }
      setMatchModalOpen(false);
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save match', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Delete this match fixture?')) return;
    try {
      await API.delete(`/tournaments/${selectedTournamentId}/matches/${matchId}`);
      addToast('Match removed', 'success');
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete match', 'error');
    }
  };

  // ==========================================
  // MANUAL QUALIFICATION & ADVANCEMENT
  // ==========================================
  const handleOpenAdvanceModal = () => {
    if (!activeStage) return;
    const existingAdv = (activeStage.advancedTeams || []).map((t) =>
      t._id ? t._id.toString() : t.toString()
    );
    setSelectedAdvancingTeamIds(existingAdv);
    setAdvanceSearchTerm('');
    setAdvanceMode('replace');

    // Other stages that are after this one
    const otherStages = (structure.stages || []).filter(
      (s) => s._id !== activeStage._id && (s.order || 0) > (activeStage.order || 0)
    );

    if (otherStages.length > 0) {
      setAdvanceTargetType('existing');
      setAdvanceNextStageId(otherStages[0]._id);
    } else {
      setAdvanceTargetType('new');
      setAdvanceNewStageName(`Round ${(activeStage.order || 1) + 1}`);
    }

    setAdvanceIsFinal(false);
    setAdvanceModalOpen(true);
  };

  const handleToggleAdvancingTeam = (teamId) => {
    setSelectedAdvancingTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSelectAllAdvancing = (teamList) => {
    const ids = (teamList || eligibleStageTeams).map((t) => (t._id ? t._id.toString() : t.toString()));
    setSelectedAdvancingTeamIds(Array.from(new Set([...selectedAdvancingTeamIds, ...ids])));
  };

  const handleDeselectAllAdvancing = () => {
    setSelectedAdvancingTeamIds([]);
  };

  // Instant single-click qualification toggle for a team
  const handleQuickToggleQualify = async (teamId) => {
    if (!activeStage) return;
    const currentAdv = (activeStage.advancedTeams || []).map((t) =>
      t._id ? t._id.toString() : t.toString()
    );
    const isCurrentlyQualified = currentAdv.includes(teamId);
    const updated = isCurrentlyQualified
      ? currentAdv.filter((id) => id !== teamId)
      : [...currentAdv, teamId];

    try {
      await API.post(
        `/tournaments/${selectedTournamentId}/stages/${activeStageId}/advance-teams`,
        {
          advancedTeamIds: updated,
          createNextStage: false,
        }
      );
      addToast(
        isCurrentlyQualified
          ? 'Team qualification removed'
          : '★ Team marked as Qualified for advancement!',
        'success'
      );
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update team qualification', 'error');
    }
  };

  // Save the marked qualifying teams into current stage without moving to next stage yet
  const handleSaveCurrentQualifications = async () => {
    if (!activeStage) return;
    try {
      setSubmitting(true);
      const res = await API.post(
        `/tournaments/${selectedTournamentId}/stages/${activeStageId}/advance-teams`,
        {
          advancedTeamIds: selectedAdvancingTeamIds,
          createNextStage: false,
        }
      );
      addToast(res.data.message || `Saved ${selectedAdvancingTeamIds.length} qualified teams!`, 'success');
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save qualifications', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAdvanceTeams = async (e) => {
    e.preventDefault();
    if (selectedAdvancingTeamIds.length === 0) {
      if (!window.confirm('No teams selected to advance. Continue to clear advanced list?')) return;
    }

    try {
      setSubmitting(true);
      const payload = {
        advancedTeamIds: selectedAdvancingTeamIds,
        createNextStage: advanceTargetType === 'new',
        nextStageId: advanceTargetType === 'existing' ? advanceNextStageId : null,
        nextStageName: advanceTargetType === 'new' ? advanceNewStageName : '',
        isFinal: advanceTargetType === 'new' ? advanceIsFinal : false,
        mode: advanceMode,
      };

      const res = await API.post(
        `/tournaments/${selectedTournamentId}/stages/${activeStageId}/advance-teams`,
        payload
      );
      addToast(res.data.message || 'Teams successfully qualified and advanced!', 'success');
      setAdvanceModalOpen(false);
      await fetchStructure(selectedTournamentId);

      if (res.data.targetStage) {
        setActiveStageId(res.data.targetStage._id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to advance teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ADMIN OVERRIDE ELIGIBLE TEAMS FOR ACTIVE STAGE
  // ==========================================
  const handleOpenOverrideTeams = () => {
    if (!activeStage) return;
    const currentIds = (activeStage.qualifiedTeams || []).map((t) =>
      t._id ? t._id.toString() : t.toString()
    );
    setOverrideTeamIds(currentIds);
    setOverrideSearchTerm('');
    setOverrideModalOpen(true);
  };

  const handleToggleOverrideTeam = (teamId) => {
    setOverrideTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSelectAllOverride = (teamList) => {
    const ids = (teamList || structure.allRegistrations || []).map((t) => t._id.toString());
    setOverrideTeamIds(Array.from(new Set([...overrideTeamIds, ...ids])));
  };

  const handleDeselectAllOverride = () => {
    setOverrideTeamIds([]);
  };

  const handleSaveOverrideTeams = async () => {
    try {
      setSubmitting(true);
      await API.put(
        `/tournaments/${selectedTournamentId}/stages/${activeStageId}/override-teams`,
        { qualifiedTeamIds: overrideTeamIds }
      );
      addToast('Stage eligible teams updated by Admin override', 'success');
      setOverrideModalOpen(false);
      fetchStructure(selectedTournamentId);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper copy to clipboard
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    addToast(`Copied ${label} to clipboard!`, 'success');
  };

  // Toggle show password
  const togglePasswordVisibility = (matchId) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  if (loading) {
    return <Loading message="Loading esports tournament manager..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100 font-sans">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TOURNAMENT SELECTOR */}
      {/* ======================================================== */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 backdrop-blur-xl border border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Collegiate Tournament Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
            STAGE & LOBBY MANAGER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Configure unlimited stages/rounds, lobbies, team rosters, matches, room credentials, and manually advance qualifying teams.
          </p>
        </div>

        {/* Tournament Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.game})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchStructure(selectedTournamentId)}
            className="self-end p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Structure"
          >
            <RefreshCw className={`w-4 h-4 ${structureLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OVERVIEW STATS BAR */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {structure.allRegistrations?.length || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Registered Teams</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {structure.stages?.length || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Stages / Rounds</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {(structure.stages || []).reduce((acc, s) => acc + (s.lobbies?.length || 0), 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Total Lobbies</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {structure.matches?.length || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Scheduled Matches</p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. STAGE TABS & CONTROLS */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>TOURNAMENT STAGES</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {structure.stages?.length || 0} Configured
            </span>
          </div>

          <button
            onClick={handleOpenCreateStage}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Stage / Round</span>
          </button>
        </div>

        {/* Stage Navigation Pills */}
        {structure.stages?.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300 font-mono">No Stages Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click <strong>"Create Stage / Round"</strong> to set up Round 1 or Group Stage, add any number of lobbies, and assign registered teams.
            </p>
            <button
              onClick={handleOpenCreateStage}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Stage</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {structure.stages.map((stg, idx) => {
              const isActive = stg._id === activeStageId;
              return (
                <button
                  key={stg._id}
                  onClick={() => setActiveStageId(stg._id)}
                  className={`px-4 py-3 rounded-2xl font-mono text-xs font-bold flex items-center gap-2.5 transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-cyan-500/10 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-950/80 flex items-center justify-center text-[10px] font-black text-cyan-400 border border-cyan-500/30">
                    {idx + 1}
                  </span>
                  <span>{stg.name}</span>
                  {stg.isFinal && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-amber-400" /> FINAL
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    ({stg.lobbies?.length || 0} Lobbies)
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. ACTIVE STAGE MANAGEMENT BANNER */}
      {/* ======================================================== */}
      {activeStage && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
                {activeStage.isFinal ? <Crown className="w-6 h-6 text-amber-400" /> : <Layers className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white font-mono">{activeStage.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    activeStage.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : activeStage.status === 'ongoing'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {activeStage.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {eligibleStageTeams.length} eligible teams • {activeStage.lobbies?.length || 0} lobbies • {activeStage.advancedTeams?.length || 0} advanced to next stage
                </p>
              </div>
            </div>

            {/* Stage Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenOverrideTeams}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Manually add or remove eligible teams for this stage"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Override Stage Teams ({eligibleStageTeams.length})</span>
              </button>

              <button
                onClick={handleOpenAdvanceModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                title="Mark and advance qualifying teams to the next stage"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                <span>Advance Selected Teams ({activeStage.advancedTeams?.length || 0})</span>
              </button>

              <button
                onClick={() => handleOpenEditStage(activeStage)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Edit Stage Settings"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDeleteStage(activeStage._id)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Delete Stage"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUB-NAVIGATION: LOBBIES & MATCHES vs TEAMS & MANUAL QUALIFICATION */}
          {/* ======================================================== */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStageSubTab('lobbies')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  stageSubTab === 'lobbies'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Lobbies & Matches ({activeStage.lobbies?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setStageSubTab('teams')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  stageSubTab === 'teams'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Teams & Manual Qualification ({eligibleStageTeams.length})</span>
                {(activeStage.advancedTeams?.length || 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200 text-[10px] font-mono border border-amber-500/40">
                    ★ {activeStage.advancedTeams.length} Qualified
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenOverrideTeams}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                title="Admin Override: Force-add or remove any team in the tournament"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Override</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdvanceModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                title="Advance selected qualifying teams to next stage"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                <span>Advance Selected ({selectedAdvancingTeamIds.length})</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: LOBBIES & MATCHES IN ACTIVE STAGE */}
          {/* ======================================================== */}
          {stageSubTab === 'lobbies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold font-mono text-slate-200 uppercase tracking-wider">
                    LOBBIES IN {activeStage.name}
                  </h4>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {activeStage.lobbies?.length || 0} Lobbies
                  </span>
                </div>

                <button
                  onClick={handleOpenCreateLobby}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Lobby</span>
                </button>
              </div>

              {/* Lobbies Grid */}
              {activeStage.lobbies?.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-3">
                  <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">No lobbies created for this stage yet.</p>
                  <button
                    onClick={handleOpenCreateLobby}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create First Lobby</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeStage.lobbies.map((lobby) => {
                    const lobbyMatches = matchesByLobby[lobby._id.toString()] || [];
                    const assignedCount = lobby.teams?.length || 0;
                    const maxCap = lobby.maxTeams || 25;
                    const qualifiedInLobbyCount = (lobby.teams || []).filter((tm) =>
                      (activeStage.advancedTeams || []).some(
                        (a) => (a._id ? a._id.toString() : a.toString()) === (tm._id ? tm._id.toString() : tm.toString())
                      )
                    ).length;

                    return (
                      <div
                        key={lobby._id}
                        className="rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-cyan-500/30 transition-all overflow-hidden flex flex-col justify-between shadow-xl"
                      >
                        {/* Lobby Card Header */}
                        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                              L{lobby.order || 1}
                            </div>
                            <div>
                              <h5 className="text-base font-bold text-white font-mono">{lobby.name}</h5>
                              <span className="text-[11px] font-mono text-cyan-400">
                                {assignedCount} / {maxCap} Teams Assigned • <span className="text-amber-300 font-bold">{qualifiedInLobbyCount} Qualified</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenAssignTeams(lobby)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 font-mono font-bold text-[11px] uppercase transition-all cursor-pointer"
                            >
                              Manage Teams
                            </button>

                            <button
                              onClick={() => handleOpenEditLobby(lobby)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Rename / Edit Capacity"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteLobby(lobby._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Delete Lobby"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Teams in Lobby preview pills */}
                        <div className="p-4 border-b border-slate-800/50 bg-slate-950/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Assigned Teams ({assignedCount})
                            </span>
                            {assignedCount === 0 && (
                              <span className="text-[10px] text-amber-400 font-mono">No teams assigned yet</span>
                            )}
                          </div>

                          {assignedCount === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2 text-center font-mono">
                              Click "Manage Teams" above to select teams from this stage.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                              {lobby.teams.map((tm) => {
                                const isQual = (activeStage.advancedTeams || []).some(
                                  (a) => (a._id ? a._id.toString() : a.toString()) === tm._id?.toString()
                                );
                                return (
                                  <div
                                    key={tm._id}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                                      isQual
                                        ? 'bg-amber-950/70 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-500/10'
                                        : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-slate-600'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingRosterTeam(tm);
                                        setRosterModalOpen(true);
                                      }}
                                      className="font-bold hover:underline cursor-pointer truncate max-w-[130px]"
                                      title="Click to view player roster"
                                    >
                                      {tm.teamName}
                                    </button>
                                    {tm.teamTag && (
                                      <span className="text-[9px] text-cyan-400 font-mono">[{tm.teamTag}]</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickToggleQualify(tm._id);
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-0.5 cursor-pointer transition-all ${
                                        isQual
                                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                          : 'bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-700'
                                      }`}
                                      title={isQual ? 'Qualified! Click to remove' : 'Click to mark as Qualified'}
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>{isQual ? 'Qualified' : 'Qualify'}</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Matches in this Lobby */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                              <Swords className="w-3.5 h-3.5 text-rose-400" />
                              <span>Matches ({lobbyMatches.length})</span>
                            </span>

                            <button
                              onClick={() => handleOpenCreateMatch(lobby)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-bold uppercase flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Match</span>
                            </button>
                          </div>

                          {lobbyMatches.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
                              <p className="text-xs text-slate-500 font-mono">No matches scheduled for {lobby.name}.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lobbyMatches.map((m) => {
                                const isPwVisible = showPasswordMap[m._id];
                                return (
                                  <div
                                    key={m._id}
                                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono font-black text-white">
                                            {m.title || `Match ${m.matchNumber}`}
                                          </span>
                                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                                            m.status === 'completed'
                                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                              : m.status === 'live'
                                              ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                          }`}>
                                            {m.status}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                                          <span>Map: <strong className="text-slate-200">{m.map}</strong></span>
                                          <span>•</span>
                                          <span>Time: {new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleOpenEditMatch(m, lobby)}
                                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                          title="Edit Match"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMatch(m._id)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                                          title="Delete Match"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Room ID & Password Credentials Bar */}
                                    <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                                      <div className="flex items-center gap-2">
                                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-slate-400 text-[11px]">Room ID:</span>
                                        <span className="text-cyan-300 font-bold">
                                          {m.roomId || <em className="text-slate-500 font-normal">Not set</em>}
                                        </span>
                                        {m.roomId && (
                                          <button
                                            onClick={() => handleCopy(m.roomId, 'Room ID')}
                                            className="p-0.5 text-slate-400 hover:text-white"
                                            title="Copy Room ID"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-slate-400 text-[11px]">Password:</span>
                                        <span className="text-amber-300 font-bold">
                                          {m.roomPassword ? (
                                            isPwVisible ? m.roomPassword : '••••••••'
                                          ) : (
                                            <em className="text-slate-500 font-normal">Not set</em>
                                          )}
                                        </span>
                                        {m.roomPassword && (
                                          <>
                                            <button
                                              onClick={() => togglePasswordVisibility(m._id)}
                                              className="p-0.5 text-slate-400 hover:text-white"
                                              title={isPwVisible ? 'Hide' : 'Show'}
                                            >
                                              {isPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                            <button
                                              onClick={() => handleCopy(m.roomPassword, 'Password')}
                                              className="p-0.5 text-slate-400 hover:text-white"
                                              title="Copy Password"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {m.winner && (
                                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 pt-0.5">
                                        <Trophy className="w-3 h-3 text-amber-400" />
                                        <span>Winner: <strong>{m.winner?.teamName || 'Team'}</strong></span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TEAMS & MANUAL QUALIFICATION DASHBOARD */}
          {/* ======================================================== */}
          {stageSubTab === 'teams' && (
            <div className="space-y-4">
              {/* Informative Header / Notice */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>MANUAL QUALIFICATION & ADVANCEMENT</span>
                  </div>
                  <p className="text-amber-200/80 text-[11px] max-w-2xl">
                    Qualification is completely <strong>MANUAL</strong> for this phase: Admin selects qualifying teams and advances them to the next stage or finals. Admin can also override the eligible roster at any time.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveCurrentQualifications}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Selection</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAdvanceModal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Advance Qualified ({selectedAdvancingTeamIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={teamSearchTerm}
                      onChange={(e) => setTeamSearchTerm(e.target.value)}
                      placeholder="Search team, tag, captain..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setTeamFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        teamFilter === 'all'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({eligibleStageTeams.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamFilter('qualified')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        teamFilter === 'qualified'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      ★ Qualified ({(activeStage.advancedTeams || []).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamFilter('not-qualified')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        teamFilter === 'not-qualified'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pending ({eligibleStageTeams.length - (activeStage.advancedTeams || []).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamFilter('unassigned')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        teamFilter === 'unassigned'
                          ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-800'
                          : 'text-slate-400 hover:text-rose-300'
                      }`}
                    >
                      Unassigned
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllAdvancing(filteredStageTeams)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>Select All</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllAdvancing}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Square className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Teams Table / Cards */}
              {filteredStageTeams.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">No teams found matching current filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStageTeams.map((team) => {
                    const isQual = (activeStage.advancedTeams || []).some(
                      (a) => (a._id ? a._id.toString() : a.toString()) === team._id?.toString()
                    );
                    const isChecked = selectedAdvancingTeamIds.includes(team._id);
                    const assignedLobbyName = teamLobbyMap[team._id?.toString()];

                    return (
                      <div
                        key={team._id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isQual
                            ? 'bg-gradient-to-b from-amber-950/40 to-slate-950/80 border-amber-500/50 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleAdvancingTeam(team._id)}
                                className={`w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                                    : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                                }`}
                                title="Select for Advancement batch"
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>

                              <div className="min-w-0">
                                <h5 className="text-sm font-bold text-white font-mono truncate">
                                  {team.teamName}
                                </h5>
                                {team.teamTag && (
                                  <span className="text-[10px] text-cyan-400 font-mono">
                                    Tag: [{team.teamTag}]
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Qualification Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                                isQual
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{isQual ? 'QUALIFIED' : 'PENDING'}</span>
                            </span>
                          </div>

                          {/* Captain Info & Lobby status */}
                          <div className="text-[11px] font-mono text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                            <div className="flex items-center justify-between">
                              <span>Captain:</span>
                              <span className="text-slate-200 truncate max-w-[140px]">
                                {team.captain?.name || team.leader || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Assigned Lobby:</span>
                              {assignedLobbyName ? (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                                  {assignedLobbyName}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-800 text-[10px]">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingRosterTeam(team);
                              setRosterModalOpen(true);
                            }}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                          >
                            View Roster
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickToggleQualify(team._id)}
                            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isQual
                                ? 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{isQual ? 'Remove Qual' : 'Qualify Team'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREATE / EDIT STAGE */}
      {/* ======================================================== */}
      <Modal
        isOpen={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        title={editingStage ? 'Edit Tournament Stage' : 'Create New Stage / Round'}
      >
        <form onSubmit={handleSaveStage} className="p-5 space-y-4 font-mono">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Stage Name
            </label>
            <input
              type="text"
              required
              value={stageFormData.name}
              onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
              placeholder="e.g. Round 1, Semi Finals, Grand Finals"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Order / Sequence #
              </label>
              <input
                type="number"
                min="1"
                value={stageFormData.order}
                onChange={(e) => setStageFormData({ ...stageFormData, order: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Status
              </label>
              <select
                value={stageFormData.status}
                onChange={(e) => setStageFormData({ ...stageFormData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Grand Final Stage?</p>
              <p className="text-[10px] text-slate-400">Mark this stage as the tournament finale.</p>
            </div>
            <input
              type="checkbox"
              checked={stageFormData.isFinal}
              onChange={(e) => setStageFormData({ ...stageFormData, isFinal: e.target.checked })}
              className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStageModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Stage'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: CREATE / EDIT LOBBY */}
      {/* ======================================================== */}
      <Modal
        isOpen={lobbyModalOpen}
        onClose={() => setLobbyModalOpen(false)}
        title={editingLobby ? 'Edit Lobby' : `Create Lobby in ${activeStage?.name || 'Stage'}`}
      >
        <form onSubmit={handleSaveLobby} className="p-5 space-y-4 font-mono">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Lobby Name
            </label>
            <input
              type="text"
              required
              value={lobbyFormData.name}
              onChange={(e) => setLobbyFormData({ ...lobbyFormData, name: e.target.value })}
              placeholder="e.g. Lobby 1, Lobby A, Group 1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Team Capacity (Max Teams)
            </label>
            <input
              type="number"
              min="2"
              max="100"
              value={lobbyFormData.maxTeams}
              onChange={(e) => setLobbyFormData({ ...lobbyFormData, maxTeams: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">Default is 25 teams for Battle Royale lobbies.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setLobbyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Lobby'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: ASSIGN TEAMS TO LOBBY */}
      {/* ======================================================== */}
      <Modal
        isOpen={assignTeamsModalOpen}
        onClose={() => setAssignTeamsModalOpen(false)}
        title={`Assign Teams to ${targetLobbyForAssign?.name || 'Lobby'}`}
      >
        <div className="p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Select teams eligible for {activeStage?.name}:</span>
            <span className="text-cyan-400 font-bold">
              {selectedLobbyTeamIds.length} / {targetLobbyForAssign?.maxTeams || 25} Selected
            </span>
          </div>

          {eligibleStageTeams.length === 0 ? (
            <p className="text-xs text-amber-400 py-4 text-center">
              No eligible teams found in this stage. Advance teams or use "Override Stage Teams" to add teams.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {eligibleStageTeams.map((team) => {
                const isSelected = selectedLobbyTeamIds.includes(team._id);
                const isAlreadyInOtherLobby =
                  assignedTeamIdSet.has(team._id) && !isSelected;

                return (
                  <div
                    key={team._id}
                    onClick={() => handleToggleLobbyTeam(team._id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                        : isAlreadyInOtherLobby
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {team.teamName} {team.teamTag ? `[${team.teamTag}]` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          Captain: @{team.captain?.username || team.captain?.name || 'Player'}
                        </p>
                      </div>
                    </div>

                    {isAlreadyInOtherLobby && (
                      <span className="text-[9px] text-amber-400 uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                        In Another Lobby
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedLobbyTeamIds(eligibleStageTeams.map((t) => t._id))}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setSelectedLobbyTeamIds([])}
                className="text-[11px] text-slate-400 hover:underline"
              >
                Clear
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssignTeamsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveLobbyTeams}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: CREATE / EDIT MATCH WITH ROOM CREDENTIALS */}
      {/* ======================================================== */}
      <Modal
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        title={editingMatch ? 'Edit Match Fixture' : `Schedule Match for ${targetLobbyForMatch?.name || 'Lobby'}`}
      >
        <form onSubmit={handleSaveMatch} className="p-5 space-y-4 font-mono">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Match Title / Map
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={matchFormData.title}
                onChange={(e) => setMatchFormData({ ...matchFormData, title: e.target.value })}
                placeholder="e.g. Match 1 - Erangel"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <select
                value={matchFormData.map}
                onChange={(e) => setMatchFormData({ ...matchFormData, map: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Erangel">Erangel</option>
                <option value="Miramar">Miramar</option>
                <option value="Sanhok">Sanhok</option>
                <option value="Vikendi">Vikendi</option>
                <option value="Bermuda">Bermuda (Free Fire)</option>
                <option value="Purgatory">Purgatory (Free Fire)</option>
                <option value="Custom Map">Custom Map</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Match #
              </label>
              <input
                type="number"
                min="1"
                value={matchFormData.matchNumber}
                onChange={(e) => setMatchFormData({ ...matchFormData, matchNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={matchFormData.scheduledAt}
                onChange={(e) => setMatchFormData({ ...matchFormData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* ROOM CREDENTIALS SECTION */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Key className="w-4 h-4" />
              <span>Room Credentials (Private to Participants & Admin)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                  Room ID
                </label>
                <input
                  type="text"
                  value={matchFormData.roomId}
                  onChange={(e) => setMatchFormData({ ...matchFormData, roomId: e.target.value })}
                  placeholder="e.g. 8493021"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                  Room Password
                </label>
                <input
                  type="text"
                  value={matchFormData.roomPassword}
                  onChange={(e) => setMatchFormData({ ...matchFormData, roomPassword: e.target.value })}
                  placeholder="e.g. uem123"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Status
              </label>
              <select
                value={matchFormData.status}
                onChange={(e) => setMatchFormData({ ...matchFormData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">● Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Winner Team (Optional)
              </label>
              <select
                value={matchFormData.winner}
                onChange={(e) => setMatchFormData({ ...matchFormData, winner: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">None / Pending</option>
                {(targetLobbyForMatch?.teams || []).map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Live Stream URL (Optional)
            </label>
            <input
              type="url"
              value={matchFormData.streamUrl}
              onChange={(e) => setMatchFormData({ ...matchFormData, streamUrl: e.target.value })}
              placeholder="https://youtube.com/live/..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setMatchModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Match'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: MANUAL TEAM QUALIFICATION & ADVANCEMENT */}
      {/* ======================================================== */}
      <Modal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title={`Advance Qualifying Teams from ${activeStage?.name || 'Stage'}`}
      >
        <form onSubmit={handleSaveAdvanceTeams} className="p-5 space-y-4 font-mono">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300">
            <p className="font-bold">Manual Qualification Mode:</p>
            <p className="text-[11px] text-amber-200/80">
              Admin hand-picks qualifying teams. You can advance them into an existing stage or create a brand new stage/final.
            </p>
          </div>

          {/* Select Teams to Qualify */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-300">
              <span>Mark Qualifying Teams:</span>
              <span className="text-cyan-400 font-bold">
                {selectedAdvancingTeamIds.length} Teams Selected
              </span>
            </div>

            {/* Modal search and bulk buttons */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={advanceSearchTerm}
                  onChange={(e) => setAdvanceSearchTerm(e.target.value)}
                  placeholder="Filter teams..."
                  className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectAllAdvancing()}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllAdvancing}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold"
                >
                  Clear
                </button>
              </div>
            </div>

            {eligibleStageTeams.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No teams available in this stage.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {eligibleStageTeams
                  .filter((team) => {
                    if (!advanceSearchTerm.trim()) return true;
                    const q = advanceSearchTerm.toLowerCase();
                    return (
                      team.teamName?.toLowerCase().includes(q) ||
                      team.teamTag?.toLowerCase().includes(q)
                    );
                  })
                  .map((team) => {
                    const isChecked = selectedAdvancingTeamIds.includes(team._id);
                    return (
                      <div
                        key={team._id}
                        onClick={() => handleToggleAdvancingTeam(team._id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-950/60 border-amber-500/60 text-white'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-bold truncate">
                            {team.teamName} {team.teamTag ? `[${team.teamTag}]` : ''}
                          </span>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isChecked ? 'bg-amber-900/60 text-amber-300' : 'text-slate-500'
                        }`}>
                          {isChecked ? '✓ Qualified' : 'Not Selected'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Target Stage Selection */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-300">
              Where to advance these {selectedAdvancingTeamIds.length} teams?
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdvanceTargetType('new')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                  advanceTargetType === 'new'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                + Create New Stage
              </button>

              <button
                type="button"
                onClick={() => setAdvanceTargetType('existing')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                  advanceTargetType === 'existing'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Existing Stage
              </button>
            </div>

            {advanceTargetType === 'new' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  value={advanceNewStageName}
                  onChange={(e) => setAdvanceNewStageName(e.target.value)}
                  placeholder="e.g. Semi Finals, Grand Finals"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={advanceIsFinal}
                    onChange={(e) => setAdvanceIsFinal(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>Mark as Grand Finals?</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={advanceNextStageId}
                  onChange={(e) => setAdvanceNextStageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Select target stage...</option>
                  {(structure.stages || [])
                    .filter((s) => s._id !== activeStage?._id)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.isFinal ? '(Finals)' : ''}
                      </option>
                    ))}
                </select>

                {/* Merge vs Overwrite Mode */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Advance Mode:</span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <label className={`p-2 rounded-lg border text-[11px] cursor-pointer flex items-center gap-1.5 transition-all ${
                      advanceMode === 'append' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="advMode"
                        checked={advanceMode === 'append'}
                        onChange={() => setAdvanceMode('append')}
                        className="accent-cyan-500"
                      />
                      <span>Merge with existing</span>
                    </label>

                    <label className={`p-2 rounded-lg border text-[11px] cursor-pointer flex items-center gap-1.5 transition-all ${
                      advanceMode === 'replace' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="advMode"
                        checked={advanceMode === 'replace'}
                        onChange={() => setAdvanceMode('replace')}
                        className="accent-cyan-500"
                      />
                      <span>Replace target teams</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={async () => {
                await handleSaveCurrentQualifications();
                setAdvanceModalOpen(false);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              title="Save marked teams in current stage without advancing to next stage yet"
            >
              Save in Stage Only
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdvanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Advancing...' : 'Advance Teams'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 6: ADMIN OVERRIDE STAGE ELIGIBLE TEAMS */}
      {/* ======================================================== */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title={`Admin Override: Eligible Teams in ${activeStage?.name || 'Stage'}`}
      >
        <div className="p-5 space-y-4 font-mono">
          <p className="text-xs text-slate-400">
            Directly toggle which registered teams are permitted to participate in <strong>{activeStage?.name}</strong>.
            This gives the Admin manual authority to add wildcards, invites, or remove disqualified teams.
          </p>

          {/* Search and Bulk Selection in Override */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={overrideSearchTerm}
                onChange={(e) => setOverrideSearchTerm(e.target.value)}
                placeholder="Search registered teams..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectAllOverride(filteredOverrideTeams)}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAllOverride}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {filteredOverrideTeams.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No registered teams found.</p>
            ) : (
              filteredOverrideTeams.map((team) => {
                const isChecked = overrideTeamIds.includes(team._id);
                return (
                  <div
                    key={team._id}
                    onClick={() => handleToggleOverrideTeam(team._id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                        : 'bg-slate-950/80 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-600 bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold">{team.teamName}</span>
                        {team.teamTag && <span className="text-[10px] text-indigo-300 ml-1.5 font-mono">[{team.teamTag}]</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {isChecked ? 'Eligible' : 'Excluded'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-indigo-400 font-bold">
              {overrideTeamIds.length} Teams Eligible
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveOverrideTeams}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {submitting ? 'Applying...' : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 7: VIEW PLAYER ROSTER */}
      {/* ======================================================== */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={`Team Roster: ${viewingRosterTeam?.teamName || 'Team'}`}
      >
        <div className="p-5 space-y-4 font-mono">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h5 className="text-sm font-bold text-white">{viewingRosterTeam?.teamName}</h5>
              <p className="text-[10px] text-cyan-400">Code: {viewingRosterTeam?.teamCode || 'N/A'}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
              {viewingRosterTeam?.teamType || 'UEM Student Team'}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Players</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {(viewingRosterTeam?.players || []).map((slot, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">
                        {slot.user?.name || `Slot ${idx + 1}`}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        @{slot.user?.username || 'user'} • {slot.role || 'Player'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {slot.user?.studentId ? `ID: ${slot.user.studentId}` : slot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              onClick={() => setRosterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminMatches;
