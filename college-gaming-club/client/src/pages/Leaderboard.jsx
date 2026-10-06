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
  BarChart3,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

const Leaderboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tournament Mode State
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [tournamentData, setTournamentData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [lobbies, setLobbies] = useState([]);
  const [publicTeams, setPublicTeams] = useState([]);
  const [tournLoading, setTournLoading] = useState(true);
  const [tournamentLobbyFilter, setTournamentLobbyFilter] = useState('all');
  const [tournSearch, setTournSearch] = useState('');
  const [showRoundBreakdown, setShowRoundBreakdown] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

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
        // Prioritize admin-selected featured tournament (showPointsTableOnUserSide), then live/ongoing, then first
        const featured = list.find((t) => t.showPointsTableOnUserSide);
        const live = list.find((t) => t.status === 'live' || t.status === 'ongoing');
        const chosen = found ? found._id : (featured ? featured._id : (live ? live._id : list[0]._id));
        setSelectedTournamentId(chosen);
      }
    } catch (err) {
      console.error(err);
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
        roundScores: {},
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
      const mid = m._id?.toString();
      const lid = (m.lobbyId || m.lobby?._id || m.lobby)?.toString();
      const wid = (m.winner?._id || m.winner)?.toString();

      if (m.winner && teamMap[wid]) {
        teamMap[wid].wins += 1;
      }

      if (m.results && m.results.length > 0) {
        hasResults = true;
        m.results.forEach((r) => {
          const tid = (r.team?._id || r.team || r.teamId)?.toString();
          const rPts =
            Number(r.totalPoints) ||
            Number(r.positionPoints || 0) + Number(r.killPoints || (r.kills || 0)) + Number(r.bonusPoints || 0);

          const roundDetail = {
            matchId: mid,
            matchNumber: m.matchNumber || 1,
            round: m.round || `Round ${m.matchNumber || 1}`,
            map: m.map || '',
            position: Number(r.position || (wid === tid ? 1 : 0)),
            kills: Number(r.kills || 0),
            positionPoints: Number(r.positionPoints || 0),
            killPoints: Number(r.killPoints || (r.kills || 0)),
            bonusPoints: Number(r.bonusPoints || 0),
            totalPoints: rPts,
            isWinner: wid === tid || r.position === 1,
          };

          if (tid && teamMap[tid]) {
            teamMap[tid].kills += Number(r.kills || 0);
            teamMap[tid].positionPoints += Number(r.positionPoints || 0);
            teamMap[tid].killPoints += Number(r.killPoints || (r.kills || 0));
            teamMap[tid].bonusPoints += Number(r.bonusPoints || 0);
            if (lid) teamMap[tid].lobbies.add(lid);
            teamMap[tid].roundScores[mid] = roundDetail;
          } else if (tid) {
            teamMap[tid] = {
              teamId: tid,
              teamName: r.teamName || r.team?.teamName || 'Squad',
              teamTag: r.teamTag || r.team?.teamTag || '',
              teamLogo: r.team?.teamLogo || null,
              captain: r.team?.captain?.name || 'N/A',
              matchesPlayed: 1,
              wins: wid === tid || r.position === 1 ? 1 : 0,
              kills: Number(r.kills || 0),
              positionPoints: Number(r.positionPoints || 0),
              killPoints: Number(r.killPoints || (r.kills || 0)),
              bonusPoints: Number(r.bonusPoints || 0),
              totalPoints: rPts,
              lobbies: new Set(lid ? [lid] : []),
              roundScores: {
                [mid]: roundDetail,
              },
            };
          }
        });
      }
    });

    if (hasResults) {
      Object.values(teamMap).forEach((t) => {
        const sumPts = t.positionPoints + t.killPoints + (t.bonusPoints || 0);
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

  // Matches relevant to current lobby filter with recorded results
  const relevantMatches = useMemo(() => {
    return (matches || [])
      .filter((m) => {
        const hasResults = m.status === 'completed' || (m.results && m.results.length > 0);
        if (!hasResults) return false;
        if (tournamentLobbyFilter !== 'all') {
          const mLobbyId = (m.lobbyId || m.lobby?._id || m.lobby)?.toString();
          return mLobbyId === tournamentLobbyFilter.toString();
        }
        return true;
      })
      .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
  }, [matches, tournamentLobbyFilter]);

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
      </div>

      {/* TOURNAMENT POINTS TABLE */}
      <div className="space-y-6">
          {/* Tournament Selector Pills */}
          {tournaments.length > 0 && (
            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase font-bold text-slate-400">
                SELECT TOURNAMENT:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
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
                    {t.showPointsTableOnUserSide ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 shadow-sm">
                        Featured
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/40 text-slate-300">
                        {t.status}
                      </span>
                    )}
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
                      {publicTeams.length} Squads Registered
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
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
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
                  {lobbies.map((lob) => {
                    const completedLobbyRounds = (matches || []).filter(
                      (m) =>
                        (m.lobbyId || m.lobby?._id || m.lobby)?.toString() === lob._id.toString() &&
                        (m.status === 'completed' || (m.results && m.results.length > 0))
                    ).length;

                    return (
                      <button
                        key={lob._id}
                        type="button"
                        onClick={() => setTournamentLobbyFilter(lob._id)}
                        className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          tournamentLobbyFilter === lob._id
                            ? 'bg-amber-500 text-slate-950 font-black shadow'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span>🏢 {lob.name}</span>
                        {completedLobbyRounds > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              tournamentLobbyFilter === lob._id
                                ? 'bg-black/25 text-slate-950 font-black'
                                : 'bg-slate-800 text-cyan-300'
                            }`}
                          >
                            {completedLobbyRounds} {completedLobbyRounds === 1 ? 'Round' : 'Rounds'}
                          </span>
                        )}
                      </button>
                    );
                  })}
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

              {/* Search Bar & Round View Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search squad name or tag..."
                    value={tournSearch}
                    onChange={(e) => setTournSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {relevantMatches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowRoundBreakdown((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                        showRoundBreakdown
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                      }`}
                      title="Toggle per-round point columns (Round 1, Round 2, etc.)"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{showRoundBreakdown ? 'Round Points: ON' : 'Round Points: OFF'}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] text-cyan-200">
                        {relevantMatches.length} {relevantMatches.length === 1 ? 'Round' : 'Rounds'}
                      </span>
                    </button>
                  )}

                  <span className="text-xs font-mono text-slate-400">
                    Total Squads: <strong>{computedTournamentStandings.length}</strong>
                  </span>
                </div>
              </div>

              {/* Tournament Standings Table */}
              {computedTournamentStandings.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No squads in this standings view"
                  description="Squad points will update automatically when match results are recorded."
                />
              ) : (
                <div className="space-y-2">
                  {showRoundBreakdown && relevantMatches.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400/90 bg-cyan-950/50 border border-cyan-800/50 px-3 py-1.5 rounded-xl w-fit shadow-xs">
                      <span className="text-cyan-300 font-bold">↔</span>
                      <span>Swipe or scroll table horizontally to view all rounds and points</span>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl -mx-3.5 sm:mx-0 touch-pan-x custom-scrollbar">
                    <table
                      className="w-full text-left text-xs sm:text-sm text-slate-200"
                      style={{
                        minWidth:
                          showRoundBreakdown && relevantMatches.length > 0
                            ? `${Math.max(1020, 680 + relevantMatches.length * 110)}px`
                            : '780px',
                      }}
                    >
                      <thead className="bg-slate-950/90 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3.5 w-16 text-center whitespace-nowrap">Rank</th>
                          <th className="p-3.5 min-w-[190px] whitespace-nowrap">Squad / Team</th>

                          {/* Dynamic Round Columns (Round 1, Round 2, Round 3...) */}
                          {showRoundBreakdown &&
                            relevantMatches.length > 0 &&
                            relevantMatches.map((m, mIdx) => {
                              const rName = m.round || `Round ${m.matchNumber || mIdx + 1}`;
                              return (
                                <th
                                  key={m._id}
                                  className="p-3 text-center min-w-[100px] bg-slate-950/70 border-x border-slate-800/50 whitespace-nowrap"
                                >
                                  <div className="text-cyan-300 font-bold tracking-normal">{rName}</div>
                                  {m.map && (
                                    <div className="text-[9px] text-slate-400 font-normal tracking-wider uppercase">
                                      {m.map}
                                    </div>
                                  )}
                                </th>
                              );
                            })}

                          <th className="p-3.5 text-center min-w-[80px] whitespace-nowrap">Wins 🍗</th>
                          <th className="p-3.5 text-center min-w-[80px] whitespace-nowrap">Kills 🎯</th>
                          <th className="p-3.5 text-center min-w-[85px] whitespace-nowrap">Pos Pts</th>
                          <th className="p-3.5 text-center min-w-[75px] whitespace-nowrap">Bonus</th>
                          <th className="p-3.5 text-right font-black text-amber-400 min-w-[110px] whitespace-nowrap">
                            Total Points
                          </th>
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
                            const isExpanded = expandedTeamId === team.teamId;

                            return (
                              <React.Fragment key={team.teamId}>
                                <tr
                                  onClick={() => setExpandedTeamId(isExpanded ? null : team.teamId)}
                                  className={`hover:bg-slate-800/40 transition-colors cursor-pointer select-none ${
                                    rank === 1
                                      ? 'bg-amber-950/20'
                                      : rank === 2
                                      ? 'bg-slate-800/20'
                                      : rank === 3
                                      ? 'bg-amber-900/10'
                                      : ''
                                  } ${isExpanded ? 'bg-slate-800/60' : ''}`}
                                  title="Click to view round-by-round match breakdown"
                                >
                                  <td className="p-3.5 text-center font-bold whitespace-nowrap">
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
                                  <td className="p-3.5 min-w-[190px] whitespace-nowrap">
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

                                  {/* Dynamic Round Points Columns */}
                                  {showRoundBreakdown &&
                                    relevantMatches.length > 0 &&
                                    relevantMatches.map((m) => {
                                      const sc = team.roundScores?.[m._id.toString()];
                                      return (
                                        <td
                                          key={m._id}
                                          className="p-3 text-center bg-slate-950/40 border-x border-slate-800/40 whitespace-nowrap"
                                        >
                                          {sc ? (
                                            <div className="inline-flex flex-col items-center justify-center">
                                              <span
                                                className={`font-mono font-bold text-xs ${
                                                  sc.isWinner ? 'text-amber-400 font-black' : 'text-slate-100'
                                                }`}
                                              >
                                                {sc.totalPoints}
                                                {sc.isWinner && ' 🍗'}
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-mono">
                                                {sc.kills}k • {sc.positionPoints}p
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-600">-</span>
                                          )}
                                        </td>
                                      );
                                    })}

                                  <td className="p-3.5 text-center font-bold text-emerald-400 whitespace-nowrap">
                                    {team.wins}
                                  </td>
                                  <td className="p-3.5 text-center font-bold text-cyan-300 whitespace-nowrap">
                                    {team.kills}
                                  </td>
                                  <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">
                                    {team.positionPoints}
                                  </td>
                                  <td className="p-3.5 text-center text-slate-400 whitespace-nowrap">
                                    {team.bonusPoints}
                                  </td>
                                  <td className="p-3.5 text-right font-black text-amber-400 text-sm whitespace-nowrap">
                                    {team.totalPoints} PTS
                                  </td>
                                </tr>

                              {/* Expandable Match-by-Match Breakdown */}
                              {isExpanded && (
                                <tr className="bg-slate-950/90">
                                  <td
                                    colSpan={7 + (showRoundBreakdown ? relevantMatches.length : 0)}
                                    className="p-4 border-y border-cyan-800/40"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-300">
                                        <Flame className="w-4 h-4 text-amber-400" />
                                        <span>{team.teamName} - Round-by-Round Breakdown</span>
                                      </div>
                                      <span className="text-[11px] text-slate-400 font-mono">
                                        (Click row again to collapse)
                                      </span>
                                    </div>

                                    {relevantMatches.length === 0 ? (
                                      <div className="text-xs text-slate-400 font-mono">
                                        No completed rounds recorded yet.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                        {relevantMatches.map((m, mIdx) => {
                                          const sc = team.roundScores?.[m._id.toString()];
                                          return (
                                            <div
                                              key={m._id}
                                              className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                                                sc?.isWinner
                                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-sm'
                                                  : 'bg-slate-900/90 border-slate-800 text-slate-300'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between font-bold mb-1.5 pb-1 border-b border-slate-800/80">
                                                <span className="text-white">
                                                  {m.round || `Round ${mIdx + 1}`} {m.map ? `(${m.map})` : ''}
                                                </span>
                                                {sc?.isWinner && (
                                                  <span className="text-amber-400 font-black text-[11px]">
                                                    🍗 WWCD
                                                  </span>
                                                )}
                                              </div>

                                              {sc ? (
                                                <div className="space-y-1 text-[11px]">
                                                  <div className="flex justify-between text-slate-400">
                                                    <span>Position:</span>
                                                    <strong className="text-white font-mono">#{sc.position || '-'}</strong>
                                                  </div>
                                                  <div className="flex justify-between text-slate-400">
                                                    <span>Placement Points:</span>
                                                    <strong className="text-slate-200 font-mono">+{sc.positionPoints} pts</strong>
                                                  </div>
                                                  <div className="flex justify-between text-slate-400">
                                                    <span>Kills:</span>
                                                    <strong className="text-cyan-300 font-mono">
                                                      {sc.kills} ({sc.killPoints} pts)
                                                    </strong>
                                                  </div>
                                                  {sc.bonusPoints > 0 && (
                                                    <div className="flex justify-between text-slate-400">
                                                      <span>Bonus:</span>
                                                      <strong className="text-purple-300 font-mono">+{sc.bonusPoints} pts</strong>
                                                    </div>
                                                  )}
                                                  <div className="pt-1.5 mt-1 border-t border-slate-800/80 flex justify-between font-bold">
                                                    <span className="text-slate-300">Round Total:</span>
                                                    <strong className="text-amber-400 font-black font-mono">
                                                      {sc.totalPoints} PTS
                                                    </strong>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="py-2 text-center text-slate-500 text-[11px]">
                                                  No match score recorded
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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
    </div>
  );
};

export default Leaderboard;
