import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Users,
  Key,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Check,
  RefreshCw,
  Copy,
  Crown,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckSquare,
  Square,
  Play,
  Radio,
  Award,
  Sliders,
  ExternalLink,
} from 'lucide-react';

const AdminMatches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTournament = searchParams.get('tournament') || '';
  const { addToast } = useToast();

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(queryTournament);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [structureLoading, setStructureLoading] = useState(false);
  const [showAllTournaments, setShowAllTournaments] = useState(false);

  // Tournament Data
  const [structure, setStructure] = useState({
    tournament: null,
    stages: [],
    lobbies: [],
    allRegistrations: [],
    matches: [],
  });

  // Active Lobby Selection
  const [activeLobbyId, setActiveLobbyId] = useState(null);
  const [lobbyTab, setLobbyTab] = useState('rounds'); // 'rounds' | 'standings'

  // Team Selection & Assignment State
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [targetLobbyToAssign, setTargetLobbyToAssign] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamFilterStatus, setTeamFilterStatus] = useState('all'); // 'all' | 'unassigned' | 'assigned'

  // Modals State
  const [createLobbyModalOpen, setCreateLobbyModalOpen] = useState(false);
  const [editingLobby, setEditingLobby] = useState(null);
  const [lobbyFormData, setLobbyFormData] = useState({
    name: '',
    maxTeams: 25,
    status: 'upcoming',
  });

  // Qualify Top Teams across side-by-side lobbies modal
  const [qualifyModalOpen, setQualifyModalOpen] = useState(false);
  const [qualifyLobbyName, setQualifyLobbyName] = useState('Finals Lobby');
  const [qualifyMaxTeams, setQualifyMaxTeams] = useState(16);
  const [selectedQualifyTeamIds, setSelectedQualifyTeamIds] = useState([]);

  // Round / Match Modal
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [roundFormData, setRoundFormData] = useState({
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

  // Quick Room Credentials Drawer / Inline editing
  const [quickCredsMatch, setQuickCredsMatch] = useState(null);
  const [quickRoomId, setQuickRoomId] = useState('');
  const [quickRoomPassword, setQuickRoomPassword] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Roster view modal
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Tournaments on load
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const res = await API.get('/tournaments');
      const list = res.data.tournaments || [];
      setTournaments(list);

      // If URL already had a specific tournament query param, select it
      if (queryTournament && list.some((t) => t._id === queryTournament)) {
        setSelectedTournamentId(queryTournament);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournaments list', 'error');
    } finally {
      setLoadingTournaments(false);
    }
  };

  // 2. Fetch structure when a tournament is selected
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
      fetchTournamentStructure(selectedTournamentId);
    } else {
      setSearchParams({});
    }
  }, [selectedTournamentId]);

  const fetchTournamentStructure = async (tournamentId) => {
    try {
      setStructureLoading(true);
      const res = await API.get(`/tournaments/${tournamentId}/stages-structure`);
      if (res.data.success) {
        setStructure(res.data);
        const lobbies = res.data.lobbies || [];
        if (lobbies.length > 0) {
          setActiveLobbyId((prev) => {
            const exists = lobbies.some((l) => l._id === prev);
            return exists ? prev : lobbies[0]._id;
          });
        } else {
          setActiveLobbyId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tournament structure:', err);
      addToast(err.response?.data?.message || 'Failed to load tournament data', 'error');
    } finally {
      setStructureLoading(false);
    }
  };

  // Filter tournaments: Only show running or upcoming tournaments by default
  const filteredTournaments = useMemo(() => {
    if (showAllTournaments) return tournaments;
    return tournaments.filter((t) =>
      ['live', 'ongoing', 'upcoming', 'registration-open'].includes(t.status)
    );
  }, [tournaments, showAllTournaments]);

  // Current selected tournament object
  const selectedTournament = useMemo(() => {
    if (!selectedTournamentId) return null;
    return tournaments.find((t) => t._id === selectedTournamentId) || structure.tournament || null;
  }, [tournaments, selectedTournamentId, structure.tournament]);

  // Unified list of all lobbies in this tournament
  const allLobbies = useMemo(() => {
    if (structure.lobbies && structure.lobbies.length > 0) {
      return structure.lobbies;
    }
    // Fallback extraction from stages
    const result = [];
    (structure.stages || []).forEach((stage) => {
      (stage.lobbies || []).forEach((l) => {
        result.push({
          _id: l._id,
          stageId: stage._id,
          stageName: stage.name,
          name: l.name,
          maxTeams: l.maxTeams || 25,
          status: l.status || 'upcoming',
          order: l.order || 1,
          teams: l.teams || [],
        });
      });
    });
    return result;
  }, [structure.lobbies, structure.stages]);

  // Active Lobby object
  const activeLobby = useMemo(() => {
    return allLobbies.find((l) => l._id === activeLobbyId) || allLobbies[0] || null;
  }, [allLobbies, activeLobbyId]);

  // Mapping of teamId -> Lobby Name
  const teamLobbyMap = useMemo(() => {
    const map = {};
    allLobbies.forEach((lobby) => {
      (lobby.teams || []).forEach((t) => {
        const id = t._id ? t._id.toString() : t.toString();
        map[id] = { lobbyId: lobby._id, lobbyName: lobby.name };
      });
    });
    return map;
  }, [allLobbies]);

  // Registered teams enriched with assignment status
  const registeredTeams = useMemo(() => {
    const list = structure.allRegistrations || [];
    return list.map((team) => {
      const id = team._id.toString();
      const assignment = teamLobbyMap[id];
      return {
        ...team,
        assignedLobbyId: assignment ? assignment.lobbyId : null,
        assignedLobbyName: assignment ? assignment.lobbyName : null,
      };
    });
  }, [structure.allRegistrations, teamLobbyMap]);

  // Filtered registered teams according to search & assignment status
  const displayedTeams = useMemo(() => {
    return registeredTeams.filter((team) => {
      const matchesSearch =
        team.teamName?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
        team.teamTag?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
        team.captain?.name?.toLowerCase().includes(teamSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (teamFilterStatus === 'unassigned') return !team.assignedLobbyId;
      if (teamFilterStatus === 'assigned') return Boolean(team.assignedLobbyId);
      return true;
    });
  }, [registeredTeams, teamSearchQuery, teamFilterStatus]);

  // Matches grouped by Lobby
  const matchesByLobby = useMemo(() => {
    const map = {};
    (structure.matches || []).forEach((m) => {
      const lid = m.lobbyId?.toString() || 'unassigned';
      if (!map[lid]) map[lid] = [];
      map[lid].push(m);
    });
    return map;
  }, [structure.matches]);

  const activeLobbyMatches = useMemo(() => {
    if (!activeLobby) return [];
    return matchesByLobby[activeLobby._id.toString()] || [];
  }, [activeLobby, matchesByLobby]);

  // Standings / Points Table for a given lobby
  const computeLobbyStandings = (lobbyId) => {
    const targetLobby = allLobbies.find((l) => l._id.toString() === lobbyId.toString());
    if (!targetLobby) return [];

    const lobbyMatches = matchesByLobby[lobbyId.toString()] || [];
    const completedMatches = lobbyMatches.filter((m) => m.status === 'completed');

    const pointsMap = {};
    (targetLobby.teams || []).forEach((t) => {
      const tid = t._id ? t._id.toString() : t.toString();
      const fullTeam = registeredTeams.find((rt) => rt._id.toString() === tid) || t;
      pointsMap[tid] = {
        teamId: tid,
        teamName: fullTeam.teamName || 'Unknown Team',
        teamTag: fullTeam.teamTag || '',
        captain: fullTeam.captain?.name || '',
        matchesPlayed: 0,
        wins: 0,
        kills: 0,
        placementPoints: 0,
        totalPoints: 0,
      };
    });

    completedMatches.forEach((m) => {
      if (m.winner) {
        const wid = m.winner._id ? m.winner._id.toString() : m.winner.toString();
        if (pointsMap[wid]) {
          pointsMap[wid].wins += 1;
          pointsMap[wid].placementPoints += 15; // standard 1st place
          pointsMap[wid].totalPoints += 15;
        }
      }
      (m.teams || []).forEach((tm) => {
        const tid = tm._id ? tm._id.toString() : tm.toString();
        if (pointsMap[tid]) {
          pointsMap[tid].matchesPlayed += 1;
        }
      });
    });

    return Object.values(pointsMap).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const activeLobbyStandings = useMemo(() => {
    if (!activeLobby) return [];
    return computeLobbyStandings(activeLobby._id);
  }, [activeLobby, matchesByLobby, registeredTeams]);

  // ==========================================
  // SELECTION HELPERS FOR REGISTERED TEAMS
  // ==========================================
  const toggleTeamSelection = (teamId) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const selectAllUnassigned = () => {
    const unassignedIds = registeredTeams
      .filter((t) => !t.assignedLobbyId)
      .map((t) => t._id.toString());
    setSelectedTeamIds(unassignedIds);
    addToast(`Selected all ${unassignedIds.length} unassigned teams`, 'info');
  };

  const selectCountUnassigned = (count) => {
    const unassignedIds = registeredTeams
      .filter((t) => !t.assignedLobbyId)
      .slice(0, count)
      .map((t) => t._id.toString());
    setSelectedTeamIds(unassignedIds);
    addToast(`Selected first ${unassignedIds.length} unassigned teams`, 'info');
  };

  const clearTeamSelection = () => {
    setSelectedTeamIds([]);
  };

  // ==========================================
  // LOBBY ACTIONS
  // ==========================================
  const handleOpenCreateLobby = () => {
    setEditingLobby(null);
    setLobbyFormData({
      name: `Lobby ${allLobbies.length + 1}`,
      maxTeams: 25,
      status: 'upcoming',
    });
    setCreateLobbyModalOpen(true);
  };

  const handleOpenEditLobby = (lobby) => {
    setEditingLobby(lobby);
    setLobbyFormData({
      name: lobby.name,
      maxTeams: lobby.maxTeams || 25,
      status: lobby.status || 'upcoming',
    });
    setCreateLobbyModalOpen(true);
  };

  const handleSaveLobby = async (e) => {
    e.preventDefault();
    if (!lobbyFormData.name.trim()) {
      addToast('Lobby name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingLobby) {
        await API.put(`/tournaments/${selectedTournamentId}/lobbies/${editingLobby._id}`, {
          name: lobbyFormData.name,
          maxTeams: Number(lobbyFormData.maxTeams),
          status: lobbyFormData.status,
        });
        addToast(`Lobby "${lobbyFormData.name}" updated`, 'success');
      } else {
        const res = await API.post(`/tournaments/${selectedTournamentId}/lobbies`, {
          name: lobbyFormData.name,
          maxTeams: Number(lobbyFormData.maxTeams),
          status: lobbyFormData.status,
          teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : [],
        });
        addToast(
          selectedTeamIds.length > 0
            ? `Created "${lobbyFormData.name}" and assigned ${selectedTeamIds.length} selected teams!`
            : `Lobby "${lobbyFormData.name}" created`,
          'success'
        );
        if (selectedTeamIds.length > 0) {
          setSelectedTeamIds([]);
        }
        if (res.data?.lobby?._id) {
          setActiveLobbyId(res.data.lobby._id);
        }
      }

      setCreateLobbyModalOpen(false);
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save lobby', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLobby = async (lobby) => {
    if (!window.confirm(`Are you sure you want to delete "${lobby.name}" and its scheduled rounds?`)) {
      return;
    }

    try {
      await API.delete(`/tournaments/${selectedTournamentId}/lobbies/${lobby._id}`);
      addToast(`Lobby "${lobby.name}" deleted`, 'success');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to delete lobby', 'error');
    }
  };

  // Quick toggle status for a lobby
  const handleToggleLobbyStatus = async (lobby) => {
    const newStatus = lobby.status === 'running' ? 'upcoming' : 'running';
    try {
      await API.put(`/tournaments/${selectedTournamentId}/lobbies/${lobby._id}`, {
        status: newStatus,
      });
      addToast(`Lobby status set to ${newStatus.toUpperCase()}`, 'success');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast('Failed to toggle lobby status', 'error');
    }
  };

  // Assign selected teams to a target lobby
  const handleAssignSelectedToLobby = async (targetLobbyId) => {
    if (!targetLobbyId) {
      addToast('Please select a target lobby', 'warning');
      return;
    }
    if (selectedTeamIds.length === 0) {
      addToast('Please select at least one team to assign', 'warning');
      return;
    }

    const targetLobby = allLobbies.find((l) => l._id.toString() === targetLobbyId.toString());
    if (!targetLobby) return;

    try {
      setSubmitting(true);
      await API.post(`/tournaments/${selectedTournamentId}/lobbies/${targetLobbyId}/assign-teams`, {
        teamIds: selectedTeamIds,
        mode: 'append',
      });
      addToast(`Assigned ${selectedTeamIds.length} teams to ${targetLobby.name}`, 'success');
      setSelectedTeamIds([]);
      setTargetLobbyToAssign('');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to assign teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove a single team from a lobby
  const handleRemoveTeamFromLobby = async (lobby, teamId) => {
    const updatedTeamIds = (lobby.teams || [])
      .map((t) => (t._id ? t._id.toString() : t.toString()))
      .filter((id) => id !== teamId.toString());

    try {
      await API.post(`/tournaments/${selectedTournamentId}/lobbies/${lobby._id}/assign-teams`, {
        teamIds: updatedTeamIds,
        mode: 'set',
      });
      addToast('Team removed from lobby', 'info');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast('Failed to remove team', 'error');
    }
  };

  // ==========================================
  // SIDE-BY-SIDE LOBBIES TOP TEAMS QUALIFICATION
  // ==========================================
  const handleOpenQualifyModal = () => {
    setQualifyLobbyName('Finals Lobby');
    setQualifyMaxTeams(16);
    setSelectedQualifyTeamIds([]);
    setQualifyModalOpen(true);
  };

  const toggleQualifyTeam = (teamId) => {
    setSelectedQualifyTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const selectTopNFromLobby = (lobbyId, topCount) => {
    const standings = computeLobbyStandings(lobbyId);
    const topIds = standings.slice(0, topCount).map((s) => s.teamId);
    setSelectedQualifyTeamIds((prev) => {
      const combined = new Set([...prev, ...topIds]);
      return Array.from(combined);
    });
    addToast(`Selected Top ${Math.min(topCount, standings.length)} teams from lobby`, 'info');
  };

  const handleCreateLobbyFromTopTeams = async (e) => {
    e.preventDefault();
    if (!qualifyLobbyName.trim()) {
      addToast('Please enter a name for the new lobby', 'error');
      return;
    }
    if (selectedQualifyTeamIds.length === 0) {
      addToast('Please select at least one team to qualify for the new lobby', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post(`/tournaments/${selectedTournamentId}/lobbies/create-from-teams`, {
        name: qualifyLobbyName.trim(),
        maxTeams: Number(qualifyMaxTeams),
        selectedTeamIds: selectedQualifyTeamIds,
      });
      addToast(
        `Successfully created "${qualifyLobbyName}" with ${selectedQualifyTeamIds.length} qualified teams!`,
        'success'
      );
      setQualifyModalOpen(false);
      if (res.data?.lobby?._id) {
        setActiveLobbyId(res.data.lobby._id);
      }
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to create lobby with qualified teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ROUNDS & MATCHES MANAGEMENT
  // ==========================================
  const handleOpenCreateRound = () => {
    if (!activeLobby) {
      addToast('Please create or select a lobby first', 'warning');
      return;
    }
    const nextRoundNumber = activeLobbyMatches.length + 1;
    setEditingRound(null);
    setRoundFormData({
      title: `Round ${nextRoundNumber}`,
      map: 'Erangel',
      matchNumber: nextRoundNumber,
      scheduledAt: new Date().toISOString().slice(0, 16),
      status: 'scheduled',
      roomId: '',
      roomPassword: '',
      streamUrl: '',
      notes: '',
      winner: '',
    });
    setRoundModalOpen(true);
  };

  const handleOpenEditRound = (match) => {
    setEditingRound(match);
    setRoundFormData({
      title: match.title || `Round ${match.matchNumber}`,
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
    setRoundModalOpen(true);
  };

  const handleSaveRound = async (e) => {
    e.preventDefault();
    if (!activeLobby) return;

    try {
      setSubmitting(true);
      const hasCreds = Boolean(
        roundFormData.roomId?.trim() && roundFormData.roomPassword?.trim()
      );

      if (editingRound) {
        await API.put(`/tournaments/${selectedTournamentId}/matches/${editingRound._id}`, {
          title: roundFormData.title,
          map: roundFormData.map,
          matchNumber: Number(roundFormData.matchNumber),
          scheduledAt: roundFormData.scheduledAt,
          status: hasCreds && roundFormData.status === 'scheduled' ? 'live' : roundFormData.status,
          roomId: roundFormData.roomId,
          roomPassword: roundFormData.roomPassword,
          streamUrl: roundFormData.streamUrl,
          notes: roundFormData.notes,
          winner: roundFormData.winner || null,
        });
        addToast(
          hasCreds
            ? 'Round credentials saved! Round & Lobby are now RUNNING.'
            : 'Round updated successfully',
          'success'
        );
      } else {
        await API.post(
          `/tournaments/${selectedTournamentId}/lobbies/${activeLobby._id}/matches`,
          {
            title: roundFormData.title,
            map: roundFormData.map,
            matchNumber: Number(roundFormData.matchNumber),
            scheduledAt: roundFormData.scheduledAt,
            status: hasCreds ? 'live' : roundFormData.status,
            roomId: roundFormData.roomId,
            roomPassword: roundFormData.roomPassword,
            streamUrl: roundFormData.streamUrl,
            notes: roundFormData.notes,
          }
        );
        addToast(
          hasCreds
            ? `${roundFormData.title} scheduled with credentials! Round & Lobby are now RUNNING.`
            : `${roundFormData.title} scheduled for ${activeLobby.name}`,
          'success'
        );
      }

      setRoundModalOpen(false);
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save round', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRound = async (match) => {
    if (!window.confirm(`Delete ${match.title || `Match ${match.matchNumber}`}?`)) return;
    try {
      await API.delete(`/tournaments/${selectedTournamentId}/matches/${match._id}`);
      addToast('Round deleted', 'info');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast('Failed to delete round', 'error');
    }
  };

  // Quick Room ID & Password update directly from round card
  const handleOpenQuickCreds = (match) => {
    setQuickCredsMatch(match);
    setQuickRoomId(match.roomId || '');
    setQuickRoomPassword(match.roomPassword || '');
  };

  const handleSaveQuickCreds = async () => {
    if (!quickCredsMatch) return;
    try {
      setSubmitting(true);
      await API.put(`/tournaments/${selectedTournamentId}/matches/${quickCredsMatch._id}`, {
        roomId: quickRoomId.trim(),
        roomPassword: quickRoomPassword.trim(),
      });
      addToast(
        'Room ID & Password saved! Lobby and Round automatically switched to RUNNING status.',
        'success'
      );
      setQuickCredsMatch(null);
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast('Failed to save room credentials', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label = 'Copied') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'info');
  };

  // ==========================================
  // VIEW 1: TOURNAMENT SELECTION SCREEN
  // ==========================================
  if (!selectedTournamentId) {
    return (
      <div className="min-h-screen pb-16">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 p-8 shadow-2xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Swords className="w-3.5 h-3.5" />
                Tournament Operations Control Center
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-wide font-gaming">
                MATCHES & LOBBY MANAGEMENT
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Select an active running tournament or upcoming tournament below to manage its
                registered teams, lobby allocations, match rounds, and room credentials.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAllTournaments(!showAllTournaments)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all border ${
                  showAllTournaments
                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {showAllTournaments ? 'Showing All Tournaments' : 'Showing Running & Upcoming'}
              </button>

              <button
                onClick={fetchTournaments}
                className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Refresh Tournaments"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tournaments List */}
        {loadingTournaments ? (
          <div className="flex justify-center items-center py-24">
            <Loading size="lg" message="Loading running and upcoming tournaments..." />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active or Upcoming Tournaments</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              There are currently no tournaments with running or upcoming status. You can create a
              new tournament or toggle to view past tournaments.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowAllTournaments(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition"
              >
                View Past Tournaments
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => {
              const isLive = t.status === 'live' || t.status === 'ongoing';
              const teamCount = t.registeredTeams?.length || 0;

              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTournamentId(t._id)}
                  className="group relative cursor-pointer rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/80 hover:border-cyan-500/80 transition-all duration-300 p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 group-hover:bg-cyan-500/10 rounded-full blur-2xl transition-all" />

                  <div>
                    {/* Status & Game Header */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-purple-300">
                        {t.game || 'Esports'}
                      </span>

                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <Radio className="w-3.5 h-3.5" />
                          RUNNING NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          UPCOMING
                        </span>
                      )}
                    </div>

                    {/* Tournament Name */}
                    <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors line-clamp-2 mb-3">
                      {t.name}
                    </h3>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Registered Teams</span>
                        <span className="text-white font-bold text-sm">
                          {teamCount} <span className="text-slate-500">/ {t.maxTeams || '∞'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Start Date</span>
                        <span className="text-slate-300 font-medium">
                          {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Open Manager CTA Button */}
                  <div className="pt-4 flex items-center justify-between text-cyan-400 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    <span>Manage Lobbies & Rounds</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TOURNAMENT LOBBY & MATCH DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen pb-20 space-y-8">
      {/* Top Breadcrumb & Tournament Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedTournamentId('')}
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournaments
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white font-gaming tracking-wide">
                {selectedTournament?.name || 'Tournament Manager'}
              </h1>
              <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-900/40 border border-purple-500/30 text-purple-300">
                {selectedTournament?.game || 'Esports'}
              </span>
              {selectedTournament?.status === 'live' || selectedTournament?.status === 'ongoing' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  ● Live
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Upcoming
                </span>
              )}
            </div>
          </div>

          {/* Quick tournament switcher & refresh */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.game})
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchTournamentStructure(selectedTournamentId)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${structureLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tournament Fast Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-center">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-500 block mb-1">Registered Teams</span>
            <span className="text-xl font-black text-white">{registeredTeams.length}</span>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-500 block mb-1">Total Lobbies</span>
            <span className="text-xl font-black text-cyan-400">{allLobbies.length}</span>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-500 block mb-1">Scheduled Rounds</span>
            <span className="text-xl font-black text-purple-400">
              {structure.matches?.length || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-500 block mb-1">Running Lobbies</span>
            <span className="text-xl font-black text-emerald-400">
              {allLobbies.filter((l) => l.status === 'running').length}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: REGISTERED TEAMS ROSTER (CARD FORMAT IN ROWS: 2, 3, OR 4 CARDS) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black text-white font-gaming tracking-wide">
                REGISTERED TEAMS ({registeredTeams.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select teams below to assign them into a lobby (e.g., select first 10 teams for Lobby
              1, then select remaining 10 teams for Lobby 2).
            </p>
          </div>

          {/* Quick Selection Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={selectAllUnassigned}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Select All Unassigned
            </button>
            <button
              onClick={() => selectCountUnassigned(10)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800/50 transition"
            >
              Select 10 Unassigned
            </button>
            <button
              onClick={() => selectCountUnassigned(16)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/60 text-purple-400 border border-purple-800/50 transition"
            >
              Select 16 Unassigned
            </button>
            {selectedTeamIds.length > 0 && (
              <button
                onClick={clearTeamSelection}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 transition"
              >
                Clear ({selectedTeamIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search team name, tag, or captain..."
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={teamFilterStatus}
              onChange={(e) => setTeamFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 font-medium"
            >
              <option value="all">All Teams ({registeredTeams.length})</option>
              <option value="unassigned">
                Unassigned Only ({registeredTeams.filter((t) => !t.assignedLobbyId).length})
              </option>
              <option value="assigned">
                Assigned to Lobby ({registeredTeams.filter((t) => t.assignedLobbyId).length})
              </option>
            </select>
          </div>
        </div>

        {/* Floating Bulk Action Bar (when 1 or more teams are selected) */}
        {selectedTeamIds.length > 0 && (
          <div className="sticky top-4 z-20 bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-purple-950/90 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-black text-sm">
                {selectedTeamIds.length}
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Teams Selected for Lobby</h4>
                <p className="text-xs text-cyan-300">
                  Assign these teams to an existing lobby or create a new lobby for them.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {allLobbies.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={targetLobbyToAssign}
                    onChange={(e) => setTargetLobbyToAssign(e.target.value)}
                    className="bg-slate-900 border border-cyan-500/40 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400 font-semibold"
                  >
                    <option value="">Choose Target Lobby...</option>
                    {allLobbies.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name} ({l.teams?.length || 0} / {l.maxTeams} Teams)
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={!targetLobbyToAssign || submitting}
                    onClick={() => handleAssignSelectedToLobby(targetLobbyToAssign)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-cyan-500/20 disabled:opacity-50 transition"
                  >
                    Move to Lobby
                  </button>
                </div>
              )}

              <button
                onClick={handleOpenCreateLobby}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                + Move to New Lobby
              </button>

              <button
                onClick={clearTeamSelection}
                className="p-2 text-slate-400 hover:text-white transition"
                title="Cancel selection"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Registered Teams Grid: 2, 3, or 4 cards per row */}
        {displayedTeams.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No registered teams found matching your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
            {displayedTeams.map((team) => {
              const isSelected = selectedTeamIds.includes(team._id.toString());
              const isAssigned = Boolean(team.assignedLobbyId);

              return (
                <div
                  key={team._id}
                  onClick={() => toggleTeamSelection(team._id.toString())}
                  className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer border select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                      : isAssigned
                      ? 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                      : 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  <div>
                    {/* Header: Checkbox & Lobby Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                              : 'border-slate-600 bg-slate-900 group-hover:border-cyan-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {team.teamTag && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                            [{team.teamTag}]
                          </span>
                        )}
                      </div>

                      {/* Assignment Badge */}
                      {isAssigned ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 truncate max-w-[120px]">
                          ● {team.assignedLobbyName}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          ○ Unassigned
                        </span>
                      )}
                    </div>

                    {/* Team Name */}
                    <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                      {team.teamName}
                    </h4>

                    {/* Captain & Info */}
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      <span className="text-slate-500">Captain:</span>{' '}
                      {team.captain?.name || team.leader || 'N/A'}
                    </p>
                  </div>

                  {/* Footer info: Player count & Quick Roster view */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{team.players?.length || 1} Players</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTeam(team);
                        setRosterModalOpen(true);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      View Roster
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: LOBBY-FIRST TOURNAMENT MANAGEMENT */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Lobbies Hub Controls & Tabs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-black text-white font-gaming tracking-wide">
                  TOURNAMENT LOBBIES ({allLobbies.length})
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lobbies host your match rounds (Round 1, Round 2...). When room credentials are
                provided, the lobby automatically updates to Running.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {allLobbies.length > 1 && (
                <button
                  onClick={handleOpenQualifyModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Qualify Top Teams to New Lobby
                </button>
              )}

              <button
                onClick={handleOpenCreateLobby}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                + Create Lobby
              </button>
            </div>
          </div>

          {/* Lobby Selection Tabs */}
          {allLobbies.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-800">
              <Crown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-white font-bold text-sm mb-1">No Lobbies Created Yet</h4>
              <p className="text-slate-400 text-xs mb-4">
                Create Lobby 1 to begin allocating teams and running matches.
              </p>
              <button
                onClick={handleOpenCreateLobby}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                + Create First Lobby
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {allLobbies.map((lobby) => {
                const isSelected = activeLobbyId === lobby._id;
                const isRunning = lobby.status === 'running';

                return (
                  <button
                    key={lobby._id}
                    onClick={() => setActiveLobbyId(lobby._id)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-gaming text-xs tracking-wider transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-800 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/70 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm">{lobby.name}</span>

                    {/* Status badge: Only upcoming or running */}
                    {isRunning ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        ● Running
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-700 text-slate-300">
                        Upcoming
                      </span>
                    )}

                    {/* Teams capacity count */}
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-400 font-mono text-[10px]">
                      {lobby.teams?.length || 0}/{lobby.maxTeams} Teams
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Lobby Details & Controls */}
        {activeLobby && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Lobby Top Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-black text-white font-gaming">{activeLobby.name}</h3>

                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleLobbyStatus(activeLobby)}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition ${
                    activeLobby.status === 'running'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                  }`}
                  title="Click to toggle status between Upcoming and Running"
                >
                  {activeLobby.status === 'running' ? '● Status: RUNNING' : 'Status: UPCOMING'}
                </button>

                <span className="text-xs text-slate-400">
                  Capacity: <strong className="text-white">{activeLobby.teams?.length || 0}</strong>{' '}
                  / {activeLobby.maxTeams} Teams
                </span>
              </div>

              {/* Lobby Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditLobby(activeLobby)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Lobby
                </button>

                <button
                  onClick={() => handleDeleteLobby(activeLobby)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition"
                  title="Delete Lobby"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Rounds & Matches vs Points Table */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setLobbyTab('rounds')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  lobbyTab === 'rounds'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Rounds & Matches ({activeLobbyMatches.length})
              </button>

              <button
                onClick={() => setLobbyTab('standings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  lobbyTab === 'standings'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Lobby Points Table & Teams ({activeLobby.teams?.length || 0})
              </button>
            </div>

            {/* SUB-TAB 1: ROUNDS & MATCHES */}
            {lobbyTab === 'rounds' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Scheduled Match Rounds</h4>
                    <p className="text-xs text-slate-400">
                      Rounds run inside this lobby. Adding Room ID & Password automatically sets
                      status to Running!
                    </p>
                  </div>

                  <button
                    onClick={handleOpenCreateRound}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Schedule Round
                  </button>
                </div>

                {activeLobbyMatches.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800/80">
                    <Swords className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-3">
                      No rounds scheduled in {activeLobby.name} yet.
                    </p>
                    <button
                      onClick={handleOpenCreateRound}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold uppercase"
                    >
                      + Schedule Round 1
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLobbyMatches.map((match) => {
                      const isLive = match.status === 'live';
                      const isCompleted = match.status === 'completed';
                      const hasCreds = Boolean(match.roomId && match.roomPassword);

                      return (
                        <div
                          key={match._id}
                          className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
                        >
                          <div>
                            {/* Round Title & Status */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-mono font-bold text-cyan-400">
                                Match #{match.matchNumber}
                              </span>

                              {isLive ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                                  ● LIVE / RUNNING
                                </span>
                              ) : isCompleted ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  Completed
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-700 text-slate-300">
                                  Scheduled
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-black text-white">
                              {match.title || `Round ${match.matchNumber}`}
                            </h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                              <span>Map: <strong className="text-slate-200">{match.map}</strong></span>
                              <span>•</span>
                              <span>
                                {match.scheduledAt
                                  ? new Date(match.scheduledAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Time TBD'}
                              </span>
                            </div>

                            {/* Winner if completed */}
                            {match.winner && (
                              <div className="mt-3 px-3 py-1.5 bg-purple-950/40 border border-purple-500/30 rounded-lg text-xs text-purple-300 flex items-center gap-2">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Winner: <strong>{match.winner.teamName || 'Team'}</strong></span>
                              </div>
                            )}

                            {/* Room Credentials Box */}
                            <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                                  Room Credentials
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickCreds(match)}
                                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold"
                                >
                                  {hasCreds ? 'Edit Credentials' : '+ Enter Room ID & Password'}
                                </button>
                              </div>

                              {hasCreds ? (
                                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                                  <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 flex items-center justify-between">
                                    <span className="text-slate-400 text-[10px]">ID:</span>
                                    <span className="text-white font-bold">{match.roomId}</span>
                                    <button
                                      onClick={() => copyToClipboard(match.roomId, 'Room ID')}
                                      className="text-slate-400 hover:text-cyan-400"
                                      title="Copy Room ID"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60 flex items-center justify-between">
                                    <span className="text-slate-400 text-[10px]">PASS:</span>
                                    <span className="text-white font-bold">
                                      {showPasswordMap[match._id] ? match.roomPassword : '••••••'}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setShowPasswordMap((prev) => ({
                                          ...prev,
                                          [match._id]: !prev[match._id],
                                        }))
                                      }
                                      className="text-slate-400 hover:text-cyan-400"
                                    >
                                      {showPasswordMap[match._id] ? (
                                        <EyeOff className="w-3 h-3" />
                                      ) : (
                                        <Eye className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500 italic">
                                  Room ID & Password not provided yet. Click above to provide them.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Round Card Actions */}
                          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditRound(match)}
                                className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition"
                              >
                                Edit Round
                              </button>
                            </div>

                            <button
                              onClick={() => handleDeleteRound(match)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                              title="Delete Round"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: LOBBY STANDINGS & TEAMS */}
            {lobbyTab === 'standings' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Teams in {activeLobby.name} ({activeLobby.teams?.length || 0})
                    </h4>
                    <p className="text-xs text-slate-400">
                      Standings and points calculated from completed rounds in this lobby.
                    </p>
                  </div>
                </div>

                {activeLobby.teams?.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No teams assigned to this lobby yet. Select teams from the Registered Teams section above.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">Team</th>
                          <th className="p-3">Captain</th>
                          <th className="p-3 text-center">Rounds Played</th>
                          <th className="p-3 text-center">Wins</th>
                          <th className="p-3 text-center">Total Points</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-medium">
                        {activeLobbyStandings.map((team, idx) => (
                          <tr key={team.teamId} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-cyan-400">#{idx + 1}</td>
                            <td className="p-3">
                              <span className="text-white font-bold block">{team.teamName}</span>
                              {team.teamTag && (
                                <span className="text-[10px] text-slate-400">[{team.teamTag}]</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400">{team.captain || 'N/A'}</td>
                            <td className="p-3 text-center font-mono">{team.matchesPlayed}</td>
                            <td className="p-3 text-center font-mono text-amber-400 font-bold">
                              {team.wins}
                            </td>
                            <td className="p-3 text-center font-mono text-emerald-400 font-bold text-sm">
                              {team.totalPoints}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveTeamFromLobby(activeLobby, team.teamId)}
                                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                                title="Remove team from this lobby"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT LOBBY (Simplified: Name, Max Teams, Status) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createLobbyModalOpen}
        onClose={() => setCreateLobbyModalOpen(false)}
        title={editingLobby ? `Edit ${editingLobby.name}` : 'Create New Lobby'}
      >
        <form onSubmit={handleSaveLobby} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Lobby Name *
            </label>
            <input
              type="text"
              required
              value={lobbyFormData.name}
              onChange={(e) => setLobbyFormData({ ...lobbyFormData, name: e.target.value })}
              placeholder="e.g. Lobby 1, Lobby 2, Finals Lobby"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Maximum Teams
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={lobbyFormData.maxTeams}
                onChange={(e) =>
                  setLobbyFormData({ ...lobbyFormData, maxTeams: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Lobby Status
              </label>
              <select
                value={lobbyFormData.status}
                onChange={(e) => setLobbyFormData({ ...lobbyFormData, status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="upcoming">Upcoming Lobby</option>
                <option value="running">Running Lobby</option>
              </select>
            </div>
          </div>

          {!editingLobby && selectedTeamIds.length > 0 && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
              <strong>{selectedTeamIds.length} teams</strong> currently selected in the roster will
              be automatically assigned to this new lobby!
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateLobbyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingLobby ? 'Save Changes' : 'Create Lobby'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: SIDE-BY-SIDE LOBBIES TOP TEAMS QUALIFICATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={qualifyModalOpen}
        onClose={() => setQualifyModalOpen(false)}
        title="Qualify Top Teams into a New Lobby (e.g. Finals)"
        size="xl"
      >
        <form onSubmit={handleCreateLobbyFromTopTeams} className="space-y-6">
          {/* Header configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                New Lobby Name *
              </label>
              <input
                type="text"
                required
                value={qualifyLobbyName}
                onChange={(e) => setQualifyLobbyName(e.target.value)}
                placeholder="e.g. Finals Lobby, Grand Finale"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={qualifyMaxTeams}
                onChange={(e) => setQualifyMaxTeams(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Select top qualifying teams from each lobby column below. The selected teams will be merged into your new lobby:
          </p>

          {/* Side-by-side Lobby Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-1">
            {allLobbies.map((lobby) => {
              const standings = computeLobbyStandings(lobby._id);

              return (
                <div
                  key={lobby._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{lobby.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {standings.length} Teams
                        </span>
                      </div>

                      {/* Quick Select Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => selectTopNFromLobby(lobby._id, 4)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                        >
                          Top 4
                        </button>
                        <button
                          type="button"
                          onClick={() => selectTopNFromLobby(lobby._id, 8)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700"
                        >
                          Top 8
                        </button>
                      </div>
                    </div>

                    {/* Teams in Column */}
                    {standings.length === 0 ? (
                      <p className="text-slate-500 text-xs py-4 text-center">No teams in lobby</p>
                    ) : (
                      <div className="space-y-1.5">
                        {standings.map((st, idx) => {
                          const isChecked = selectedQualifyTeamIds.includes(st.teamId);

                          return (
                            <div
                              key={st.teamId}
                              onClick={() => toggleQualifyTeam(st.teamId)}
                              className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                isChecked
                                  ? 'bg-cyan-950/40 border-cyan-500 text-white'
                                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-[10px] text-slate-500">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold truncate">{st.teamName}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-emerald-400">
                                  {st.totalPoints} pts
                                </span>
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    isChecked
                                      ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                                      : 'border-slate-600 bg-slate-900'
                                  }`}
                                >
                                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
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

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-cyan-400 font-bold">
              Total Teams Selected: {selectedQualifyTeamIds.length}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQualifyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedQualifyTeamIds.length === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {submitting
                  ? 'Creating...'
                  : `Create "${qualifyLobbyName}" with ${selectedQualifyTeamIds.length} Teams`}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: SCHEDULE / EDIT ROUND */}
      {/* ========================================================================= */}
      <Modal
        isOpen={roundModalOpen}
        onClose={() => setRoundModalOpen(false)}
        title={editingRound ? `Edit ${editingRound.title || 'Round'}` : 'Schedule New Round'}
      >
        <form onSubmit={handleSaveRound} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Round Title *
              </label>
              <input
                type="text"
                required
                value={roundFormData.title}
                onChange={(e) => setRoundFormData({ ...roundFormData, title: e.target.value })}
                placeholder="e.g. Round 1, Round 2"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Map
              </label>
              <input
                type="text"
                value={roundFormData.map}
                onChange={(e) => setRoundFormData({ ...roundFormData, map: e.target.value })}
                placeholder="e.g. Erangel, Miramar"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={roundFormData.scheduledAt}
                onChange={(e) =>
                  setRoundFormData({ ...roundFormData, scheduledAt: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Match Status
              </label>
              <select
                value={roundFormData.status}
                onChange={(e) => setRoundFormData({ ...roundFormData, status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live / Running</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Room ID & Password */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Live Room Credentials (Optional)
            </h5>
            <p className="text-[11px] text-slate-400">
              When Room ID and Password are provided, this round and its lobby will automatically
              switch to Running!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Room ID</label>
                <input
                  type="text"
                  value={roundFormData.roomId}
                  onChange={(e) => setRoundFormData({ ...roundFormData, roomId: e.target.value })}
                  placeholder="e.g. 593821"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Room Password</label>
                <input
                  type="text"
                  value={roundFormData.roomPassword}
                  onChange={(e) =>
                    setRoundFormData({ ...roundFormData, roomPassword: e.target.value })
                  }
                  placeholder="e.g. uemj2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRoundModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingRound ? 'Update Round' : 'Save & Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: QUICK ROOM CREDENTIALS DRAWER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(quickCredsMatch)}
        onClose={() => setQuickCredsMatch(null)}
        title={`Enter Room Credentials for ${quickCredsMatch?.title || 'Round'}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Saving credentials here will publish them live to verified players and automatically switch
            both the round and parent lobby status to <strong>RUNNING</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Room ID *
            </label>
            <input
              type="text"
              value={quickRoomId}
              onChange={(e) => setQuickRoomId(e.target.value)}
              placeholder="e.g. 784920"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Room Password *
            </label>
            <input
              type="text"
              value={quickRoomPassword}
              onChange={(e) => setQuickRoomPassword(e.target.value)}
              placeholder="e.g. uemjpass"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setQuickCredsMatch(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuickCreds}
              disabled={submitting || !quickRoomId.trim() || !quickRoomPassword.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Save & Set to Running'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: ROSTER INSPECTOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={viewingTeam ? `Roster: ${viewingTeam.teamName}` : 'Team Roster'}
      >
        {viewingTeam && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span>
                Captain: <strong>{viewingTeam.captain?.name || viewingTeam.leader || 'N/A'}</strong>
              </span>
              <span>
                Phone: <strong>{viewingTeam.captain?.phone || 'N/A'}</strong>
              </span>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Players ({viewingTeam.players?.length || 0})
              </h5>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(viewingTeam.players || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-white font-bold block">
                        {p.inGameName || p.user?.name || `Player ${idx + 1}`}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        IGN ID: {p.inGameId || 'N/A'}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {p.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setRosterModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminMatches;
