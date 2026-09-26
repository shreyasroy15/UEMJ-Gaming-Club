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
  Zap,
  Minus,
  Save,
  Flame,
  X,
  AlertTriangle,
} from 'lucide-react';

// Official Esports Pointing System Presets
const SCORING_PRESETS = {
  bgmi: {
    key: 'bgmi',
    name: 'BGMI Official (BGIS / BMPS 10-Pts)',
    description: '1st: 10, 2nd: 6, 3rd: 5, 4th: 4, 5th: 3, 6th: 2, 7th: 1, 8th: 1, 9th+: 0 | 1 pt/kill',
    positionPoints: { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 },
    killPoint: 1,
  },
  freefire: {
    key: 'freefire',
    name: 'Free Fire Official (FFWS 12-Pts)',
    description: '1st: 12, 2nd: 9, 3rd: 8, 4th: 7, 5th: 6, 6th: 5, 7th: 4, 8th: 3, 9th: 2, 10th: 1 | 1 pt/kill',
    positionPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
    killPoint: 1,
  },
  classic: {
    key: 'classic',
    name: 'Classic 15-Point System',
    description: '1st: 15, 2nd: 12, 3rd: 10, 4th: 8, 5th: 6, 6th: 4, 7th: 2, 8th-12th: 1 | 1 pt/kill',
    positionPoints: { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1 },
    killPoint: 1,
  },
  custom: {
    key: 'custom',
    name: 'Custom Point Rules',
    description: 'Custom points distribution per position configured by admin',
    positionPoints: { 1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3 },
    killPoint: 1,
  },
};

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

  // Match Results & Points Entry State
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [selectedRoundForPoints, setSelectedRoundForPoints] = useState(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState('bgmi');
  const [customPositionPoints, setCustomPositionPoints] = useState({
    1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
  });
  const [customKillPoint, setCustomKillPoint] = useState(1);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [roundResultsData, setRoundResultsData] = useState([]);
  const [pointsSearchQuery, setPointsSearchQuery] = useState('');
  const [standingsSearchQuery, setStandingsSearchQuery] = useState('');
  const [qualifySearchQuery, setQualifySearchQuery] = useState('');

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
      ['live', 'ongoing', 'upcoming', 'registration-open', 'on-hold'].includes(t.status)
    );
  }, [tournaments, showAllTournaments]);

  // Current selected tournament object
  const selectedTournament = useMemo(() => {
    if (!selectedTournamentId) return null;
    return tournaments.find((t) => t._id === selectedTournamentId) || structure.tournament || null;
  }, [tournaments, selectedTournamentId, structure.tournament]);

  // Unified list of all lobbies in this tournament
  // Unified list of all lobbies in this tournament (EXCLUDING REJECTED TEAMS)
  const allLobbies = useMemo(() => {
    let raw = [];
    if (structure.lobbies && structure.lobbies.length > 0) {
      raw = structure.lobbies;
    } else {
      (structure.stages || []).forEach((stage) => {
        (stage.lobbies || []).forEach((l) => {
          raw.push({
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
    }

    // Filter out any rejected teams from lobbies
    return raw.map((lobby) => ({
      ...lobby,
      teams: (lobby.teams || []).filter((t) => {
        const tid = (t._id || t).toString();
        const fullReg = (structure.allRegistrations || []).find((r) => r._id.toString() === tid);
        const isRejected =
          t.status === 'rejected' ||
          fullReg?.status === 'rejected' ||
          fullReg?.identityProof?.status === 'rejected';
        return !isRejected;
      }),
    }));
  }, [structure.lobbies, structure.stages, structure.allRegistrations]);

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

  // Registered teams enriched with assignment status (STRICTLY EXCLUDE REJECTED TEAMS)
  const registeredTeams = useMemo(() => {
    const list = (structure.allRegistrations || []).filter(
      (team) => team.status !== 'rejected' && team.identityProof?.status !== 'rejected'
    );
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

  // Standings / Points Table for a given lobby (aggregates results from all completed rounds)
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
        positionPoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
      };
    });

    completedMatches.forEach((m) => {
      if (m.winner) {
        const wid = m.winner._id ? m.winner._id.toString() : m.winner.toString();
        if (pointsMap[wid]) {
          pointsMap[wid].wins += 1;
        }
      }

      if (m.results && m.results.length > 0) {
        m.results.forEach((r) => {
          const tid = r.team?._id ? r.team._id.toString() : r.team?.toString() || r.teamId;
          if (tid && pointsMap[tid]) {
            pointsMap[tid].matchesPlayed += 1;
            pointsMap[tid].kills += Number(r.kills || 0);
            pointsMap[tid].positionPoints += Number(r.positionPoints || 0);
            pointsMap[tid].bonusPoints += Number(r.bonusPoints || 0);
            pointsMap[tid].totalPoints += Number(r.totalPoints || 0);
          }
        });
      } else {
        (m.teams || []).forEach((tm) => {
          const tid = tm._id ? tm._id.toString() : tm.toString();
          if (pointsMap[tid]) {
            pointsMap[tid].matchesPlayed += 1;
          }
        });
      }
    });

    return Object.values(pointsMap).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.kills - a.kills;
    });
  };

  const activeLobbyStandings = useMemo(() => {
    if (!activeLobby) return [];
    return computeLobbyStandings(activeLobby._id);
  }, [activeLobby, matchesByLobby, registeredTeams]);

  const filteredActiveLobbyStandings = useMemo(() => {
    if (!standingsSearchQuery.trim()) return activeLobbyStandings;
    const q = standingsSearchQuery.toLowerCase().trim();
    return activeLobbyStandings.filter((st) => {
      const name = (st.teamName || '').toLowerCase();
      const tag = (st.teamTag || '').toLowerCase();
      const cap = (st.captain || '').toLowerCase();
      return name.includes(q) || tag.includes(q) || cap.includes(q);
    });
  }, [activeLobbyStandings, standingsSearchQuery]);

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

  const handleUpdateTournamentStatus = async (newStatus) => {
    if (!selectedTournamentId) return;
    try {
      await API.patch(`/tournaments/${selectedTournamentId}/status`, { status: newStatus });
      addToast(`Tournament status updated to "${newStatus.toUpperCase()}"`, 'success');
      setTournaments((prev) =>
        prev.map((t) => (t._id === selectedTournamentId ? { ...t, status: newStatus } : t))
      );
      setStructure((prev) => ({
        ...prev,
        tournament: prev.tournament ? { ...prev.tournament, status: newStatus } : prev.tournament,
      }));
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update tournament status', 'error');
    }
  };

  const handleSetLobbyStatus = async (lobby, newStatus) => {
    try {
      await API.put(`/tournaments/${selectedTournamentId}/lobbies/${lobby._id}`, {
        status: newStatus,
      });
      addToast(`Lobby "${lobby.name}" status set to "${newStatus.toUpperCase()}"`, 'success');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast('Failed to update lobby status', 'error');
    }
  };

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
    const gameName = (selectedTournament?.game || '').toLowerCase();
    let defaultMap = 'Erangel';
    if (gameName.includes('free fire')) defaultMap = 'Bermuda';
    else if (gameName.includes('valorant')) defaultMap = 'Ascent';

    setEditingRound(null);
    setRoundFormData({
      title: `Round ${nextRoundNumber}`,
      map: defaultMap,
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

  const handleDeleteAllUnassignedMatches = async () => {
    const count = matchesByLobby['unassigned']?.length || 0;
    if (!window.confirm(`Are you sure you want to permanently delete all ${count} unassigned match(es)?`)) {
      return;
    }
    try {
      setSubmitting(true);
      await API.delete(`/tournaments/${selectedTournamentId}/matches?unassignedOnly=true`);
      addToast(`Deleted ${count} unassigned matches successfully!`, 'success');
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to delete unassigned matches', 'error');
    } finally {
      setSubmitting(false);
    }
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
        'Room ID & Password saved! Tournament & Lobby automatically switched to RUNNING status.',
        'success'
      );
      setTournaments((prev) =>
        prev.map((t) => (t._id === selectedTournamentId ? { ...t, status: 'ongoing' } : t))
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
  // MATCH RESULTS & POINTS TABLE ENTRY LOGIC
  // ==========================================
  const getPositionPointsForRank = (pos, presetKey = selectedPresetKey) => {
    if (!pos || pos <= 0) return 0;
    if (presetKey === 'custom') {
      return Number(customPositionPoints[pos] || 0);
    }
    const preset = SCORING_PRESETS[presetKey] || SCORING_PRESETS.bgmi;
    return Number(preset.positionPoints[pos] || 0);
  };

  const getKillPointsValue = (kills, presetKey = selectedPresetKey) => {
    const k = Math.max(0, Number(kills || 0));
    const rate = presetKey === 'custom' ? Number(customKillPoint || 1) : (SCORING_PRESETS[presetKey]?.killPoint || 1);
    return k * rate;
  };

  // Open points entry modal for a specific round
  const handleOpenPointsEntryModal = (roundToEdit) => {
    if (!roundToEdit) {
      // Pick first round if available
      if (activeLobbyMatches.length > 0) {
        roundToEdit = activeLobbyMatches[0];
      } else {
        addToast('Please schedule at least one round first in this lobby', 'warning');
        return;
      }
    }

    setSelectedRoundForPoints(roundToEdit);

    // Auto-detect preset by game name
    const gameName = selectedTournament?.game?.toLowerCase() || '';
    if (gameName.includes('free fire')) {
      setSelectedPresetKey('freefire');
    } else {
      setSelectedPresetKey('bgmi');
    }

    // Populate teams data for this round
    const lobbyTeams = activeLobby?.teams || [];
    const existingResults = roundToEdit.results || [];

    const initialized = lobbyTeams.map((tm) => {
      const tid = tm._id ? tm._id.toString() : tm.toString();
      const fullTeam = registeredTeams.find((rt) => rt._id.toString() === tid) || tm;
      const foundRes = existingResults.find(
        (r) => (r.team?._id ? r.team._id.toString() : r.team?.toString() || r.teamId) === tid
      );

      const pos = foundRes?.position || 0;
      const kills = foundRes?.kills || 0;
      const bonus = foundRes?.bonusPoints || 0;
      const posPts = foundRes?.positionPoints !== undefined ? foundRes.positionPoints : getPositionPointsForRank(pos);
      const killPts = foundRes?.killPoints !== undefined ? foundRes.killPoints : getKillPointsValue(kills);
      const total = foundRes?.totalPoints !== undefined ? foundRes.totalPoints : posPts + killPts + bonus;

      return {
        teamId: tid,
        teamName: fullTeam.teamName || 'Team',
        teamTag: fullTeam.teamTag || '',
        captain: fullTeam.captain?.name || fullTeam.leader || 'N/A',
        position: pos,
        kills,
        bonusPoints: bonus,
        positionPoints: posPts,
        killPoints: killPts,
        totalPoints: total,
      };
    });

    setRoundResultsData(initialized);
    setPointsSearchQuery('');
    setPointsModalOpen(true);
  };

  // Next available sequential position for Tap-to-Rank
  const nextAvailablePosition = useMemo(() => {
    const used = new Set(roundResultsData.map((r) => Number(r.position)).filter((p) => p > 0));
    let next = 1;
    while (used.has(next)) {
      next += 1;
    }
    return next;
  }, [roundResultsData]);

  // Filtered teams list for points entry modal by team name, tag, or captain
  const filteredResultsData = useMemo(() => {
    if (!pointsSearchQuery.trim()) return roundResultsData;
    const q = pointsSearchQuery.toLowerCase().trim();
    return roundResultsData.filter((item) => {
      const name = (item.teamName || '').toLowerCase();
      const tag = (item.teamTag || '').toLowerCase();
      const cap = (item.captain || '').toLowerCase();
      return name.includes(q) || tag.includes(q) || cap.includes(q);
    });
  }, [roundResultsData, pointsSearchQuery]);

  // Sequential Tap-to-Rank on a team card
  const handleTapTeamRank = (teamId) => {
    setRoundResultsData((prev) => {
      return prev.map((item) => {
        if (item.teamId !== teamId) return item;

        // If currently unranked (0), assign next available rank
        // If already ranked, clear it back to 0 so admin can redo
        const newPos = item.position === 0 ? nextAvailablePosition : 0;
        const posPts = getPositionPointsForRank(newPos);
        const killPts = getKillPointsValue(item.kills);
        const total = posPts + killPts + item.bonusPoints;

        return {
          ...item,
          position: newPos,
          positionPoints: posPts,
          killPoints: killPts,
          totalPoints: total,
        };
      });
    });
  };

  // Manual Override of Position Number (e.g. if mistakenly ranked)
  const handleOverridePosition = (teamId, newPosVal) => {
    const parsedPos = Math.max(0, Number(newPosVal) || 0);
    setRoundResultsData((prev) => {
      return prev.map((item) => {
        if (item.teamId !== teamId) return item;
        const posPts = getPositionPointsForRank(parsedPos);
        const killPts = getKillPointsValue(item.kills);
        const total = posPts + killPts + item.bonusPoints;
        return {
          ...item,
          position: parsedPos,
          positionPoints: posPts,
          killPoints: killPts,
          totalPoints: total,
        };
      });
    });
  };

  // Update Kills for a team
  const handleUpdateKills = (teamId, deltaOrValue) => {
    setRoundResultsData((prev) => {
      return prev.map((item) => {
        if (item.teamId !== teamId) return item;
        let newKills = typeof deltaOrValue === 'number' ? Math.max(0, item.kills + deltaOrValue) : Math.max(0, Number(deltaOrValue) || 0);
        const killPts = getKillPointsValue(newKills);
        const total = item.positionPoints + killPts + item.bonusPoints;
        return {
          ...item,
          kills: newKills,
          killPoints: killPts,
          totalPoints: total,
        };
      });
    });
  };

  // Update Bonus Points for a team
  const handleUpdateBonus = (teamId, deltaOrValue) => {
    setRoundResultsData((prev) => {
      return prev.map((item) => {
        if (item.teamId !== teamId) return item;
        let newBonus = typeof deltaOrValue === 'number' ? item.bonusPoints + deltaOrValue : Number(deltaOrValue) || 0;
        const total = item.positionPoints + item.killPoints + newBonus;
        return {
          ...item,
          bonusPoints: newBonus,
          totalPoints: total,
        };
      });
    });
  };

  // Change scoring system preset
  const handlePresetChange = (presetKey) => {
    setSelectedPresetKey(presetKey);
    // Recalculate points for all teams under new preset
    setRoundResultsData((prev) => {
      return prev.map((item) => {
        const posPts = getPositionPointsForRank(item.position, presetKey);
        const killPts = getKillPointsValue(item.kills, presetKey);
        const total = posPts + killPts + item.bonusPoints;
        return {
          ...item,
          positionPoints: posPts,
          killPoints: killPts,
          totalPoints: total,
        };
      });
    });
    addToast(`Switched to ${SCORING_PRESETS[presetKey]?.name}`, 'info');
  };

  // Save Round Results to Server
  const handleSaveMatchResults = async () => {
    if (!selectedRoundForPoints) return;
    try {
      setSubmitting(true);
      await API.post(
        `/tournaments/${selectedTournamentId}/matches/${selectedRoundForPoints._id}/results`,
        {
          results: roundResultsData,
          status: 'completed',
        }
      );
      addToast(
        `Results and points saved for ${selectedRoundForPoints.title || 'Round'}! Standings updated.`,
        'success'
      );
      setPointsModalOpen(false);
      fetchTournamentStructure(selectedTournamentId);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save match results', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // VIEW 1: TOURNAMENT SELECTION SCREEN
  // ==========================================
  if (!selectedTournamentId) {
    return (
      <div className="min-h-screen pb-16">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3">
                <Swords className="w-3.5 h-3.5 text-cyan-600" />
                Tournament Operations Control Center
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-wide font-gaming">
                MATCHES & LOBBY MANAGEMENT
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-2xl leading-relaxed">
                Select an active running tournament or upcoming tournament below to manage its
                registered teams, lobby allocations, match rounds, and room credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowAllTournaments(!showAllTournaments)}
                className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all border text-center ${
                  showAllTournaments
                    ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                {showAllTournaments ? 'All Tournaments' : 'Running & Upcoming'}
              </button>

              <button
                onClick={fetchTournaments}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors shrink-0"
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
            <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Active or Upcoming Tournaments</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              There are currently no tournaments with running or upcoming status. You can create a
              new tournament or toggle to view past tournaments.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowAllTournaments(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-sm"
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
                  className="group relative cursor-pointer rounded-2xl bg-white border border-slate-200/90 hover:border-cyan-500 transition-all duration-300 p-6 shadow-sm hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-purple-700">
                        {t.game || 'Esports'}
                      </span>

                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                          <Radio className="w-3.5 h-3.5 text-emerald-600" />
                          RUNNING NOW
                        </span>
                      ) : t.status === 'on-hold' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          ⏸️ ON HOLD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          {t.status === 'registration-open' ? 'REGISTRATION OPEN' : 'UPCOMING'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2 mb-3">
                      {t.name}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-0.5 font-medium">Registered Teams</span>
                        <span className="text-slate-900 font-bold text-sm">
                          {teamCount} <span className="text-slate-400 font-normal">/ {t.maxTeams || '∞'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5 font-medium">Start Date</span>
                        <span className="text-slate-700 font-semibold">
                          {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-cyan-600 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedTournamentId('')}
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors uppercase tracking-wider mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournaments
            </button>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-gaming tracking-wide">
                {selectedTournament?.name || 'Tournament Manager'}
              </h1>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-purple-50 border border-purple-200 text-purple-700">
                {selectedTournament?.game || 'Esports'}
              </span>

              {/* Interactive Tournament Status Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                <span className="text-[11px] font-mono font-bold text-slate-500 pl-1.5 pr-0.5">Status:</span>
                <select
                  value={selectedTournament?.status || 'upcoming'}
                  onChange={(e) => handleUpdateTournamentStatus(e.target.value)}
                  className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-lg outline-none cursor-pointer transition border ${
                    selectedTournament?.status === 'live' || selectedTournament?.status === 'ongoing'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : selectedTournament?.status === 'on-hold'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : selectedTournament?.status === 'registration-open'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                      : selectedTournament?.status === 'completed'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  <option value="ongoing">🟢 Running / Live</option>
                  <option value="on-hold">⏸️ On Hold</option>
                  <option value="registration-open">📝 Registration Open</option>
                  <option value="upcoming">⏳ Upcoming</option>
                  <option value="completed">🏁 Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>

            {/* Fast Status Quick-Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-500">Quick status:</span>
              <button
                type="button"
                onClick={() => handleUpdateTournamentStatus('ongoing')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer flex items-center gap-1 ${
                  selectedTournament?.status === 'ongoing' || selectedTournament?.status === 'live'
                    ? 'bg-emerald-500 text-white font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                ● Running
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTournamentStatus('on-hold')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer flex items-center gap-1 ${
                  selectedTournament?.status === 'on-hold'
                    ? 'bg-amber-400 text-slate-900 font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                ⏸️ On Hold
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTournamentStatus('registration-open')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                  selectedTournament?.status === 'registration-open'
                    ? 'bg-cyan-500 text-white font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Registration Open
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTournamentStatus('completed')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                  selectedTournament?.status === 'completed'
                    ? 'bg-purple-600 text-white font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.game})
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchTournamentStructure(selectedTournamentId)}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${structureLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tournament Fast Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Registered Teams</span>
            <span className="text-xl font-black text-slate-900">{registeredTeams.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Total Lobbies</span>
            <span className="text-xl font-black text-cyan-600">{allLobbies.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Scheduled Rounds</span>
            <span className="text-xl font-black text-purple-600">
              {structure.matches?.length || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Running Lobbies</span>
            <span className="text-xl font-black text-emerald-600">
              {allLobbies.filter((l) => l.status === 'running').length}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: REGISTERED TEAMS ROSTER (CARD FORMAT IN ROWS: 2, 3, OR 4 CARDS) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              <h2 className="text-lg font-black text-slate-900 font-gaming tracking-wide">
                REGISTERED TEAMS ({registeredTeams.length})
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Select teams below to assign them into a lobby (e.g., select first 10 teams for Lobby
              1, then select remaining 10 teams for Lobby 2).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={selectAllUnassigned}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            >
              Select All Unassigned
            </button>
            <button
              onClick={() => selectCountUnassigned(10)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition"
            >
              Select 10 Unassigned
            </button>
            <button
              onClick={() => selectCountUnassigned(16)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
            >
              Select 16 Unassigned
            </button>
            {selectedTeamIds.length > 0 && (
              <button
                onClick={clearTeamSelection}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
              >
                Clear ({selectedTeamIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team name, tag, or captain..."
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={teamFilterStatus}
              onChange={(e) => setTeamFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 font-medium"
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

        {/* Bulk Selection Bar */}
        {selectedTeamIds.length > 0 && (
          <div className="sticky top-4 z-20 bg-white text-slate-900 border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white font-black text-sm shadow-xs">
                {selectedTeamIds.length}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Teams Selected for Lobby</h4>
                <p className="text-xs text-slate-500">
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
                    className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 font-semibold shadow-xs cursor-pointer"
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
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 transition"
                  >
                    Move to Lobby
                  </button>
                </div>
              )}

              <button
                onClick={handleOpenCreateLobby}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center gap-1.5"
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

        {/* Teams Grid: 2, 3, or 4 per row */}
        {displayedTeams.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No registered teams found matching your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2 max-h-[580px] overflow-y-auto pr-1.5 custom-scrollbar">
            {displayedTeams.map((team) => {
              const isSelected = selectedTeamIds.includes(team._id.toString());
              const isAssigned = Boolean(team.assignedLobbyId);

              return (
                <div
                  key={team._id}
                  onClick={() => toggleTeamSelection(team._id.toString())}
                  className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer border select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-50/70 border-cyan-400 shadow-sm'
                      : isAssigned
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      : 'bg-white border-slate-200/90 hover:border-cyan-400 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${
                            isSelected
                              ? 'bg-cyan-600 border-cyan-600 text-white'
                              : 'border-slate-300 bg-white group-hover:border-cyan-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {team.teamTag && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-cyan-700 border border-slate-200">
                            [{team.teamTag}]
                          </span>
                        )}
                      </div>

                      {isAssigned ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 truncate max-w-[120px]">
                          ● {team.assignedLobbyName}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          ○ Unassigned
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                      {team.teamName}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1 truncate">
                      <span className="text-slate-400">Captain:</span>{' '}
                      {team.captain?.name || team.leader || 'N/A'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{team.players?.length || 1} Players</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTeam(team);
                        setRosterModalOpen(true);
                      }}
                      className="text-cyan-600 hover:text-cyan-700 font-semibold"
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-black text-slate-900 font-gaming tracking-wide">
                  TOURNAMENT LOBBIES ({allLobbies.length})
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Lobbies host your match rounds (Round 1, Round 2...). When room credentials are
                provided, the lobby automatically updates to Running.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {allLobbies.length > 1 && (
                <button
                  onClick={handleOpenQualifyModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Qualify Top Teams to New Lobby
                </button>
              )}

              <button
                onClick={handleOpenCreateLobby}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                + Create Lobby
              </button>
            </div>
          </div>

          {/* Lobby Selection Tabs */}
          {allLobbies.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
              <Crown className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-slate-900 font-bold text-sm mb-1">No Lobbies Created Yet</h4>
              <p className="text-slate-600 text-xs mb-4">
                Create Lobby 1 to begin allocating teams and running matches.
              </p>
              <button
                onClick={handleOpenCreateLobby}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider shadow-sm"
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
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-bold shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <span className="font-bold text-sm">{lobby.name}</span>

                    {lobby.status === 'running' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                        ● Running
                      </span>
                    ) : lobby.status === 'on-hold' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        ⏸️ On Hold
                      </span>
                    ) : lobby.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        Upcoming
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-mono text-[10px] border border-slate-200">
                      {lobby.teams?.length || 0}/{lobby.maxTeams} Teams
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Unassigned / Stray Matches Banner (e.g. from previous bracket generation) */}
        {matchesByLobby['unassigned'] && matchesByLobby['unassigned'].length > 0 && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {matchesByLobby['unassigned'].length} Stray / Bracket Matches Found (Unassigned to any Lobby)
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  These 2-team matches were previously generated and appear on the user page under Lobbies & Matches. Delete them to clean up the schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteAllUnassignedMatches}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All {matchesByLobby['unassigned'].length} Unassigned Matches
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              {matchesByLobby['unassigned'].map((m) => (
                <div key={m._id} className="p-3 rounded-xl bg-white border border-rose-200 flex items-center justify-between gap-2 text-xs shadow-2xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 font-mono truncate block">
                      {m.title || `Match #${m.matchNumber}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Map: {m.map || 'Default'} • {m.teams?.length || 0} teams
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRound(m)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Delete this match"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Lobby Details & Controls */}
        {activeLobby && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-black text-slate-900 font-gaming">{activeLobby.name}</h3>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  <span className="text-[11px] font-mono text-slate-500 pl-1.5 pr-0.5 font-bold">Lobby:</span>
                  <select
                    value={activeLobby.status || 'upcoming'}
                    onChange={(e) => handleSetLobbyStatus(activeLobby, e.target.value)}
                    className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-lg outline-none cursor-pointer transition border ${
                      activeLobby.status === 'running'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : activeLobby.status === 'on-hold'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : activeLobby.status === 'completed'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    <option value="running">🟢 Running</option>
                    <option value="on-hold">⏸️ On Hold</option>
                    <option value="upcoming">⏳ Upcoming</option>
                    <option value="completed">🏁 Completed</option>
                  </select>
                </div>

                <span className="text-xs text-slate-600">
                  Capacity: <strong className="text-slate-900">{activeLobby.teams?.length || 0}</strong>{' '}
                  / {activeLobby.maxTeams} Teams
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditLobby(activeLobby)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Lobby
                </button>

                <button
                  onClick={() => handleDeleteLobby(activeLobby)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition"
                  title="Delete Lobby"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Rounds & Matches vs Points Table */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setLobbyTab('rounds')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  lobbyTab === 'rounds'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Rounds & Matches ({activeLobbyMatches.length})
              </button>

              <button
                onClick={() => setLobbyTab('standings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  lobbyTab === 'standings'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    <h4 className="text-sm font-bold text-slate-900">Scheduled Match Rounds</h4>
                    <p className="text-xs text-slate-600">
                      Rounds run inside this lobby. Adding Room ID & Password automatically sets
                      status to Running!
                    </p>
                  </div>

                  <button
                    onClick={handleOpenCreateRound}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Schedule Round
                  </button>
                </div>

                {activeLobbyMatches.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <Swords className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-3">
                      No rounds scheduled in {activeLobby.name} yet.
                    </p>
                    <button
                      onClick={handleOpenCreateRound}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-cyan-700 border border-slate-200 text-xs font-bold uppercase shadow-sm"
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
                          className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-mono font-bold text-cyan-700">
                                Match #{match.matchNumber}
                              </span>

                              {isLive ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                                  ● LIVE / RUNNING
                                </span>
                              ) : isCompleted ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                  Completed
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                  Scheduled
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-black text-slate-900">
                              {match.title || `Round ${match.matchNumber}`}
                            </h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                              <span>Map: <strong className="text-slate-800 font-semibold">{match.map}</strong></span>
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
                              <div className="mt-3 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 flex items-center gap-2 font-medium">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                <span>Winner: <strong>{match.winner.teamName || 'Team'}</strong></span>
                              </div>
                            )}

                            {/* Room Credentials Box */}
                            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                                  <Key className="w-3.5 h-3.5 text-cyan-600" />
                                  Room Credentials
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickCreds(match)}
                                  className="text-cyan-600 hover:text-cyan-700 text-[11px] font-bold"
                                >
                                  {hasCreds ? 'Edit Credentials' : '+ Enter Room ID & Password'}
                                </button>
                              </div>

                              {hasCreds ? (
                                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between shadow-sm">
                                    <span className="text-slate-500 text-[10px] font-sans">ID:</span>
                                    <span className="text-slate-900 font-bold">{match.roomId}</span>
                                    <button
                                      onClick={() => copyToClipboard(match.roomId, 'Room ID')}
                                      className="text-slate-400 hover:text-cyan-600"
                                      title="Copy Room ID"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between shadow-sm">
                                    <span className="text-slate-500 text-[10px] font-sans">PASS:</span>
                                    <span className="text-slate-900 font-bold">
                                      {showPasswordMap[match._id] ? match.roomPassword : '••••••'}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setShowPasswordMap((prev) => ({
                                          ...prev,
                                          [match._id]: !prev[match._id],
                                        }))
                                      }
                                      className="text-slate-400 hover:text-cyan-600"
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
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditRound(match)}
                                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleOpenPointsEntryModal(match)}
                                className="px-3 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold transition flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 text-cyan-600" />
                                <span>{match.status === 'completed' ? 'Edit Points' : 'Enter Points'}</span>
                              </button>
                            </div>

                            <button
                              onClick={() => handleDeleteRound(match)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition"
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
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      {activeLobby.name} - Points Table & Standings ({activeLobby.teams?.length || 0} Teams)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Cumulative standings calculated automatically from completed rounds in this lobby.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenPointsEntryModal(activeLobbyMatches[0] || null)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      ⚡ Enter / Update Match Round Points
                    </button>
                  </div>
                </div>

                {activeLobby.teams?.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No teams assigned to this lobby yet. Select teams from the Registered Teams section above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search Bar for Lobby Standings */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search team name, tag, or captain in lobby..."
                          value={standingsSearchQuery}
                          onChange={(e) => setStandingsSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono shadow-sm transition"
                        />
                        {standingsSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStandingsSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition"
                            title="Clear"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="text-xs font-mono text-slate-500 shrink-0">
                        Showing <span className="text-cyan-700 font-bold">{filteredActiveLobbyStandings.length}</span> of{' '}
                        <span className="text-slate-900 font-bold">{activeLobbyStandings.length}</span> teams
                        {standingsSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStandingsSearchQuery('')}
                            className="ml-2 text-cyan-600 hover:underline text-[11px] cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-mono text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="p-3.5 text-center w-14">Rank</th>
                            <th className="p-3.5">Team</th>
                            <th className="p-3.5">Captain</th>
                            <th className="p-3.5 text-center">Rounds Played</th>
                            <th className="p-3.5 text-center">Wins (🍗)</th>
                            <th className="p-3.5 text-center">Total Kills</th>
                            <th className="p-3.5 text-center">Placement Pts</th>
                            <th className="p-3.5 text-center">Bonus Pts</th>
                            <th className="p-3.5 text-center font-bold text-slate-900">Total Points</th>
                            <th className="p-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium">
                          {filteredActiveLobbyStandings.length === 0 ? (
                            <tr>
                              <td colSpan="10" className="p-8 text-center text-slate-500 font-mono">
                                No teams found matching "{standingsSearchQuery}".
                                <button
                                  type="button"
                                  onClick={() => setStandingsSearchQuery('')}
                                  className="ml-2 text-cyan-600 hover:underline font-bold"
                                >
                                  Clear filter
                                </button>
                              </td>
                            </tr>
                          ) : (
                            filteredActiveLobbyStandings.map((team, idx) => {
                          const isTop1 = idx === 0;

                          return (
                            <tr
                              key={team.teamId}
                              className={`hover:bg-slate-50 transition-colors ${
                                isTop1 ? 'bg-amber-50/50' : ''
                              }`}
                            >
                              <td className="p-3.5 text-center font-mono font-black">
                                {isTop1 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs">
                                    🥇
                                  </span>
                                ) : idx === 1 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-xs">
                                    🥈
                                  </span>
                                ) : idx === 2 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs">
                                    🥉
                                  </span>
                                ) : (
                                  <span className="text-slate-500">#{idx + 1}</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="text-slate-900 font-bold block">{team.teamName}</span>
                                {team.teamTag && (
                                  <span className="text-[10px] text-slate-500">[{team.teamTag}]</span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-600">{team.captain || 'N/A'}</td>
                              <td className="p-3.5 text-center font-mono text-slate-700">{team.matchesPlayed}</td>
                              <td className="p-3.5 text-center font-mono text-amber-600 font-bold">
                                {team.wins}
                              </td>
                              <td className="p-3.5 text-center font-mono text-rose-600 font-bold">
                                {team.kills}
                              </td>
                              <td className="p-3.5 text-center font-mono text-cyan-700 font-bold">
                                {team.positionPoints}
                              </td>
                              <td className="p-3.5 text-center font-mono text-purple-700 font-bold">
                                {team.bonusPoints || 0}
                              </td>
                              <td className="p-3.5 text-center font-mono font-black text-sm">
                                <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {team.totalPoints} PTS
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleRemoveTeamFromLobby(activeLobby, team.teamId)}
                                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                                  title="Remove team from this lobby"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  </div>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Lobby Status
              </label>
              <select
                value={lobbyFormData.status}
                onChange={(e) => setLobbyFormData({ ...lobbyFormData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium cursor-pointer"
              >
                <option value="upcoming">Upcoming Lobby</option>
                <option value="running">Running Lobby</option>
              </select>
            </div>
          </div>

          {!editingLobby && selectedTeamIds.length > 0 && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800">
              <strong>{selectedTeamIds.length} teams</strong> currently selected in the roster will
              be automatically assigned to this new lobby!
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateLobbyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                New Lobby Name *
              </label>
              <input
                type="text"
                required
                value={qualifyLobbyName}
                onChange={(e) => setQualifyLobbyName(e.target.value)}
                placeholder="e.g. Finals Lobby, Grand Finale"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={qualifyMaxTeams}
                onChange={(e) => setQualifyMaxTeams(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Select top qualifying teams from each lobby column below. The selected teams will be merged into your new lobby:
            </p>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team in lobbies..."
                value={qualifySearchQuery}
                onChange={(e) => setQualifySearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
              />
              {qualifySearchQuery && (
                <button
                  type="button"
                  onClick={() => setQualifySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Side-by-side Lobby Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-1">
            {allLobbies.map((lobby) => {
              const standings = computeLobbyStandings(lobby._id);
              const filteredStandings = qualifySearchQuery.trim()
                ? standings.filter((st) =>
                    (st.teamName || '').toLowerCase().includes(qualifySearchQuery.toLowerCase().trim())
                  )
                : standings;

              return (
                <div
                  key={lobby._id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{lobby.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {standings.length} Teams
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => selectTopNFromLobby(lobby._id, 4)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                        >
                          Top 4
                        </button>
                        <button
                          type="button"
                          onClick={() => selectTopNFromLobby(lobby._id, 8)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                        >
                          Top 8
                        </button>
                      </div>
                    </div>

                    {filteredStandings.length === 0 ? (
                      <p className="text-slate-400 text-xs py-4 text-center">
                        {standings.length === 0 ? 'No teams in lobby' : 'No teams match search'}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredStandings.map((st, idx) => {
                          const isChecked = selectedQualifyTeamIds.includes(st.teamId);

                          return (
                            <div
                              key={st.teamId}
                              onClick={() => toggleQualifyTeam(st.teamId)}
                              className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                isChecked
                                  ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-[10px] text-slate-400">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold truncate">{st.teamName}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-emerald-600 font-bold">
                                  {st.totalPoints} pts
                                </span>
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    isChecked
                                      ? 'bg-sky-600 border-sky-600 text-white'
                                      : 'border-slate-300 bg-white'
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-sky-700 font-bold">
              Total Teams Selected: {selectedQualifyTeamIds.length}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQualifyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedQualifyTeamIds.length === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Round Title *
              </label>
              <input
                type="text"
                required
                value={roundFormData.title}
                onChange={(e) => setRoundFormData({ ...roundFormData, title: e.target.value })}
                placeholder="e.g. Round 1, Round 2"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Map
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  {(selectedTournament?.game?.toLowerCase().includes('free fire')
                    ? ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine']
                    : selectedTournament?.game?.toLowerCase().includes('valorant')
                    ? ['Ascent', 'Bind', 'Haven', 'Lotus']
                    : ['Erangel', 'Miramar', 'Sanhok', 'Vikendi']
                  ).map((mName) => (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => setRoundFormData({ ...roundFormData, map: mName })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        roundFormData.map === mName
                          ? 'bg-cyan-100 border-cyan-300 text-cyan-800 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                    >
                      {mName}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={roundFormData.map}
                onChange={(e) => setRoundFormData({ ...roundFormData, map: e.target.value })}
                placeholder="e.g. Bermuda, Erangel, Ascent"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={roundFormData.scheduledAt}
                onChange={(e) =>
                  setRoundFormData({ ...roundFormData, scheduledAt: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Match Status
              </label>
              <select
                value={roundFormData.status}
                onChange={(e) => setRoundFormData({ ...roundFormData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 font-medium cursor-pointer"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live / Running</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              Live Room Credentials (Optional)
            </h5>
            <p className="text-[11px] text-slate-500">
              When Room ID and Password are provided, this round and its lobby will automatically
              switch to Running!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-semibold">Room ID</label>
                <input
                  type="text"
                  value={roundFormData.roomId}
                  onChange={(e) => setRoundFormData({ ...roundFormData, roomId: e.target.value })}
                  placeholder="e.g. 593821"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1 font-semibold">Room Password</label>
                <input
                  type="text"
                  value={roundFormData.roomPassword}
                  onChange={(e) =>
                    setRoundFormData({ ...roundFormData, roomPassword: e.target.value })
                  }
                  placeholder="e.g. uemj2026"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRoundModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
            >
              {submitting ? 'Saving...' : editingRound ? 'Update Round' : 'Save & Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* FULL-SCREEN OVERLAY: INTERACTIVE MATCH RESULTS & POINTS ENTRY */}
      {/* ========================================================================= */}
      {pointsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col h-screen max-h-screen overflow-hidden">
          {/* STICKY HEADER */}
          <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 space-y-4 flex-shrink-0 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-slate-900 font-mono mb-1 truncate">
                  ENTER MATCH RESULTS
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
                  <span className="font-mono">
                    {selectedRoundForPoints?.title || 'Round'}
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="text-slate-500">
                    {structure.tournament?.name}
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="font-mono text-cyan-600 font-bold">
                    {activeLobby?.name || 'Lobby'}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPointsModalOpen(false)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <span className="text-xl leading-none">✕</span>
              </button>
            </div>

            {/* Scoring System Info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-slate-500 block mb-1 font-semibold">SCORING SYSTEM:</span>
                  <p className="text-slate-700 font-mono text-[11px]">
                    {SCORING_PRESETS[selectedPresetKey]?.description}
                  </p>
                </div>

                {/* Presets Toggle Pills */}
                <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                  {Object.values(SCORING_PRESETS).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handlePresetChange(p.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedPresetKey === p.key
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {p.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom points editor if Custom is chosen */}
              {selectedPresetKey === 'custom' && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs gap-3">
                    <span className="font-bold text-slate-900">Custom Position Points (1st - 10th):</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-500 font-medium">Kill Point Rate:</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={customKillPoint}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomKillPoint(val);
                          setRoundResultsData((prev) =>
                            prev.map((item) => {
                              const killPts = item.kills * val;
                              return {
                                ...item,
                                killPoints: killPts,
                                totalPoints: item.positionPoints + killPts + item.bonusPoints,
                              };
                            })
                          );
                        }}
                        className="w-14 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 text-center font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => (
                      <div key={pos} className="text-center">
                        <span className="text-[10px] text-slate-500 block font-medium">#{pos}</span>
                        <input
                          type="number"
                          min="0"
                          value={customPositionPoints[pos] || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomPositionPoints((prev) => ({ ...prev, [pos]: val }));
                            setRoundResultsData((prev) =>
                              prev.map((item) => {
                                if (item.position !== pos) return item;
                                return {
                                  ...item,
                                  positionPoints: val,
                                  totalPoints: val + item.killPoints + item.bonusPoints,
                                };
                              })
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs text-center font-bold text-cyan-700 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tap-to-Rank Banner */}
            <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-black text-xs">
                  #{nextAvailablePosition}
                </span>
                <div>
                  <span className="text-slate-900 font-bold block">
                    Tap-to-Rank ACTIVE: Next rank = <strong>#{nextAvailablePosition}</strong>
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    Tap card to rank • Tap again to clear • Type position to override
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRoundResultsData((prev) =>
                    prev.map((i) => ({
                      ...i,
                      position: 0,
                      positionPoints: 0,
                      totalPoints: i.killPoints + i.bonusPoints,
                    }))
                  );
                  addToast('Cleared all team ranks', 'info');
                }}
                className="px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold whitespace-nowrap flex-shrink-0 cursor-pointer shadow-xs"
              >
                Reset Ranks
              </button>
            </div>

            {/* Search Team for Points / Rank Update */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search team name or tag to update position & kills..."
                  value={pointsSearchQuery}
                  onChange={(e) => setPointsSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 font-mono shadow-xs transition"
                />
                {pointsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPointsSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
                <span>
                  Showing <strong className="text-cyan-600">{filteredResultsData.length}</strong> of{' '}
                  <strong className="text-slate-900">{roundResultsData.length}</strong> teams
                </span>
                {pointsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPointsSearchQuery('')}
                    className="text-cyan-600 hover:underline text-[11px] ml-1 cursor-pointer font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* SCROLLABLE MAIN AREA */}
          <main className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-slate-50/50 custom-scrollbar overscroll-contain">
            {filteredResultsData.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-mono text-slate-600">
                  No team found matching "{pointsSearchQuery}" in this match round.
                </p>
                <button
                  type="button"
                  onClick={() => setPointsSearchQuery('')}
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-cyan-600 border border-slate-200 text-xs font-mono font-bold transition cursor-pointer shadow-xs"
                >
                  Show All Teams ({roundResultsData.length})
                </button>
              </div>
            ) : (
              /* Teams Card Grid: Responsive columns */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
                {filteredResultsData.map((item) => {
                const isRanked = item.position > 0;
                const isWinner = item.position === 1;

                return (
                  <div
                    key={item.teamId}
                    onClick={() => handleTapTeamRank(item.teamId)}
                    className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between select-none ${
                      isWinner
                        ? 'bg-amber-50/90 border-amber-300 shadow-sm'
                        : isRanked
                        ? 'bg-sky-50/90 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Card Header: Position & Winner Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Position input / badge */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 flex-shrink-0 shadow-xs"
                          >
                            <span className="text-[10px] text-slate-400 font-mono pl-1">POS:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.position || ''}
                              placeholder="-"
                              onChange={(e) => handleOverridePosition(item.teamId, e.target.value)}
                              className="w-8 bg-transparent text-center text-xs font-black text-slate-900 focus:outline-none focus:text-cyan-600"
                            />
                          </div>

                          {item.teamTag && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-cyan-700 border border-slate-200 truncate">
                              [{item.teamTag}]
                            </span>
                          )}
                        </div>

                        {isWinner ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                            <Crown className="w-3 h-3 text-amber-600" />
                            1st
                          </span>
                        ) : isRanked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex-shrink-0 whitespace-nowrap">
                            #{item.position}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic flex-shrink-0 whitespace-nowrap">Tap</span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 group-hover:text-cyan-600 transition-colors truncate mb-1">
                        {item.teamName}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Captain: {item.captain}
                      </p>
                    </div>

                    {/* Kills & Bonus Controls */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 text-xs"
                    >
                      {/* Kills Input */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-500" />
                          Kills:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateKills(item.teamId, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.kills}
                            onChange={(e) => handleUpdateKills(item.teamId, e.target.value)}
                            className="w-10 bg-white border border-slate-200 rounded py-0.5 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateKills(item.teamId, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Bonus Points Input */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Award className="w-3 h-3 text-purple-500" />
                          Bonus:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateBonus(item.teamId, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.bonusPoints}
                            onChange={(e) => handleUpdateBonus(item.teamId, e.target.value)}
                            className="w-10 bg-white border border-slate-200 rounded py-0.5 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateBonus(item.teamId, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Live Calculation Pill */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">
                          {item.positionPoints}p + {item.killPoints}k
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {item.totalPoints} PTS
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </main>

          {/* STICKY FOOTER */}
          <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-600 space-y-1 sm:space-y-0">
                <div>
                  Ranked:{' '}
                  <strong className="text-slate-900">
                    {roundResultsData.filter((r) => r.position > 0).length}
                  </strong>{' '}
                  / {roundResultsData.length}
                </div>
                <div className="sm:ml-4 sm:inline">
                  Winner:{' '}
                  <strong className="text-amber-600">
                    {roundResultsData.find((r) => r.position === 1)?.teamName || 'None'}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPointsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveMatchResults}
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save & Update'}</span>
                </button>
              </div>
            </div>
          </footer>

          {/* Close on Escape key */}
          {typeof window !== 'undefined' && (
            <div
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setPointsModalOpen(false);
                }
              }}
              tabIndex={0}
              style={{ display: 'none' }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK ROOM CREDENTIALS DRAWER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(quickCredsMatch)}
        onClose={() => setQuickCredsMatch(null)}
        title={`Enter Room Credentials for ${quickCredsMatch?.title || 'Round'}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Saving credentials here will publish them live to verified players and automatically switch
            both the round and parent lobby status to <strong>RUNNING</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Room ID *
            </label>
            <input
              type="text"
              value={quickRoomId}
              onChange={(e) => setQuickRoomId(e.target.value)}
              placeholder="e.g. 784920"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Room Password *
            </label>
            <input
              type="text"
              value={quickRoomPassword}
              onChange={(e) => setQuickRoomPassword(e.target.value)}
              placeholder="e.g. uemjpass"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setQuickCredsMatch(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuickCreds}
              disabled={submitting || !quickRoomId.trim() || !quickRoomPassword.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer transition-all"
            >
              {submitting ? 'Publishing...' : 'Save & Set to Running'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: ROSTER INSPECTOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={viewingTeam ? `Roster: ${viewingTeam.teamName}` : 'Team Roster'}
      >
        {viewingTeam && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span>
                Captain: <strong className="text-slate-900">{viewingTeam.captain?.name || viewingTeam.leader || 'N/A'}</strong>
              </span>
              <span>
                Phone: <strong className="text-slate-900">{viewingTeam.captain?.phone || 'N/A'}</strong>
              </span>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Players ({viewingTeam.players?.length || 0})
              </h5>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(viewingTeam.players || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-slate-900 font-bold block">
                        {p.inGameName || p.user?.name || `Player ${idx + 1}`}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        IGN ID: {p.inGameId || 'N/A'}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                      {p.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setRosterModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
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
