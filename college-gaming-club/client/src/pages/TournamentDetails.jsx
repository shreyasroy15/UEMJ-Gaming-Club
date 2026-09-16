import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';

const TournamentDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isStaff } = useAuth();
  const { addToast } = useToast();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Registration Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [registering, setRegistering] = useState(false);

  // Match score update modal for staff/admin
  const [editMatchModal, setEditMatchModal] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winnerId, setWinnerId] = useState('');
  const [matchStatus, setMatchStatus] = useState('scheduled');
  const [updatingMatch, setUpdatingMatch] = useState(false);

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tournaments/${id}`);
      if (res.data.success) {
        setTournament(res.data.tournament);
        setMatches(res.data.matches || []);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournament details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = () => {
    if (!isAuthenticated) {
      addToast('Please login to register a team', 'info');
      return;
    }
    setRegisterModalOpen(true);
    API.get('/teams')
      .then((res) => {
        const myTeams = (res.data.teams || []).filter(
          (t) => (t.captain?._id || t.captain) === user._id
        );
        setUserTeams(myTeams);
        if (myTeams.length > 0) setSelectedTeamId(myTeams[0]._id);
      })
      .catch((e) => console.error(e));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      addToast('Please select your team', 'error');
      return;
    }

    try {
      setRegistering(true);
      const res = await API.post(`/tournaments/${tournament._id}/register`, {
        teamId: selectedTeamId,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Team registered successfully!', 'success');
        setRegisterModalOpen(false);
        fetchTournamentDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
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

  if (loading) return <Loading message="Loading tournament specifications..." />;
  if (!tournament) return <EmptyState title="Tournament Not Found" description="The requested tournament does not exist." />;

  const isRegistrationOpen =
    tournament.status === 'upcoming' &&
    new Date() < new Date(tournament.registrationDeadline) &&
    tournament.registeredTeams?.length < tournament.maxTeams;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rules', label: 'Rules' },
    { id: 'teams', label: `Teams (${tournament.registeredTeams?.length || 0})` },
    { id: 'matches', label: `Matches (${matches.length})` },
    { id: 'bracket', label: 'Bracket' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Tournament Banner Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={tournament.banner}
            alt={tournament.name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        {/* Content over banner */}
        <div className="p-4 sm:p-8 -mt-16 sm:-mt-24 relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-cyan-950/90 text-cyan-400 border border-cyan-500/40">
                {tournament.game}
              </span>
              <span
                className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider border ${
                  tournament.status === 'live'
                    ? 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {tournament.status === 'live' ? '● LIVE ARENA' : tournament.status}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Organized by <strong>{tournament.organizer || 'UEM Gaming Club'}</strong>
              </span>
            </div>

            <h1 className="text-2xl min-[420px]:text-3xl sm:text-5xl font-black text-white font-mono leading-tight break-words">
              {tournament.name}
            </h1>
          </div>

          {/* Action Button & Live Stream */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {tournament.streamUrl && tournament.status === 'live' && (
              <a
                href={tournament.streamUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <Video className="w-4 h-4" /> Watch Live Stream
              </a>
            )}

            {isRegistrationOpen && (
              <button
                onClick={handleOpenRegister}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all"
              >
                Register Team
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-900 bg-slate-950/80 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 text-center py-2 sm:py-4">
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Prize Pool</span>
            <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
              {tournament.prizePool?.currency || '₹'} {tournament.prizePool?.total?.toLocaleString()}
            </span>
          </div>
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Format</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">{tournament.format}</span>
          </div>
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Registration</span>
            <span className="text-sm sm:text-base font-bold text-cyan-400 font-mono">
              {tournament.registeredTeams?.length || 0} / {tournament.maxTeams} Teams
            </span>
          </div>
          <div className="p-2 sm:p-0">
            <span className="block text-[10px] text-slate-500 uppercase font-bold">Entry Fee</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {tournament.entryFee === 0 ? 'Free Entry' : `₹${tournament.entryFee}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-5 text-sm font-bold uppercase tracking-wider border-b-2 font-mono transition-all whitespace-nowrap ${
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
                Registered Squads ({tournament.registeredTeams?.length || 0})
              </h3>
            </div>

            {tournament.registeredTeams?.length === 0 ? (
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

        {/* 4. MATCHES */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">
                Matches & Fixtures
              </h3>
              {isStaff && (
                <span className="text-xs text-fuchsia-400 font-mono">
                  (Click any match card to update score/winner)
                </span>
              )}
            </div>

            {matches.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="No matches scheduled"
                description="Match fixtures will be generated once registrations close."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => (
                  <div
                    key={match._id}
                    onClick={() => handleMatchClick(match)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isStaff ? 'cursor-pointer hover:border-cyan-400' : ''
                    } ${
                      match.status === 'live'
                        ? 'bg-rose-950/30 border-rose-500/50 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="font-mono font-bold">{match.round} • Match #{match.matchNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          match.status === 'live'
                            ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                            : match.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>

                    {/* Teams Score row */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                        <img
                          src={match.teamA?.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={match.teamA?.name || 'TBD'}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-bold text-white font-mono truncate">
                          {match.teamA?.name || 'TBD'}
                        </span>
                      </div>

                      <div className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-black text-xs sm:text-sm text-cyan-300 shrink-0">
                        {match.scoreA ?? 0} : {match.scoreB ?? 0}
                      </div>

                      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white font-mono truncate">
                          {match.teamB?.name || 'TBD'}
                        </span>
                        <img
                          src={match.teamB?.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={match.teamB?.name || 'TBD'}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shrink-0"
                        />
                      </div>
                    </div>

                    {match.winner && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-amber-400 flex items-center justify-center gap-1 font-mono">
                        <Trophy className="w-3.5 h-3.5" /> Winner: <strong>{match.winner?.name}</strong>
                      </div>
                    )}
                  </div>
                ))}
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

        {/* 6. LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">Tournament Rankings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Team</th>
                    <th className="p-3 text-center">Matches</th>
                    <th className="p-3 text-center">Wins</th>
                    <th className="p-3 text-center">Losses</th>
                    <th className="p-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tournament.registeredTeams?.map((reg, idx) => {
                    const team = reg.team;
                    if (!team) return null;
                    return (
                      <tr key={team._id || idx} className="hover:bg-slate-850/50">
                        <td className="p-3 font-mono font-bold text-amber-400">#{idx + 1}</td>
                        <td className="p-3 font-bold text-white font-mono flex items-center gap-2">
                          <img
                            src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                            alt={team.name}
                            className="w-6 h-6 rounded-md object-cover"
                          />
                          {team.name}
                        </td>
                        <td className="p-3 text-center font-mono">{team.matchesPlayed || 0}</td>
                        <td className="p-3 text-center font-mono text-emerald-400">{team.wins || 0}</td>
                        <td className="p-3 text-center font-mono text-rose-400">{team.losses || 0}</td>
                        <td className="p-3 text-right font-mono font-black text-amber-400">
                          {team.points || 0} PTS
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={`Register for ${tournament.name}`}
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <p className="text-slate-300"><strong>Game:</strong> {tournament.game}</p>
            <p className="text-slate-300"><strong>Format:</strong> {tournament.format}</p>
            <p className="text-slate-300">
              <strong>Entry Fee:</strong> {tournament.entryFee === 0 ? 'Free' : `₹${tournament.entryFee}`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Your Team (You must be Captain)
            </label>
            {userTeams.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <p>You haven't created any team yet.</p>
                <Link
                  to="/teams"
                  onClick={() => setRegisterModalOpen(false)}
                  className="inline-block font-bold text-cyan-400 underline"
                >
                  Create a Team first
                </Link>
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {userTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} ({team.game}) - [{team.members?.length || 1} members]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            {userTeams.length > 0 && (
              <button
                type="submit"
                disabled={registering}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Confirm Registration'}
              </button>
            )}
          </div>
        </form>
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
    </div>
  );
};

export default TournamentDetails;
