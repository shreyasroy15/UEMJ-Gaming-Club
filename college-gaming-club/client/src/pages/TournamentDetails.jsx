import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import TournamentBracket from '../components/Leaderboard/TournamentBracket';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Calendar,
  Users,
  ShieldCheck,
  Clock,
  Swords,
  ScrollText,
  Radio,
  Sparkles,
  Award,
  Video,
  ExternalLink,
  ChevronRight,
  Settings,
  ShieldAlert,
  LogIn,
  UserPlus,
  CheckCircle2,
  Lock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';

const TournamentDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isStaff } = useAuth();
  const { addToast } = useToast();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [lobbies, setLobbies] = useState([]);
  const [publicTeams, setPublicTeams] = useState([]);
  const [userSquad, setUserSquad] = useState(null);

  // Sync activeTab with URL tab query parameter (e.g. ?tab=matches)
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    urlTab && ['overview', 'rules', 'teams', 'matches', 'leaderboard', 'bracket'].includes(urlTab)
      ? urlTab
      : 'overview'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'rules', 'teams', 'matches', 'leaderboard', 'bracket'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Lobby and points table filters
  const [activeLobbyFilter, setActiveLobbyFilter] = useState('all');
  const [pointsLobbyFilter, setPointsLobbyFilter] = useState('all');
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [pointsSearch, setPointsSearch] = useState('');

  // Registration Modal (Team Name + Team Type or Join via Code)
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerModalTab, setRegisterModalTab] = useState('create'); // 'create' | 'join'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamType, setNewTeamType] = useState('UEM Student Team');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [joiningTeam, setJoiningTeam] = useState(false);

  // Match score update modal for staff/admin
  const [editMatchModal, setEditMatchModal] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winnerId, setWinnerId] = useState('');
  const [matchStatus, setMatchStatus] = useState('scheduled');
  const [updatingMatch, setUpdatingMatch] = useState(false);

  // Deregistration State
  const [deregisterModalOpen, setDeregisterModalOpen] = useState(false);
  const [deregistering, setDeregistering] = useState(false);

  useEffect(() => {
    fetchTournamentDetails();
  }, [id, user]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const [tRes, pRes] = await Promise.all([
        API.get(`/tournaments/${id}`),
        API.get(`/tournaments/${id}/public-teams`).catch(() => ({ data: { teams: [] } })),
      ]);

      if (tRes.data.success) {
        setTournament(tRes.data.tournament);
        setMatches(tRes.data.matches || []);
        setLobbies(tRes.data.lobbies || []);
        setPublicTeams(pRes.data?.teams || []);

        // Check if current user is registered in this tournament
        if (user) {
          try {
            const myRegs = await API.get('/registrations/my-tournaments');
            if (myRegs.data.success) {
              const matched = (myRegs.data.registrations || []).find(
                (r) => (r.tournament?._id || r.tournament) === (tRes.data.tournament._id || id)
              );
              setUserSquad(matched || null);
            } else {
              setUserSquad(null);
            }
          } catch (e) {
            console.error(e);
            setUserSquad(null);
          }
        } else {
          setUserSquad(null);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournament details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isUserRegistered = Boolean(isAuthenticated && user && userSquad);

  const handleOpenRegister = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (user.role !== 'student' && user.role !== 'admin') {
      addToast('Only authenticated college students can register for tournaments', 'error');
      return;
    }
    if (isUserRegistered) {
      addToast('You are already registered for this tournament', 'info');
      return;
    }
    setNewTeamName('');
    setNewTeamType('UEM Student Team');
    setJoinTeamCode('');
    setRegisterModalTab('create');
    setRegisterModalOpen(true);
  };

  const handleOpenJoinCode = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (user.role !== 'student' && user.role !== 'admin') {
      addToast('Only authenticated college students can register for tournaments', 'error');
      return;
    }
    if (isUserRegistered) {
      addToast('You are already registered for this tournament', 'info');
      return;
    }
    setJoinTeamCode('');
    setRegisterModalTab('join');
    setRegisterModalOpen(true);
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      addToast('Please enter a team name', 'error');
      return;
    }

    try {
      setCreatingTeam(true);
      const res = await API.post(`/tournaments/${tournament._id}/registrations/create-team`, {
        teamName: newTeamName.trim(),
        teamType: newTeamType,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Squad created successfully!', 'success');
        setRegisterModalOpen(false);
        setUserSquad(res.data.registration);
        navigate(`/tournaments/${tournament.slug || tournament._id}/register`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create team', 'error');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleJoinTeamSubmit = async (e) => {
    e.preventDefault();
    if (!joinTeamCode.trim()) {
      addToast('Please enter a team invite code', 'error');
      return;
    }

    try {
      setJoiningTeam(true);
      const res = await API.post('/registrations/join', {
        teamCode: joinTeamCode.trim().toUpperCase(),
      });

      if (res.data.success) {
        addToast(res.data.message || 'Joined squad successfully!', 'success');
        setRegisterModalOpen(false);
        fetchTournamentDetails();
        navigate(`/tournaments/${res.data.tournamentSlug || tournament.slug || tournament._id}/register`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join team', 'error');
    } finally {
      setJoiningTeam(false);
    }
  };

  const handleDeregister = async () => {
    try {
      setDeregistering(true);
      const res = await API.post(`/tournaments/${tournament._id}/deregister`);
      if (res.data.success) {
        addToast(res.data.message || 'Successfully deregistered from tournament', 'success');
        setUserSquad(null);
        setDeregisterModalOpen(false);
        fetchTournamentDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to deregister', 'error');
    } finally {
      setDeregistering(false);
    }
  };

  // Match Click (admin can edit score)
  const handleMatchClick = (match) => {
    if (!isStaff) return;
    setEditMatchModal(match);
    setScoreA(match.scoreA || 0);
    setScoreB(match.scoreB || 0);
    setWinnerId(match.winner?._id || '');
    setMatchStatus(match.status || 'scheduled');
  };

  const handleSaveMatchScore = async (e) => {
    e.preventDefault();
    if (!editMatchModal) return;

    try {
      setUpdatingMatch(true);
      const res = await API.put(`/matches/${editMatchModal._id}`, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        winner: winnerId || null,
        status: matchStatus,
      });

      if (res.data.success) {
        addToast('Match updated successfully', 'success');
        setEditMatchModal(null);
        fetchTournamentDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update match', 'error');
    } finally {
      setUpdatingMatch(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast(`Copied ${key.includes('pass') ? 'Password' : 'Room ID'} to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Real points table computed from matches results and public registered squads
  const computedStandings = useMemo(() => {
    // 1. Map registered teams
    const teamMap = {};
    (publicTeams || []).forEach((t) => {
      const tid = t._id?.toString();
      if (!tid) return;
      teamMap[tid] = {
        teamId: tid,
        teamName: t.teamName || 'Squad',
        teamTag: t.teamTag || '',
        teamLogo: t.teamLogo || null,
        captain: t.captain?.name || t.leader?.name || 'N/A',
        matchesPlayed: Number(t.matchesPlayed || 0),
        wins: 0,
        kills: 0,
        positionPoints: 0,
        killPoints: 0,
        bonusPoints: 0,
        totalPoints: Number(t.points || 0),
        lobbies: new Set(),
      };
    });

    // 2. Map lobby assignments
    (lobbies || []).forEach((l) => {
      const lid = l._id?.toString();
      (l.teams || []).forEach((lt) => {
        const ltid = (lt._id || lt).toString();
        if (teamMap[ltid]) {
          teamMap[ltid].lobbies.add(lid);
        }
      });
    });

    // 3. Process matches (results, winner, kills, position points)
    const completedMatches = (matches || []).filter(
      (m) => m.status === 'completed' || (m.results && m.results.length > 0)
    );

    let hasResults = false;
    completedMatches.forEach((m) => {
      const lid = (m.lobbyId || m.lobby?._id || m.lobby)?.toString();

      if (m.winner) {
        const wid = (m.winner._id || m.winner).toString();
        if (teamMap[wid]) {
          teamMap[wid].wins += 1;
        }
      }

      if (m.results && m.results.length > 0) {
        hasResults = true;
        m.results.forEach((r) => {
          const tid = (r.team?._id || r.team || r.teamId)?.toString();
          if (tid && teamMap[tid]) {
            teamMap[tid].kills += Number(r.kills || 0);
            teamMap[tid].positionPoints += Number(r.positionPoints || 0);
            teamMap[tid].killPoints += Number(r.killPoints || (r.kills || 0));
            teamMap[tid].bonusPoints += Number(r.bonusPoints || 0);
            if (lid) teamMap[tid].lobbies.add(lid);
          } else if (tid) {
            teamMap[tid] = {
              teamId: tid,
              teamName: r.teamName || r.team?.teamName || 'Squad',
              teamTag: r.teamTag || r.team?.teamTag || '',
              teamLogo: r.team?.teamLogo || null,
              captain: r.team?.captain?.name || 'N/A',
              matchesPlayed: 1,
              wins: (m.winner?._id || m.winner)?.toString() === tid ? 1 : 0,
              kills: Number(r.kills || 0),
              positionPoints: Number(r.positionPoints || 0),
              killPoints: Number(r.killPoints || (r.kills || 0)),
              bonusPoints: Number(r.bonusPoints || 0),
              totalPoints: Number(r.totalPoints || 0),
              lobbies: new Set(lid ? [lid] : []),
            };
          }
        });
      }
    });

    // Recalculate total points if results exist
    if (hasResults) {
      Object.values(teamMap).forEach((t) => {
        const sumPts = t.positionPoints + t.killPoints + t.bonusPoints;
        if (sumPts > 0 || t.totalPoints === 0) {
          t.totalPoints = sumPts;
        }
      });
    }

    let list = Object.values(teamMap);

    // Filter by Lobby if not 'all'
    if (pointsLobbyFilter && pointsLobbyFilter !== 'all') {
      list = list.filter((t) => t.lobbies.has(pointsLobbyFilter));
    }

    return list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.kills - a.kills;
    });
  }, [publicTeams, matches, lobbies, pointsLobbyFilter]);

  const filteredMatches = useMemo(() => {
    if (activeLobbyFilter === 'all') return matches;
    return matches.filter((m) => {
      const lid = (m.lobbyId || m.lobby?._id || m.lobby)?.toString();
      const matchLobbyName = (m.lobbyName || '').toLowerCase().trim();
      const targetLobby = (lobbies || []).find((l) => l._id?.toString() === activeLobbyFilter);
      const targetName = (targetLobby?.name || '').toLowerCase().trim();
      return lid === activeLobbyFilter || (targetName && matchLobbyName === targetName);
    });
  }, [matches, activeLobbyFilter, lobbies]);

  if (loading) return <Loading message="Loading tournament specifications..." />;
  if (!tournament) return <EmptyState title="Tournament Not Found" description="The requested tournament does not exist." />;

  const isRegistrationOpen =
    (tournament.status === 'upcoming' || tournament.status === 'registration-open') &&
    new Date() < new Date(tournament.registrationDeadline) &&
    tournament.registeredTeams?.length < tournament.maxTeams;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rules', label: 'Rules' },
    { id: 'teams', label: `Teams (${publicTeams.length || tournament.registeredTeams?.length || 0})` },
    { id: 'matches', label: `Lobbies & Matches (${matches.length})` },
    { id: 'leaderboard', label: 'Points Table' },
    { id: 'bracket', label: 'Bracket' },
  ];

  return (
    <div className="py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Tournament Banner Header */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="relative h-48 sm:h-72 md:h-80 w-full overflow-hidden">
          <img
            src={tournament.banner}
            alt={tournament.name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        {/* Content over banner */}
        <div className="p-4 sm:p-6 md:p-8 -mt-12 sm:-mt-24 relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-2xl min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-cyan-950/90 text-cyan-400 border border-cyan-500/40">
                {tournament.game}
              </span>
              <span
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border font-mono ${
                  tournament.status === 'live'
                    ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : tournament.status === 'ongoing'
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : tournament.status === 'on-hold'
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : tournament.status === 'registration-open'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : tournament.status === 'completed'
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : tournament.status === 'cancelled'
                    ? 'bg-red-950 text-red-400 border-red-800'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {tournament.status === 'live'
                  ? '● LIVE ARENA'
                  : tournament.status === 'ongoing'
                  ? '● RUNNING TOURNAMENT'
                  : tournament.status === 'on-hold'
                  ? '⏸️ TOURNAMENT ON HOLD'
                  : tournament.status === 'registration-open'
                  ? 'Registration Open'
                  : tournament.status === 'completed'
                  ? 'Completed'
                  : tournament.status === 'cancelled'
                  ? 'Cancelled'
                  : 'Upcoming'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400">
                Organized by <strong>{tournament.organizer || 'UEM Gaming Club'}</strong>
              </span>
            </div>

            <h1 className="text-xl min-[420px]:text-2xl sm:text-4xl md:text-5xl font-black text-white font-mono leading-tight break-words">
              {tournament.name}
            </h1>
          </div>

          {/* Action Button & Live Stream */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {tournament.streamUrl && tournament.status === 'live' && (
              <a
                href={tournament.streamUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <Video className="w-4 h-4 shrink-0" /> Watch Live Stream
              </a>
            )}

            {isUserRegistered ? (
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <span className="px-3.5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> REGISTERED
                </span>
                <Link
                  to={`/tournaments/${tournament._id}/register`}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider text-center shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  View Your Squad ({userSquad.teamName})
                </Link>
                <button
                  type="button"
                  onClick={() => setDeregisterModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  DE-REGISTER
                </button>
              </div>
            ) : isRegistrationOpen ? (
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> REGISTER / CREATE SQUAD
                </button>
                <button
                  type="button"
                  onClick={handleOpenJoinCode}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/90 border border-indigo-500/40 text-indigo-300 font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> JOIN WITH TEAM CODE
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-900 bg-slate-950/80 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 text-center py-2 sm:py-4">
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Prize Pool</span>
            <span className="text-xs sm:text-base font-black text-amber-400 font-mono">
              {tournament.prizePool?.currency || '₹'} {tournament.prizePool?.total?.toLocaleString()}
            </span>
          </div>
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Format</span>
            <span className="text-xs sm:text-base font-bold text-white font-mono truncate">{tournament.format}</span>
          </div>
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Registration</span>
            <span className="text-xs sm:text-base font-bold text-cyan-400 font-mono">
              {tournament.registeredTeams?.length || 0} / {tournament.maxTeams} Teams
            </span>
          </div>
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Entry Fee</span>
            <span className="text-xs sm:text-base font-bold text-emerald-400 font-mono">
              {tournament.entryFee === 0 ? 'Free Entry' : `₹${tournament.entryFee}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-none touch-pan-x pb-0.5 -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchParams({ tab: tab.id });
            }}
            className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 font-mono transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <h3 className="text-lg font-bold text-white font-mono">About the Tournament</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {tournament.description}
                </p>
              </div>

              {/* Prize Pool Breakdown */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Prize Distribution
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                    <span className="text-2xl block mb-1">🥇</span>
                    <span className="text-xs text-amber-400 uppercase font-bold">1st Place</span>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      ₹{tournament.prizePool?.first?.toLocaleString() || (tournament.prizePool?.total * 0.6).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center">
                    <span className="text-2xl block mb-1">🥈</span>
                    <span className="text-xs text-slate-300 uppercase font-bold">2nd Place</span>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      ₹{tournament.prizePool?.second?.toLocaleString() || (tournament.prizePool?.total * 0.25).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-700/30 text-center">
                    <span className="text-2xl block mb-1">🥉</span>
                    <span className="text-xs text-amber-600 uppercase font-bold">3rd Place</span>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      ₹{tournament.prizePool?.third?.toLocaleString() || (tournament.prizePool?.total * 0.15).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule & Rules Quick Card */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                <h3 className="text-base font-bold text-white font-mono">Tournament Schedule</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Registration Deadline</span>
                    <span className="text-slate-200 font-semibold font-mono">
                      {new Date(tournament.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Tournament Start</span>
                    <span className="text-cyan-400 font-semibold font-mono">
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Status</span>
                    <span className="uppercase font-bold text-white font-mono">
                      {tournament.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. RULES */}
        {activeTab === 'rules' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-cyan-400" /> Tournament Guidelines & Code of Conduct
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {tournament.rules?.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. TEAMS */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">
                Registered Squads ({publicTeams.length > 0 ? publicTeams.length : tournament.registeredTeams?.length || 0})
              </h3>
            </div>

            {publicTeams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTeams.map((team, idx) => (
                  <div
                    key={team._id || idx}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={team.teamLogo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80'}
                        alt={team.teamName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-mono truncate">{team.teamName}</h4>
                          {team.teamTag && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 font-mono">
                              {team.teamTag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          Captain: <strong>{team.captain?.name}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            {team.status === 'verified' ? '✓ Verified' : '✓ Registered'}
                          </span>
                          {(lobbies || [])
                            .filter((l) => (l.teams || []).some((lt) => (lt._id || lt).toString() === (team._id || team).toString()))
                            .map((l) => (
                              <span
                                key={l._id}
                                className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-amber-950 text-amber-300 border border-amber-800/60"
                              >
                                🏢 {l.name}
                              </span>
                            ))}
                          {Number(team.points || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                              ⭐ {team.points} PTS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Public Player Roster List */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Squad Roster:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {team.players?.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 flex items-center gap-1"
                          >
                            <span className="text-slate-500 text-[9px]">{p.role === 'captain' ? '👑' : `#${p.slotNumber}`}</span>
                            {p.ign || p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tournament.registeredTeams?.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams registered yet"
                description="Be the first team to claim a slot in this championship."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournament.registeredTeams?.map((reg, idx) => {
                  const team = reg.team;
                  if (!team) return null;
                  return (
                    <div
                      key={team._id || idx}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4"
                    >
                      <img
                        src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80'}
                        alt={team.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-mono truncate">{team.name}</h4>
                          {team.tag && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300">
                              {team.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          Captain: {team.captain?.name || team.captain?.username || 'Active'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Registered {new Date(reg.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. MATCHES & LOBBIES */}
        {activeTab === 'matches' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Swords className="w-5 h-5 text-cyan-400" /> Matches & Lobbies
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  View scheduled, live, and completed matches along with room credentials.
                </p>
              </div>
              {isStaff && (
                <span className="text-xs text-fuchsia-400 font-mono bg-fuchsia-950/40 border border-fuchsia-800/60 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  💡 Tip: Click any match card to update score or declare winner
                </span>
              )}
            </div>

            {/* Lobby Filter Pills */}
            {lobbies.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveLobbyFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeLobbyFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  All Matches ({matches.length})
                </button>
                {lobbies.map((lob) => {
                  const lobMatchCount = matches.filter(
                    (m) =>
                      (m.lobbyId || m.lobby?._id || m.lobby)?.toString() === lob._id?.toString() ||
                      (m.lobbyName || '').toLowerCase().trim() === lob.name.toLowerCase().trim()
                  ).length;
                  return (
                    <button
                      key={lob._id}
                      type="button"
                      onClick={() => setActiveLobbyFilter(lob._id)}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        activeLobbyFilter === lob._id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>🏢 {lob.name}</span>
                      {lob.status === 'running' ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          ● Running
                        </span>
                      ) : lob.status === 'on-hold' ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ⏸️ On Hold
                        </span>
                      ) : null}
                      <span className="text-[10px] opacity-75">
                        ({lobMatchCount} matches • {lob.teams?.length || 0} teams)
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredMatches.length === 0 ? (
              <EmptyState
                icon={Swords}
                title={activeLobbyFilter === 'all' ? 'No matches scheduled' : 'No matches for this lobby'}
                description={
                  activeLobbyFilter === 'all'
                    ? 'Match fixtures will be generated once registrations close.'
                    : 'Select another lobby or check back once fixtures are generated.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMatches.map((match) => {
                  const isLobbyMatch = Boolean(
                    match.lobbyName || match.stageName || (match.teams && match.teams.length > 0)
                  );
                  const isLobbyUser = Boolean(
                    isStaff ||
                    match.isAssignedToThisLobby ||
                    (userSquad && (match.teams || []).some((t) => (t._id || t).toString() === userSquad._id?.toString())) ||
                    (user && (match.teams || []).some((t) => {
                      const capId = (t.captain?._id || t.captain)?.toString();
                      const leadId = (t.leader?._id || t.leader)?.toString();
                      if (capId === user._id?.toString() || leadId === user._id?.toString()) return true;
                      return (t.players || []).some((p) => (p.user?._id || p.user)?.toString() === user._id?.toString());
                    }))
                  );

                  return (
                    <div
                      key={match._id}
                      onClick={() => handleMatchClick(match)}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isStaff ? 'cursor-pointer hover:border-cyan-400' : ''
                      } ${
                        match.status === 'live'
                          ? 'bg-rose-950/20 border-rose-500/60 shadow-lg shadow-rose-950/40'
                          : match.status === 'completed'
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-slate-900/40 border-slate-800/90'
                      }`}
                    >
                      {/* Match Header */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono font-bold text-white truncate">
                            {match.stageName || match.round || 'Stage 1'} •{' '}
                            {match.lobbyName ? `${match.lobbyName} • ` : ''}Match #{match.matchNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLobbyUser && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              ✓ Assigned Lobby
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                              match.status === 'live'
                                ? 'bg-rose-500 text-slate-950 animate-pulse font-black'
                                : match.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {match.status === 'live' ? '● LIVE NOW' : match.status}
                          </span>
                        </div>
                      </div>

                      {/* Map & Scheduled Time */}
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80">
                        <span className="flex items-center gap-1.5">
                          <span>🗺️ Map:</span>
                          <strong className="text-cyan-300">{match.map || 'Erangel'}</strong>
                        </span>
                        <span className="text-slate-400">
                          📅 {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBD'}
                        </span>
                      </div>

                      {/* Room Credentials Box */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                            <Key className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Room / Lobby Credentials</span>
                          </div>
                          {match.roomId ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                              Credentials Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-800">
                              Awaiting Room ID
                            </span>
                          )}
                        </div>

                        {match.roomId ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {/* Room ID Box */}
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-slate-400 text-[11px]">Room ID:</span>
                                <span className="text-cyan-300 font-bold tracking-wider truncate select-all">
                                  {match.roomId}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(match.roomId, `id-${match._id}`);
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors ml-2 shrink-0 cursor-pointer"
                                title="Copy Room ID"
                              >
                                {copiedKey === `id-${match._id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Room Password Box - Strictly for Lobby Users */}
                            {isLobbyUser ? (
                              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/30 text-xs font-mono">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-amber-400 font-bold text-[11px]">Pass:</span>
                                  <span className="text-amber-300 font-bold tracking-wider truncate">
                                    {showPasswords[match._id]
                                      ? match.roomPassword || 'None'
                                      : match.roomPassword
                                      ? '••••••••'
                                      : 'None'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 ml-2 shrink-0">
                                  {match.roomPassword && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPasswords((prev) => ({
                                          ...prev,
                                          [match._id]: !prev[match._id],
                                        }));
                                      }}
                                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                                      title={showPasswords[match._id] ? 'Hide Password' : 'Show Password'}
                                    >
                                      {showPasswords[match._id] ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                  {match.roomPassword && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(match.roomPassword, `pass-${match._id}`);
                                      }}
                                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                                      title="Copy Password"
                                    >
                                      {copiedKey === `pass-${match._id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Lock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                                  <span className="text-[11px] truncate">
                                    {isAuthenticated
                                      ? 'Password visible to assigned lobby squads'
                                      : 'Log in with assigned squad to view password'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold uppercase text-amber-400/80 shrink-0 ml-1">
                                  🔒 Locked
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                            <span>Room ID & Password will be posted by the admin before match start.</span>
                          </div>
                        )}
                      </div>

                      {/* Participating Squads in this match */}
                      {isLobbyMatch && (
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                            Participating Squads ({match.teams?.length || 0})
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {(match.teams || []).map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                              >
                                {t.teamName || t.name || 'Team'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Match Results preview if recorded */}
                      {match.results && match.results.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                            <Trophy className="w-3 h-3 text-amber-400" /> Match Leaderboard Results
                          </div>
                          <div className="space-y-1">
                            {match.results.slice(0, 3).map((res, rIdx) => (
                              <div key={rIdx} className="flex items-center justify-between text-slate-300">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-amber-400">
                                    {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : '🥉'} #{res.position || rIdx + 1}
                                  </span>
                                  <span className="truncate font-semibold">
                                    {res.teamName || res.team?.teamName || 'Squad'}
                                  </span>
                                </span>
                                <span className="text-right text-slate-400 shrink-0 font-bold">
                                  <span className="text-cyan-300">{res.kills || 0} kills</span> •{' '}
                                  <span className="text-amber-400">{res.totalPoints || 0} pts</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Winner Footer */}
                      {match.winner && (
                        <div className="pt-2 border-t border-slate-800/80 text-xs text-amber-400 flex items-center justify-center gap-1 font-mono">
                          <Trophy className="w-3.5 h-3.5" /> Winner: <strong>{match.winner?.teamName || match.winner?.name}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. BRACKET */}
        {activeTab === 'bracket' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Elimination Progression
              </h3>
              {isStaff && (
                <span className="text-xs text-fuchsia-400 font-mono">
                  (Click any match node to update scores)
                </span>
              )}
            </div>

            <TournamentBracket matches={matches} onMatchClick={handleMatchClick} />
          </div>
        )}

        {/* 6. POINTS TABLE / LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Tournament Points Table
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Live championship standings calculated from match positions, kill points, and bonus points.
                </p>
              </div>

              {/* Lobby Filter Pills for Points Table */}
              {lobbies.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setPointsLobbyFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                      pointsLobbyFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    Overall Standings
                  </button>
                  {lobbies.map((lob) => (
                    <button
                      key={lob._id}
                      type="button"
                      onClick={() => setPointsLobbyFilter(lob._id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                        pointsLobbyFilter === lob._id
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {lob.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top 3 Podium Highlights if we have standings */}
            {computedStandings.length >= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {computedStandings.slice(0, 3).map((team, idx) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  return (
                    <div
                      key={team.teamId}
                      className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between ${
                        isFirst
                          ? 'bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border-amber-500/50 shadow-lg shadow-amber-500/10'
                          : isSecond
                          ? 'bg-gradient-to-b from-slate-400/10 via-slate-950 to-slate-950 border-slate-600/50'
                          : 'bg-gradient-to-b from-amber-700/10 via-slate-950 to-slate-950 border-amber-700/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-black font-mono">
                          {isFirst ? '🥇 #1' : isSecond ? '🥈 #2' : '🥉 #3'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                          {isFirst ? '🏆 Leader' : isSecond ? 'Challenger' : 'Top 3'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-white text-base truncate">{team.teamName}</h4>
                        <p className="text-xs font-mono text-slate-400 truncate">Captain: {team.captain}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs">
                        <span className="text-slate-400">Wins: <strong className="text-emerald-400">{team.wins} 🍗</strong></span>
                        <span className="text-slate-400">Kills: <strong className="text-cyan-400">{team.kills}</strong></span>
                        <span className="text-amber-400 font-black text-sm">{team.totalPoints} PTS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search Input */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search squad name or tag..."
                  value={pointsSearch}
                  onChange={(e) => setPointsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total Squads: <strong>{computedStandings.length}</strong>
              </span>
            </div>

            {/* Standings Table */}
            {computedStandings.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No squads in this standings view"
                description="Squad points will update automatically when match results are recorded."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 -mx-3.5 sm:mx-0 touch-pan-x">
                <table className="w-full min-w-[620px] text-left text-xs sm:text-sm text-slate-200">
                  <thead className="bg-slate-900/90 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-16 text-center">Rank</th>
                      <th className="p-3">Squad / Team</th>
                      <th className="p-3 text-center">Matches</th>
                      <th className="p-3 text-center">Wins 🍗</th>
                      <th className="p-3 text-center">Kills 🎯</th>
                      <th className="p-3 text-center">Pos Pts</th>
                      <th className="p-3 text-center">Bonus</th>
                      <th className="p-3 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {computedStandings
                      .filter(
                        (t) =>
                          !pointsSearch.trim() ||
                          t.teamName.toLowerCase().includes(pointsSearch.toLowerCase()) ||
                          t.teamTag.toLowerCase().includes(pointsSearch.toLowerCase())
                      )
                      .map((team, idx) => {
                        const rank = idx + 1;
                        return (
                          <tr
                            key={team.teamId}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              rank === 1
                                ? 'bg-amber-950/20'
                                : rank === 2
                                ? 'bg-slate-800/20'
                                : rank === 3
                                ? 'bg-amber-900/10'
                                : ''
                            }`}
                          >
                            <td className="p-3 text-center font-bold">
                              {rank === 1 ? (
                                <span className="text-amber-400 font-black">🥇 #1</span>
                              ) : rank === 2 ? (
                                <span className="text-slate-300 font-black">🥈 #2</span>
                              ) : rank === 3 ? (
                                <span className="text-amber-600 font-black">🥉 #3</span>
                              ) : (
                                <span className="text-slate-500">#{rank}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {team.teamLogo ? (
                                  <img
                                    src={team.teamLogo}
                                    alt={team.teamName}
                                    className="w-6 h-6 rounded-md object-cover border border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                                    {team.teamName.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-white flex items-center gap-1.5 truncate">
                                    <span>{team.teamName}</span>
                                    {team.teamTag && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300">
                                        {team.teamTag}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    Cap: {team.captain}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">{team.matchesPlayed}</td>
                            <td className="p-3 text-center font-bold text-emerald-400">{team.wins}</td>
                            <td className="p-3 text-center font-bold text-cyan-300">{team.kills}</td>
                            <td className="p-3 text-center text-slate-300">{team.positionPoints}</td>
                            <td className="p-3 text-center text-slate-400">{team.bonusPoints}</td>
                            <td className="p-3 text-right font-black text-amber-400 text-sm">
                              {team.totalPoints} PTS
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tournament Registration Modal (Create Squad or Join via Team Code) */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={`Tournament Registration: ${tournament.name}`}
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setRegisterModalTab('create')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                registerModalTab === 'create'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👑 Create Team
            </button>
            <button
              type="button"
              onClick={() => setRegisterModalTab('join')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                registerModalTab === 'join'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Join with Code
            </button>
          </div>

          {registerModalTab === 'create' ? (
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Team Type *
                </label>
                <select
                  value={newTeamType}
                  onChange={(e) => setNewTeamType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="UEM Student Team">UEM Student Team</option>
                  <option value="Outside Team">Outside Team</option>
                  <option value="Mixed Team">Mixed Team</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={creatingTeam}
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {creatingTeam ? 'Creating Team...' : 'Create Team'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter the unique team invite code shared by your squad captain to join their tournament roster.
              </p>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Team Invite Code *
                </label>
                <input
                  type="text"
                  required
                  value={joinTeamCode}
                  onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BGMI-X7K29"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-base text-cyan-300 font-mono font-black uppercase tracking-wider focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={joiningTeam}
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joiningTeam}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {joiningTeam ? 'Verifying Code & Joining...' : 'Join Squad'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Staff Match Edit Score Modal */}
      <Modal
        isOpen={!!editMatchModal}
        onClose={() => setEditMatchModal(null)}
        title={`Edit Match Score (Match #${editMatchModal?.matchNumber})`}
      >
        <form onSubmit={handleSaveMatchScore} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {editMatchModal?.teamA?.name || 'Team A'} Score
              </label>
              <input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {editMatchModal?.teamB?.name || 'Team B'} Score
              </label>
              <input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Match Status
            </label>
            <select
              value={matchStatus}
              onChange={(e) => setMatchStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Match Winner
            </label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="">No winner decided yet</option>
              {editMatchModal?.teamA && (
                <option value={editMatchModal.teamA._id}>
                  {editMatchModal.teamA.name}
                </option>
              )}
              {editMatchModal?.teamB && (
                <option value={editMatchModal.teamB._id}>
                  {editMatchModal.teamB.name}
                </option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditMatchModal(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingMatch}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-black"
            >
              {updatingMatch ? 'Saving...' : 'Save Match'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Visitor Auth Modal */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required"
      >
        <div className="p-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">
              Authentication Required
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Please sign in or create an account to register for a tournament.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            <Link
              to="/login"
              state={{ from: `/tournaments/${id}` }}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
            <Link
              to="/register"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </Link>
          </div>
        </div>
      </Modal>

      {/* Deregistration Confirmation Modal */}
      <Modal
        isOpen={deregisterModalOpen}
        onClose={() => setDeregisterModalOpen(false)}
        title="Confirm Deregistration"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">
                Are you sure you want to deregister from {tournament?.name}?
              </p>
              <p className="text-slate-300">
                • If you are the Team Leader and your team has no other members, your team will be automatically disbanded.<br />
                • If your team has other members, team leadership will safely transfer to your teammate.<br />
                • Your registration state will be cleared so you can join or create another team.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={deregistering}
              onClick={() => setDeregisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deregistering}
              onClick={handleDeregister}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {deregistering ? 'Deregistering...' : 'Yes, De-register'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TournamentDetails;
