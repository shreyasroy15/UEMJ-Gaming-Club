import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import {
  Trophy,
  Search,
  ArrowUpDown,
  Flame,
  Gamepad2,
  Shield,
  Swords,
  ExternalLink,
  Users,
} from 'lucide-react';

const Leaderboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'tournament' | 'global'
  const [viewMode, setViewMode] = useState('tournament');

  // 1. Tournament Mode State
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [tournamentData, setTournamentData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [lobbies, setLobbies] = useState([]);
  const [publicTeams, setPublicTeams] = useState([]);
  const [tournLoading, setTournLoading] = useState(true);
  const [tournamentLobbyFilter, setTournamentLobbyFilter] = useState('all');
  const [tournSearch, setTournSearch] = useState('');

  // 2. Global Club Mode State
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('BGMI');
  const [search, setSearch] = useState('');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [sortField, setSortField] = useState('points');
  const [sortDirection, setSortDirection] = useState('desc');

  // Initial Load: Fetch Tournaments
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setTournLoading(true);
      const res = await API.get('/tournaments');
      const list = res.data.tournaments || [];
      setTournaments(list);

      const urlTournamentId = searchParams.get('tournament');
      if (list.length > 0) {
        const found = list.find((t) => t._id === urlTournamentId);
        const chosen = found ? found._id : list[0]._id;
        setSelectedTournamentId(chosen);
      } else {
        // No tournaments, switch to global
        setViewMode('global');
        fetchGames();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
      setViewMode('global');
      fetchGames();
      fetchLeaderboard();
    } finally {
      setTournLoading(false);
    }
  };

  // When selectedTournamentId changes, load its details
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
      loadTournamentDetails(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const loadTournamentDetails = async (tournId) => {
    try {
      setTournLoading(true);
      const [tRes, pRes] = await Promise.all([
        API.get(`/tournaments/${tournId}`),
        API.get(`/tournaments/${tournId}/public-teams`).catch(() => ({ data: { teams: [] } })),
      ]);

      if (tRes.data.success) {
        setTournamentData(tRes.data.tournament);
        setMatches(tRes.data.matches || []);
        setLobbies(tRes.data.lobbies || []);
        setPublicTeams(pRes.data?.teams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTournLoading(false);
    }
  };

  // Compute Tournament Standings
  const computedTournamentStandings = useMemo(() => {
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

    (lobbies || []).forEach((l) => {
      const lid = l._id?.toString();
      (l.teams || []).forEach((lt) => {
        const ltid = (lt._id || lt).toString();
        if (teamMap[ltid]) teamMap[ltid].lobbies.add(lid);
      });
    });

    const completedMatches = (matches || []).filter(
      (m) => m.status === 'completed' || (m.results && m.results.length > 0)
    );

    let hasResults = false;
    completedMatches.forEach((m) => {
      const lid = (m.lobbyId || m.lobby?._id || m.lobby)?.toString();

      if (m.winner) {
        const wid = (m.winner._id || m.winner).toString();
        if (teamMap[wid]) teamMap[wid].wins += 1;
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

    if (hasResults) {
      Object.values(teamMap).forEach((t) => {
        const sumPts = t.positionPoints + t.killPoints + t.bonusPoints;
        if (sumPts > 0 || t.totalPoints === 0) {
          t.totalPoints = sumPts;
        }
      });
    }

    let list = Object.values(teamMap);

    if (tournamentLobbyFilter && tournamentLobbyFilter !== 'all') {
      list = list.filter((t) => t.lobbies.has(tournamentLobbyFilter));
    }

    return list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.kills - a.kills;
    });
  }, [publicTeams, matches, lobbies, tournamentLobbyFilter]);

  // Global Club Standings fetchers
  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      const gList = res.data.games || [];
      setGames(gList);
      const hasBgmi = gList.some((g) => g.name.toLowerCase().includes('bgmi'));
      if (!hasBgmi && gList.length > 0) {
        setSelectedGame(gList[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setGlobalLoading(true);
      const url =
        selectedGame === 'all'
          ? '/teams?sort=points'
          : `/teams?game=${encodeURIComponent(selectedGame)}&sort=points`;
      const res = await API.get(url);
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'global') {
      fetchLeaderboard();
    }
  }, [selectedGame, viewMode]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const processedTeams = teams
    .filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.tag && t.tag.toLowerCase().includes(search.toLowerCase()))
    )
    .map((team) => {
      const matchesCount = team.matchesPlayed || (team.wins || 0) + (team.losses || 0);
      const winRate = matchesCount > 0 ? Math.round(((team.wins || 0) / matchesCount) * 100) : 0;
      return { ...team, calculatedMatches: matchesCount, winRate };
    })
    .sort((a, b) => {
      let aVal = a[sortField] ?? 0;
      let bVal = b[sortField] ?? 0;
      if (sortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      }
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const primaryGames = ['BGMI', 'Free Fire', 'Valorant'];

  return (
    <div className="py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            <Trophy className="w-4 h-4" />
            <span>Official Esports Standings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-words">
            CAMPUS ESPORTS POINTS TABLE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Live championship points, lobby rankings, and squad standings updated in real time from tournament match results.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('tournament')}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'tournament'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tournaments</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('global');
              if (games.length === 0) fetchGames();
            }}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'global'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Club Roster</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TOURNAMENT POINTS TABLE */}
      {viewMode === 'tournament' && (
        <div className="space-y-6">
          {/* Tournament Selector Pills */}
          {tournaments.length > 0 && (
            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase font-bold text-slate-400">
                SELECT TOURNAMENT:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {tournaments.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => setSelectedTournamentId(t._id)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedTournamentId === t._id
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{t.game === 'BGMI' ? '📱' : t.game === 'Free Fire' ? '🔥' : '🎯'}</span>
                    <span>{t.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/40 text-slate-300">
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tournLoading ? (
            <Loading message="Loading tournament points table & standings..." />
          ) : !tournamentData ? (
            <EmptyState
              icon={Trophy}
              title="No tournament selected"
              description="Please select a tournament to view its points table."
            />
          ) : (
            <div className="space-y-6">
              {/* Tournament Summary Bar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      {tournamentData.game}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {publicTeams.length} Squads Registered • {matches.length} Matches Scheduled
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-mono text-white">
                    {tournamentData.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to={`/tournaments/${tournamentData.slug || tournamentData._id}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>View Matches & Lobbies</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Lobby Filter Pills */}
              {lobbies.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                    LOBBY FILTER:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTournamentLobbyFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      tournamentLobbyFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    Overall Standings
                  </button>
                  {lobbies.map((lob) => (
                    <button
                      key={lob._id}
                      type="button"
                      onClick={() => setTournamentLobbyFilter(lob._id)}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        tournamentLobbyFilter === lob._id
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      🏢 {lob.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Top 3 Podium Highlights */}
              {computedTournamentStandings.length >= 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {computedTournamentStandings.slice(0, 3).map((team, idx) => {
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
                          <h4 className="font-mono font-bold text-white text-base truncate">
                            {team.teamName}
                          </h4>
                          <p className="text-xs font-mono text-slate-400 truncate">
                            Captain: {team.captain}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs">
                          <span className="text-slate-400">
                            Wins: <strong className="text-emerald-400">{team.wins} 🍗</strong>
                          </span>
                          <span className="text-slate-400">
                            Kills: <strong className="text-cyan-400">{team.kills}</strong>
                          </span>
                          <span className="text-amber-400 font-black text-sm">{team.totalPoints} PTS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search squad name or tag..."
                    value={tournSearch}
                    onChange={(e) => setTournSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Total Squads: <strong>{computedTournamentStandings.length}</strong>
                </span>
              </div>

              {/* Tournament Standings Table */}
              {computedTournamentStandings.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No squads in this standings view"
                  description="Squad points will update automatically when match results are recorded."
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-200">
                    <thead className="bg-slate-950/90 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3.5 w-16 text-center">Rank</th>
                        <th className="p-3.5">Squad / Team</th>
                        <th className="p-3.5 text-center">Matches</th>
                        <th className="p-3.5 text-center">Wins 🍗</th>
                        <th className="p-3.5 text-center">Kills 🎯</th>
                        <th className="p-3.5 text-center">Pos Pts</th>
                        <th className="p-3.5 text-center">Bonus</th>
                        <th className="p-3.5 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {computedTournamentStandings
                        .filter(
                          (t) =>
                            !tournSearch.trim() ||
                            t.teamName.toLowerCase().includes(tournSearch.toLowerCase()) ||
                            t.teamTag.toLowerCase().includes(tournSearch.toLowerCase())
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
                              <td className="p-3.5 text-center font-bold">
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
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  {team.teamLogo ? (
                                    <img
                                      src={team.teamLogo}
                                      alt={team.teamName}
                                      className="w-7 h-7 rounded-md object-cover border border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
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
                              <td className="p-3.5 text-center">{team.matchesPlayed}</td>
                              <td className="p-3.5 text-center font-bold text-emerald-400">
                                {team.wins}
                              </td>
                              <td className="p-3.5 text-center font-bold text-cyan-300">
                                {team.kills}
                              </td>
                              <td className="p-3.5 text-center text-slate-300">
                                {team.positionPoints}
                              </td>
                              <td className="p-3.5 text-center text-slate-400">
                                {team.bonusPoints}
                              </td>
                              <td className="p-3.5 text-right font-black text-amber-400 text-sm">
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
      )}

      {/* VIEW 2: GLOBAL CLUB LEADERBOARD */}
      {viewMode === 'global' && (
        <div className="space-y-6">
          {/* Game selector pills */}
          <div className="space-y-2.5 sm:space-y-3">
            <span className="block text-xs font-mono uppercase font-bold text-slate-400">
              SELECT ESPORTS TITLE:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 sm:flex-wrap sm:pb-0 scrollbar-none">
              {primaryGames.map((gameName) => (
                <button
                  key={gameName}
                  type="button"
                  onClick={() => setSelectedGame(gameName)}
                  className={`shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                    selectedGame === gameName
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {gameName === 'BGMI' && <span>📱</span>}
                  {gameName === 'Free Fire' && <span>🔥</span>}
                  {gameName === 'Valorant' && <span>🎯</span>}
                  <span>{gameName}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedGame('all')}
                className={`shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedGame === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                All Games
              </button>
            </div>
          </div>

          {/* Search toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${selectedGame} teams...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div className="flex items-center text-xs font-mono text-slate-400 px-1">
              <span>
                Showing club rankings for <strong>{selectedGame === 'all' ? 'All Titles' : selectedGame}</strong>
              </span>
            </div>
          </div>

          {/* Global Points Table */}
          {globalLoading ? (
            <Loading message={`Loading ${selectedGame} points table...`} />
          ) : processedTeams.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white font-mono">No points available yet.</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No teams or records found for {selectedGame}.
              </p>
              <div className="pt-2">
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                >
                  Browse Tournaments
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-xs sm:text-sm text-slate-200">
                  <thead className="bg-slate-950/80 text-[11px] sm:text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 sm:p-4 w-14 sm:w-16 text-center">Rank</th>
                      <th
                        className="p-3 sm:p-4 cursor-pointer hover:text-white"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1.5">
                          Team <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="p-3 sm:p-4 hidden sm:table-cell">Game</th>
                      <th
                        className="p-3 sm:p-4 text-center cursor-pointer hover:text-white"
                        onClick={() => handleSort('calculatedMatches')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Matches <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="p-3 sm:p-4 text-center cursor-pointer hover:text-white"
                        onClick={() => handleSort('wins')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Wins <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        className="p-3 sm:p-4 text-right cursor-pointer hover:text-white"
                        onClick={() => handleSort('points')}
                      >
                        <div className="flex items-center justify-end gap-1 text-amber-400">
                          Points <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {processedTeams.map((team, index) => {
                      const rank = index + 1;
                      return (
                        <tr
                          key={team._id}
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
                          <td className="p-3 sm:p-4 text-center">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                rank === 1
                                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                                  : rank === 2
                                  ? 'bg-slate-300 text-slate-950 font-bold'
                                  : rank === 3
                                  ? 'bg-amber-700 text-white font-bold'
                                  : 'text-slate-400 bg-slate-800/50'
                              }`}
                            >
                              {rank}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <Link to={`/teams/${team._id}`} className="flex items-center gap-3 group">
                              <img
                                src={
                                  team.logo ||
                                  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'
                                }
                                alt={team.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700 group-hover:border-amber-400 transition-colors"
                              />
                              <div>
                                <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                  <span>{team.name}</span>
                                  {team.tag && (
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      [{team.tag}]
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-sans sm:hidden">
                                  {team.game}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="p-3 sm:p-4 hidden sm:table-cell text-xs text-slate-300">
                            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px]">
                              {team.game}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 text-center font-bold text-slate-300">
                            {team.calculatedMatches}
                          </td>
                          <td className="p-3 sm:p-4 text-center font-bold text-emerald-400">
                            {team.wins || 0}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            <span className="text-base font-black text-amber-400">
                              {team.points || 0}
                            </span>
                            <span className="text-[10px] text-amber-500/80 ml-1">PTS</span>
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
      )}
    </div>
  );
};

export default Leaderboard;
