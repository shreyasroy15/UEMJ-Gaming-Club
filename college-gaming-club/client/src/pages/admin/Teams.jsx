import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { Trophy, Users, Shield, Calendar, Search, Filter, Check, X, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminTeams = () => {
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') || 'tournaments';

  // Tab state: 'tournaments' | 'all-teams'
  const [activeTab, setActiveTab] = useState(queryTab);
  
  // Tournament Teams View
  const [tournaments, setTournaments] = useState([]);
  const [tournLoading, setTournLoading] = useState(true);
  const [tournSearchQuery, setTournSearchQuery] = useState('');

  // All Registered Teams View
  const [allTeams, setAllTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [gameFilter, setGameFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [games, setGames] = useState([]);
  const [verifyingTeamId, setVerifyingTeamId] = useState(null);
  const [deletingTeamId, setDeletingTeamId] = useState(null);

  const { addToast } = useToast();

  // Sync tab and search query from URL parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
    const searchParam = searchParams.get('search');
    if (searchParam !== null) setSearchQuery(searchParam);
  }, [searchParams]);

  // Fetch tournaments for tournament view
  useEffect(() => {
    fetchTournaments();
    fetchGames();
  }, []);

  // Fetch all teams when switching to 'all-teams' tab
  useEffect(() => {
    if (activeTab === 'all-teams') {
      fetchAllTeams();
    }
  }, [activeTab]);

  const fetchTournaments = async () => {
    try {
      setTournLoading(true);
      const res = await API.get('/tournaments');
      setTournaments(res.data.tournaments || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournaments', 'error');
    } finally {
      setTournLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      setGames(res.data.games || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllTeams = async () => {
    try {
      setTeamsLoading(true);

      // Fetch standalone teams
      const teamsRes = await API.get('/teams');
      const standalonTeams = (teamsRes.data.teams || []).map(team => ({
        ...team,
        teamType: 'standalone',
      }));

      // Fetch tournament registrations
      let tournamentTeams = [];
      try {
        const tournamentsRes = await API.get('/tournaments');
        const tournaments = tournamentsRes.data.tournaments || [];

        for (const tournament of tournaments) {
          try {
            const regRes = await API.get(`/tournaments/${tournament._id}/admin-registrations?status=all`);
            const registrations = (regRes.data.registrations || []).map(reg => ({
              ...reg,
              teamType: 'tournament',
              tournamentId: tournament._id,
              tournamentName: tournament.name,
              game: tournament.game,
            }));
            tournamentTeams = [...tournamentTeams, ...registrations];
          } catch (regErr) {
            console.error(`Failed to fetch registrations for tournament ${tournament._id}:`, regErr);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tournaments for registrations:', err);
      }

      // Combine both types
      const allTeamsData = [...standalonTeams, ...tournamentTeams];
      setAllTeams(allTeamsData);
    } catch (err) {
      console.error(err);
      addToast('Failed to load teams', 'error');
    } finally {
      setTeamsLoading(false);
    }
  };

  // Filter & search teams
  const filteredTeams = allTeams.filter((team) => {
    // Get team display name based on type
    const teamName = team.teamType === 'tournament' ? team.teamName : team.name;
    const teamTag = team.teamType === 'tournament' ? team.teamTag : team.tag;
    const captainName = team.captain?.name || team.captain?.username || 'N/A';

    const matchesSearch =
      teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teamTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      captainName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGame = gameFilter === 'all' || team.game === gameFilter;

    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && team.isVerified) ||
      (verificationFilter === 'unverified' && !team.isVerified);

    return matchesSearch && matchesGame && matchesVerification;
  });

  const handleVerifyTeam = async (teamId, shouldVerify) => {
    try {
      setVerifyingTeamId(teamId);
      await API.put(`/teams/${teamId}/verify`, { isVerified: shouldVerify });
      addToast(
        shouldVerify ? 'Team verified successfully' : 'Team unverified successfully',
        'success'
      );
      fetchAllTeams();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update team verification', 'error');
    } finally {
      setVerifyingTeamId(null);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete team "${teamName}"?`)) return;

    try {
      setDeletingTeamId(teamId);
      await API.delete(`/teams/${teamId}`);
      addToast('Team deleted successfully', 'success');
      fetchAllTeams();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete team', 'error');
    } finally {
      setDeletingTeamId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
          TEAMS MANAGEMENT
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Manage tournament registrations and standalone team verification.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tournaments'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Tournament Registrations</span>
        </button>
        <button
          onClick={() => setActiveTab('all-teams')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all-teams'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Registered Teams</span>
        </button>
      </div>

      {/* TAB 1: TOURNAMENT REGISTRATIONS */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          {/* Tournament Search Bar */}
          {tournaments.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tournaments by name or game..."
                  value={tournSearchQuery}
                  onChange={(e) => setTournSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono transition"
                />
                {tournSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTournSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 transition cursor-pointer"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs font-mono text-slate-500">
                Showing{' '}
                <span className="text-cyan-600 font-bold">
                  {
                    tournaments.filter((t) => {
                      if (!tournSearchQuery.trim()) return true;
                      const q = tournSearchQuery.toLowerCase().trim();
                      return (
                        (t.name || '').toLowerCase().includes(q) ||
                        (t.game || '').toLowerCase().includes(q)
                      );
                    }).length
                  }
                </span>{' '}
                of <span className="text-slate-900 font-bold">{tournaments.length}</span> tournaments
              </div>
            </div>
          )}

          {tournLoading ? (
            <Loading message="Loading tournaments..." />
          ) : tournaments.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No tournaments found"
              description="There are no tournaments available to manage teams."
            />
          ) : (
            (() => {
              const filteredList = tournaments.filter((t) => {
                if (!tournSearchQuery.trim()) return true;
                const q = tournSearchQuery.toLowerCase().trim();
                return (
                  (t.name || '').toLowerCase().includes(q) ||
                  (t.game || '').toLowerCase().includes(q)
                );
              });

              if (filteredList.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                    <p className="text-xs text-slate-500 font-mono">
                      No tournaments found matching "{tournSearchQuery}".
                    </p>
                    <button
                      type="button"
                      onClick={() => setTournSearchQuery('')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-700 text-xs font-mono font-bold"
                    >
                      Clear Search
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredList.map((tournament) => (
                    <Link
                      key={tournament._id}
                      to={`/admin/teams/${tournament._id}`}
                      className="group block p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-400 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                            {tournament.name}
                          </h3>
                          <p className="text-xs text-slate-500">{tournament.game}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>
                            Teams:{' '}
                            <strong className="text-slate-900 font-bold">
                              {tournament.registeredTeams?.length || 0}
                            </strong>{' '}
                            {tournament.maxTeams ? `/ ${tournament.maxTeams}` : ''}
                          </span>
                        </div>
                        <div
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                            tournament.status === 'live'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : tournament.status === 'upcoming'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {tournament.status}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB 2: ALL REGISTERED TEAMS */}
      {activeTab === 'all-teams' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex-1 relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teams, tags, captains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
              >
                <option value="all">All Games</option>
                {games.map((game) => (
                  <option key={game._id} value={game.name}>
                    {game.name}
                  </option>
                ))}
              </select>

              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>

          {/* Teams Grid */}
          {teamsLoading ? (
            <Loading message="Loading teams..." />
          ) : filteredTeams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No teams found"
              description={
                allTeams.length === 0
                  ? 'No standalone teams have been created yet.'
                  : 'No teams match your search or filter criteria.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTeams.map((team) => {
                const isStandalone = team.teamType === 'standalone';
                const teamName = isStandalone ? team.name : team.teamName;
                const teamTag = isStandalone ? team.tag : team.teamTag;
                const teamLogo = isStandalone ? team.logo : team.teamLogo;
                const memberCount = isStandalone
                  ? team.members?.length || 0
                  : team.players?.length || 0;

                return (
                  <div
                    key={team._id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-400 transition-all shadow-sm space-y-3"
                  >
                    {/* Type Badge */}
                    {!isStandalone && (
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-[10px]">
                          {team.tournamentName}
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {teamLogo ? (
                          <img
                            src={teamLogo}
                            alt={teamName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {teamName?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{teamName}</h3>
                          <p className="text-xs text-slate-500">{team.game}</p>
                        </div>
                      </div>

                      {/* Verification Badge */}
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 uppercase tracking-wide border ${
                          team.isVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {team.isVerified ? (
                          <>
                            <Check className="w-3 h-3" />
                            VERIFIED
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            PENDING
                          </>
                        )}
                      </div>
                    </div>

                    {/* Team Info Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <p className="text-slate-500 text-[10px]">Tag</p>
                        <p className="font-mono font-bold text-slate-800">{teamTag || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <p className="text-slate-500 text-[10px]">Members</p>
                        <p className="font-bold text-cyan-600">{memberCount}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <p className="text-slate-500 text-[10px]">Captain</p>
                        <p className="font-bold text-slate-800 truncate text-[10px]">
                          {team.captain?.username || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Stats - Only show for standalone teams */}
                    {isStandalone && (
                      <div className="grid grid-cols-4 gap-2 text-center text-xs border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-slate-400 text-[10px]">Wins</p>
                          <p className="font-bold text-slate-800">{team.wins || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px]">Losses</p>
                          <p className="font-bold text-slate-800">{team.losses || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px]">Played</p>
                          <p className="font-bold text-slate-800">{(team.wins || 0) + (team.losses || 0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px]">Points</p>
                          <p className="font-bold text-cyan-600">{team.points || 0}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => handleVerifyTeam(team._id, !team.isVerified)}
                        disabled={verifyingTeamId === team._id}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                          team.isVerified
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        } disabled:opacity-50`}
                      >
                        {verifyingTeamId === team._id ? (
                          <>Updating...</>
                        ) : team.isVerified ? (
                          <>
                            <X className="w-3 h-3" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Verify
                          </>
                        )}
                      </button>

                      {isStandalone && (
                        <button
                          onClick={() => handleDeleteTeam(team._id, team.name)}
                          disabled={deletingTeamId === team._id}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {deletingTeamId === team._id ? (
                            <>Deleting...</>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTeams;
