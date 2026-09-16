import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import {
  Trophy,
  Swords,
  Users,
  Megaphone,
  Plus,
  GitBranch,
  Calendar,
  CheckCircle2,
  Edit,
  ExternalLink,
  Flame,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('tournaments'); // tournaments | matches | registrations | broadcasts
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [games, setGames] = useState([]);

  // Create Tournament Modal State
  const [createTourneyModal, setCreateTourneyModal] = useState(false);
  const [submittingTourney, setSubmittingTourney] = useState(false);
  const [tourneyForm, setTourneyForm] = useState({
    name: '',
    game: 'Valorant',
    description: '',
    format: 'Single Elimination',
    prizeTotal: 5000,
    entryFee: 0,
    maxTeams: 8,
    startDate: '',
    registrationDeadline: '',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    rules: 'Standard collegiate competitive rules apply. All players must be registered with college ID.',
  });

  // Edit Match Modal State
  const [editMatchModal, setEditMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchScoreA, setMatchScoreA] = useState(0);
  const [matchScoreB, setMatchScoreB] = useState(0);
  const [matchWinner, setMatchWinner] = useState('');
  const [matchStatus, setMatchStatus] = useState('scheduled');
  const [matchStreamUrl, setMatchStreamUrl] = useState('');
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Broadcast Modal State
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'general',
  });

  // Selected tournament filter for matches and registrations
  const [filterTournamentId, setFilterTournamentId] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [tournRes, matchRes, annRes, gameRes] = await Promise.allSettled([
        API.get('/tournaments'),
        API.get('/matches'),
        API.get('/announcements'),
        API.get('/games'),
      ]);

      if (tournRes.status === 'fulfilled') {
        setTournaments(tournRes.value.data.tournaments || []);
      }
      if (matchRes.status === 'fulfilled') {
        setMatches(matchRes.value.data.matches || []);
      }
      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value.data.announcements || []);
      }
      if (gameRes.status === 'fulfilled') {
        setGames(gameRes.value.data.games || []);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load organizer operational data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Bracket Handler
  const handleGenerateBracket = async (tId, tName) => {
    if (!window.confirm(`Generate playoff brackets for "${tName}"? This will auto-create match fixtures for registered teams.`)) {
      return;
    }

    try {
      const res = await API.post(`/tournaments/${tId}/generate-bracket`);
      addToast(res.data?.message || 'Brackets and match fixtures generated successfully!', 'success');
      fetchAllData();
    } catch (err) {
      addToast(
        err.response?.data?.message || 'Failed to generate bracket. At least 2 registered teams required.',
        'error'
      );
    }
  };

  // Create Tournament Handler
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      setSubmittingTourney(true);
      await API.post('/tournaments', {
        ...tourneyForm,
        prizePool: { total: Number(tourneyForm.prizeTotal) },
      });
      addToast('Tournament created successfully!', 'success');
      setCreateTourneyModal(false);
      fetchAllData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create tournament', 'error');
    } finally {
      setSubmittingTourney(false);
    }
  };

  // Open Edit Match Modal
  const handleOpenEditMatch = (m) => {
    setSelectedMatch(m);
    setMatchScoreA(m.scoreA || 0);
    setMatchScoreB(m.scoreB || 0);
    setMatchWinner(m.winner?._id || m.winner || '');
    setMatchStatus(m.status || 'scheduled');
    setMatchStreamUrl(m.streamUrl || '');
    setEditMatchModal(true);
  };

  // Submit Match Updates
  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    try {
      setSubmittingMatch(true);
      await API.put(`/matches/${selectedMatch._id}`, {
        scoreA: Number(matchScoreA),
        scoreB: Number(matchScoreB),
        winner: matchWinner || null,
        status: matchStatus,
        streamUrl: matchStreamUrl,
      });

      addToast('Match score & status updated successfully!', 'success');
      setEditMatchModal(false);
      fetchAllData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update match', 'error');
    } finally {
      setSubmittingMatch(false);
    }
  };

  // Submit Broadcast Announcement
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    try {
      setSubmittingBroadcast(true);
      await API.post('/announcements', broadcastForm);
      addToast('Broadcast published to all players!', 'success');
      setBroadcastModal(false);
      setBroadcastForm({ title: '', content: '', priority: 'medium', category: 'general' });
      fetchAllData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to publish broadcast', 'error');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  // Filtered matches
  const filteredMatches =
    filterTournamentId === 'all'
      ? matches
      : matches.filter((m) => (m.tournament?._id || m.tournament) === filterTournamentId);

  // Selected tournament for registrations
  const selectedTourneyForRegs =
    filterTournamentId === 'all'
      ? tournaments[0]
      : tournaments.find((t) => t._id === filterTournamentId);

  if (loading) {
    return <Loading message="Loading Tournament Operations Hub..." />;
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Organizer Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono">
                Tournament Director Suite
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.college || 'UEM Jaipur Esports'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
              ORGANIZER CONTROL ROOM
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Welcome back, {user?.name}. Orchestrate tournaments, generate playoff brackets, manage real-time match scoring, and publish announcements.
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setCreateTourneyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Create Tournament</span>
            </button>
            <button
              onClick={() => setBroadcastModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-cyan-400" />
              <span>Broadcast</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tournaments
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {tournaments.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold font-mono">Managed</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Matches
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Swords className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {matches.length}
            </span>
            <span className="text-[11px] text-cyan-400 font-semibold font-mono">Fixtures</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Teams
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {tournaments.reduce((acc, t) => acc + (t.registeredTeams?.length || 0), 0)}
            </span>
            <span className="text-[11px] text-indigo-400 font-semibold font-mono">Registrations</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Broadcasts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {announcements.length}
            </span>
            <span className="text-[11px] text-amber-400 font-semibold font-mono">Published</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'tournaments'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Tournaments & Brackets</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Match Operations & Scores</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'registrations'
              ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registration Review</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'broadcasts'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcasts ({announcements.length})</span>
        </button>
      </div>

      {/* TAB 1: TOURNAMENTS & BRACKETS */}
      {activeTab === 'tournaments' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
              Active & Upcoming Tournaments ({tournaments.length})
            </h2>
            <button
              onClick={() => setCreateTourneyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Tournament
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const regCount = t.registeredTeams?.length || 0;
              const maxTeams = t.maxTeams || 16;
              const hasBracket = t.bracket?.length > 0;

              return (
                <div
                  key={t._id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={
                        t.banner ||
                        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/40 font-mono">
                        {t.game?.title || t.game || 'Esports'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                          t.status === 'ongoing'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                            : t.status === 'registration_open' || t.status === 'upcoming'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-black text-white font-mono truncate">
                        {t.name}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-mono">
                        Prize: ₹{t.prizePool?.total?.toLocaleString() || '5,000'} • {t.format}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Squads Registered:</span>
                        <span className="font-mono font-bold text-white">
                          {regCount} / {maxTeams}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, (regCount / maxTeams) * 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-slate-400 pt-1">
                        <span>Playoff Bracket:</span>
                        <span
                          className={`font-bold font-mono ${
                            hasBracket ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {hasBracket ? 'Seeded & Active' : 'Not Generated'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleGenerateBracket(t._id, t.name)}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{hasBracket ? 'Regenerate Brackets' : 'Generate Brackets'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/tournaments/${t._id}`}
                          className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs text-center transition-colors flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View Public Page
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: MATCH OPERATIONS & SCORES */}
      {activeTab === 'matches' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                Match Scoring & Live Fixtures
              </h2>
              <p className="text-xs text-slate-400">
                Update match outcomes, rounds, winner declarations, and broadcast streams.
              </p>
            </div>

            {/* Tournament Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterTournamentId}
                onChange={(e) => setFilterTournamentId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Tournaments</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <EmptyState
              icon={Swords}
              title="No match fixtures found"
              description="Generate playoff brackets from the Tournaments tab to create match fixtures automatically."
              action={
                <button
                  onClick={() => setActiveTab('tournaments')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Go to Tournaments
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((m) => {
                const team1Name = m.team1?.name || 'TBD (Seed 1)';
                const team2Name = m.team2?.name || 'TBD (Seed 2)';
                const winnerName = m.winner?.name || (m.winner ? 'Winner Declared' : null);

                return (
                  <div
                    key={m._id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-400 font-bold">
                        {m.tournament?.name || 'Playoff Stage'} • Round {m.round || 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          m.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : m.status === 'ongoing'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    {/* Match Score Display */}
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm text-white truncate">{team1Name}</p>
                        <p className="text-[11px] text-slate-500">Seed A</p>
                      </div>

                      <div className="px-4 flex items-center gap-3 font-mono font-black text-xl text-white">
                        <span className={m.winner?._id === m.team1?._id ? 'text-emerald-400' : ''}>
                          {m.scoreA ?? 0}
                        </span>
                        <span className="text-slate-600 text-sm">:</span>
                        <span className={m.winner?._id === m.team2?._id ? 'text-emerald-400' : ''}>
                          {m.scoreB ?? 0}
                        </span>
                      </div>

                      <div className="flex-1 text-right">
                        <p className="font-bold text-sm text-white truncate">{team2Name}</p>
                        <p className="text-[11px] text-slate-500">Seed B</p>
                      </div>
                    </div>

                    {winnerName && (
                      <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Winner: {winnerName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleOpenEditMatch(m)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Update Scores & Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: REGISTRATIONS REVIEW */}
      {activeTab === 'registrations' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                Collegiate Roster Registrations
              </h2>
              <p className="text-xs text-slate-400">
                Review squads entered in each collegiate tournament.
              </p>
            </div>

            <select
              value={filterTournamentId}
              onChange={(e) => setFilterTournamentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Select Tournament to Inspect</option>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.registeredTeams?.length || 0} teams)
                </option>
              ))}
            </select>
          </div>

          {selectedTourneyForRegs?.registeredTeams?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTourneyForRegs.registeredTeams.map((reg, idx) => {
                const team = reg.team || {};
                return (
                  <div
                    key={team._id || idx}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-mono text-[10px] font-bold">
                        Seed #{idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {reg.registeredAt
                          ? new Date(reg.registeredAt).toLocaleDateString()
                          : 'Registered'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-indigo-300">
                        {team.tag || team.name?.slice(0, 3)?.toUpperCase() || 'SQD'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm leading-tight">
                          {team.name || 'Unnamed Squad'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Captain: {team.captain?.name || 'Captain Assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Roster size: {team.members?.length || 5} players</span>
                      <span className="text-emerald-400 font-mono font-bold">Verified</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No registrations in this tournament yet"
              description="Share the tournament link with students or promote it via Announcements to attract squads."
            />
          )}
        </section>
      )}

      {/* TAB 4: BROADCASTS */}
      {activeTab === 'broadcasts' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                Campus Arena Broadcasts & Alerts
              </h2>
              <p className="text-xs text-slate-400">
                Announcements published here appear immediately in player dashboards and news feeds.
              </p>
            </div>
            <button
              onClick={() => setBroadcastModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5" /> Publish Broadcast
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        ann.priority === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {ann.priority || 'medium'}
                    </span>
                    <h3 className="font-bold text-white text-base">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: CREATE TOURNAMENT */}
      <Modal
        isOpen={createTourneyModal}
        onClose={() => setCreateTourneyModal(false)}
        title="Create Collegiate Tournament"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateTournament} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Tournament Title
              </label>
              <input
                type="text"
                required
                value={tourneyForm.name}
                onChange={(e) => setTourneyForm({ ...tourneyForm, name: e.target.value })}
                placeholder="e.g. UEM Valorant Championship 2026"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Esports Game
              </label>
              <select
                value={tourneyForm.game}
                onChange={(e) => setTourneyForm({ ...tourneyForm, game: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {games.length > 0 ? (
                  games.map((g) => (
                    <option key={g._id} value={g.name}>
                      {g.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Valorant">Valorant</option>
                    <option value="BGMI">BGMI</option>
                    <option value="CS2">CS2</option>
                    <option value="Rocket League">Rocket League</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Format
              </label>
              <select
                value={tourneyForm.format}
                onChange={(e) => setTourneyForm({ ...tourneyForm, format: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Single Elimination">Single Elimination</option>
                <option value="Double Elimination">Double Elimination</option>
                <option value="Round Robin">Round Robin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Prize Pool (INR)
              </label>
              <input
                type="number"
                value={tourneyForm.prizeTotal}
                onChange={(e) => setTourneyForm({ ...tourneyForm, prizeTotal: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Max Squads
              </label>
              <input
                type="number"
                value={tourneyForm.maxTeams}
                onChange={(e) => setTourneyForm({ ...tourneyForm, maxTeams: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Description & Overview
            </label>
            <textarea
              rows={3}
              value={tourneyForm.description}
              onChange={(e) => setTourneyForm({ ...tourneyForm, description: e.target.value })}
              placeholder="Provide event details, match day schedule, and streaming channels..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateTourneyModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTourney}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submittingTourney ? 'Publishing...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT MATCH / LIVE SCORING */}
      <Modal
        isOpen={editMatchModal}
        onClose={() => setEditMatchModal(false)}
        title="Update Match Scores & Status"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateMatch} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs text-cyan-400">
            {selectedMatch?.team1?.name || 'Seed 1'} vs {selectedMatch?.team2?.name || 'Seed 2'}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {selectedMatch?.team1?.name || 'Seed A'} Score
              </label>
              <input
                type="number"
                value={matchScoreA}
                onChange={(e) => setMatchScoreA(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {selectedMatch?.team2?.name || 'Seed B'} Score
              </label>
              <input
                type="number"
                value={matchScoreB}
                onChange={(e) => setMatchScoreB(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono text-center focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Match Status
              </label>
              <select
                value={matchStatus}
                onChange={(e) => setMatchStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Live / Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Winner Declaration
              </label>
              <select
                value={matchWinner}
                onChange={(e) => setMatchWinner(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">None / Pending</option>
                {selectedMatch?.team1 && (
                  <option value={selectedMatch.team1._id || selectedMatch.team1}>
                    {selectedMatch.team1.name}
                  </option>
                )}
                {selectedMatch?.team2 && (
                  <option value={selectedMatch.team2._id || selectedMatch.team2}>
                    {selectedMatch.team2.name}
                  </option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Live Stream / VOD Link (Optional)
            </label>
            <input
              type="text"
              value={matchStreamUrl}
              onChange={(e) => setMatchStreamUrl(e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditMatchModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingMatch}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submittingMatch ? 'Saving...' : 'Save Match Results'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: BROADCAST ANNOUNCEMENT */}
      <Modal
        isOpen={broadcastModal}
        onClose={() => setBroadcastModal(false)}
        title="Publish Campus Broadcast"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Broadcast Title
            </label>
            <input
              type="text"
              required
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              placeholder="e.g. Schedule Change: Valorant Finals moved to 8 PM"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Priority
            </label>
            <select
              value={broadcastForm.priority}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="low">Low - General Info</option>
              <option value="medium">Medium - Important Update</option>
              <option value="high">High - Urgent Alert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Broadcast Content
            </label>
            <textarea
              rows={4}
              required
              value={broadcastForm.content}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
              placeholder="Full announcement message seen by all collegiate athletes..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setBroadcastModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBroadcast}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submittingBroadcast ? 'Broadcasting...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizerDashboard;
