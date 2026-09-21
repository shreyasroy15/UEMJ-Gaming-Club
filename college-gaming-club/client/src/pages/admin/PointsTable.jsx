import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Trophy,
  Swords,
  Crown,
  Copy,
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  Shield,
  Medal,
  Award,
  Sparkles,
} from 'lucide-react';

const AdminPointsTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTournament = searchParams.get('tournament') || '';
  const { addToast } = useToast();

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(queryTournament);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [structure, setStructure] = useState({
    tournament: null,
    stages: [],
    lobbies: [],
    allRegistrations: [],
    matches: [],
  });

  const [activeTab, setActiveTab] = useState('overall'); // 'overall' | lobbyId
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Tournaments
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
        const found = list.find((t) => t._id === queryTournament);
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

  // 2. Fetch Tournament Structure when selected
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
      fetchStructure(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const fetchStructure = async (tournamentId) => {
    try {
      setDataLoading(true);
      const res = await API.get(`/tournaments/${tournamentId}/stages-structure`);
      if (res.data.success) {
        setStructure(res.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournament standings', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const selectedTournament = useMemo(() => {
    return tournaments.find((t) => t._id === selectedTournamentId) || structure.tournament || null;
  }, [tournaments, selectedTournamentId, structure.tournament]);

  // Extract all lobbies
  const allLobbies = useMemo(() => {
    if (structure.lobbies && structure.lobbies.length > 0) {
      return structure.lobbies;
    }
    const list = [];
    (structure.stages || []).forEach((stage) => {
      (stage.lobbies || []).forEach((l) => {
        list.push({
          _id: l._id,
          name: l.name,
          maxTeams: l.maxTeams || 25,
          status: l.status || 'upcoming',
          teams: l.teams || [],
        });
      });
    });
    return list;
  }, [structure.lobbies, structure.stages]);

  // Compute standings for all completed matches
  const computedStandings = useMemo(() => {
    const registrations = structure.allRegistrations || [];
    const matches = structure.matches || [];
    const completedMatches = matches.filter((m) => m.status === 'completed');

    // Create a base map for all registered teams
    const teamMap = {};
    registrations.forEach((reg) => {
      const tid = reg._id.toString();
      teamMap[tid] = {
        teamId: tid,
        teamName: reg.teamName || 'Unknown Team',
        teamTag: reg.teamTag || '',
        captain: reg.captain?.name || reg.leader || 'N/A',
        matchesPlayed: 0,
        wins: 0,
        kills: 0,
        positionPoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
        lobbies: new Set(),
      };
    });

    // Aggregate points from match results
    completedMatches.forEach((m) => {
      const lobbyId = m.lobbyId?.toString();
      const isOverall = activeTab === 'overall';
      const isCurrentLobby = lobbyId === activeTab;

      if (!isOverall && !isCurrentLobby) return;

      if (m.winner) {
        const wid = m.winner._id ? m.winner._id.toString() : m.winner.toString();
        if (teamMap[wid]) {
          teamMap[wid].wins += 1;
        }
      }

      if (m.results && m.results.length > 0) {
        m.results.forEach((r) => {
          const tid = r.team?._id ? r.team._id.toString() : r.team?.toString() || r.teamId;
          if (tid && teamMap[tid]) {
            teamMap[tid].matchesPlayed += 1;
            teamMap[tid].kills += Number(r.kills || 0);
            teamMap[tid].positionPoints += Number(r.positionPoints || 0);
            teamMap[tid].bonusPoints += Number(r.bonusPoints || 0);
            teamMap[tid].totalPoints += Number(r.totalPoints || 0);
            if (lobbyId) teamMap[tid].lobbies.add(lobbyId);
          }
        });
      } else {
        // Fallback if results array not populated yet
        (m.teams || []).forEach((t) => {
          const tid = t._id ? t._id.toString() : t.toString();
          if (teamMap[tid]) {
            teamMap[tid].matchesPlayed += 1;
          }
        });
      }
    });

    let list = Object.values(teamMap);

    // If viewing specific lobby, filter to teams in that lobby
    if (activeTab !== 'overall') {
      const currentLobbyObj = allLobbies.find((l) => l._id.toString() === activeTab);
      if (currentLobbyObj) {
        const allowedIds = new Set(
          (currentLobbyObj.teams || []).map((t) => (t._id ? t._id.toString() : t.toString()))
        );
        list = list.filter((t) => allowedIds.has(t.teamId));
      }
    }

    // Sort by Total Points desc, then Wins desc, then Kills desc
    return list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.kills - a.kills;
    });
  }, [structure, activeTab, allLobbies]);

  // Filter by search query
  const filteredStandings = useMemo(() => {
    if (!searchQuery.trim()) return computedStandings;
    const q = searchQuery.toLowerCase();
    return computedStandings.filter(
      (s) =>
        s.teamName.toLowerCase().includes(q) ||
        s.teamTag.toLowerCase().includes(q) ||
        s.captain.toLowerCase().includes(q)
    );
  }, [computedStandings, searchQuery]);

  // Copy standings to clipboard formatted for Discord / WhatsApp
  const handleCopyStandings = () => {
    if (filteredStandings.length === 0) return;
    const tourName = selectedTournament?.name || 'Tournament';
    const lobbyName =
      activeTab === 'overall'
        ? 'OVERALL STANDINGS'
        : allLobbies.find((l) => l._id.toString() === activeTab)?.name || 'LOBBY STANDINGS';

    let text = `🏆 ${tourName.toUpperCase()} - ${lobbyName} 🏆\n\n`;
    filteredStandings.slice(0, 16).forEach((st, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
      text += `${medal} [${st.teamTag || 'TEAM'}] ${st.teamName} - ${st.totalPoints} PTS (Kills: ${st.kills} | Wins: ${st.wins})\n`;
    });
    text += `\nOfficial Standings by UEMJ Gaming Club`;

    navigator.clipboard.writeText(text);
    addToast('Standings copied to clipboard for Discord / WhatsApp!', 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredStandings.length === 0) return;
    let csv = 'Rank,Team Name,Team Tag,Captain,Matches Played,Wins,Total Kills,Placement Points,Bonus Points,Total Points\n';
    filteredStandings.forEach((st, idx) => {
      csv += `${idx + 1},"${st.teamName}","${st.teamTag}","${st.captain}",${st.matchesPlayed},${st.wins},${st.kills},${st.positionPoints},${st.bonusPoints},${st.totalPoints}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTournament?.name || 'standings'}_points_table.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addToast('Standings CSV exported successfully!', 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loading size="lg" message="Loading points table..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              Tournament Leaderboards & Standings
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 font-gaming tracking-wide">
              ESPORTS POINTS TABLE
            </h1>
            <p className="text-slate-600 text-xs md:text-sm mt-1 max-w-2xl font-medium">
              Official rankings, placement points, kill counts, and chicken dinner records across all
              tournament lobbies.
            </p>
          </div>

          {/* Tournament Selector & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.game})
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchStructure(selectedTournamentId)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
              title="Refresh Standings"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Ranked Teams</span>
            <span className="text-xl font-black text-slate-900 font-mono">{computedStandings.length}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Total Lobbies</span>
            <span className="text-xl font-black text-cyan-600 font-mono">{allLobbies.length}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Completed Rounds</span>
            <span className="text-xl font-black text-purple-600 font-mono">
              {structure.matches?.filter((m) => m.status === 'completed').length || 0}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1 font-mono">Current #1 Leader</span>
            <span className="text-base font-black text-amber-600 truncate block font-mono">
              {computedStandings[0]?.teamName || 'TBD'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Standings Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Top Controls: Lobbies Filter Tabs + Search + Export */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lobbies Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setActiveTab('overall')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === 'overall'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Overall Tournament Standings
            </button>

            {allLobbies.map((l) => (
              <button
                key={l._id}
                onClick={() => setActiveTab(l._id.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === l._id.toString()
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>

          {/* Search & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>

            <button
              onClick={handleCopyStandings}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Copy formatted text for Discord or WhatsApp"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Standings
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <Link
              to={`/admin/matches?tournament=${selectedTournamentId}`}
              className="px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <span>Update Points in Matches</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Standings Table */}
        {dataLoading ? (
          <div className="py-16 text-center">
            <Loading size="md" message="Updating standings table..." />
          </div>
        ) : filteredStandings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-medium">
            No completed match results recorded for this view yet. Enter round results in the Matches
            Manager to populate points!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 text-center w-16">Rank</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Captain</th>
                  <th className="p-3.5 text-center">Matches</th>
                  <th className="p-3.5 text-center">Wins (🍗)</th>
                  <th className="p-3.5 text-center">Total Kills</th>
                  <th className="p-3.5 text-center">Placement Pts</th>
                  <th className="p-3.5 text-center">Bonus Pts</th>
                  <th className="p-3.5 text-center font-bold text-slate-900">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {filteredStandings.map((st, idx) => {
                  const isTop1 = idx === 0;
                  const isTop3 = idx < 3;

                  return (
                    <tr
                      key={st.teamId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTop1 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-3.5 text-center font-mono font-black">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs shadow-sm">
                            🥇
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs shadow-sm">
                            🥈
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs shadow-sm">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-400">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Team Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold block">{st.teamName}</span>
                          {st.teamTag && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-cyan-700 border border-slate-200">
                              [{st.teamTag}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Captain */}
                      <td className="p-3.5 text-slate-600">{st.captain}</td>

                      {/* Matches */}
                      <td className="p-3.5 text-center font-mono text-slate-700">
                        {st.matchesPlayed}
                      </td>

                      {/* Wins */}
                      <td className="p-3.5 text-center font-mono font-bold text-amber-600">
                        {st.wins}
                      </td>

                      {/* Kills */}
                      <td className="p-3.5 text-center font-mono text-rose-600 font-bold">
                        {st.kills}
                      </td>

                      {/* Placement Pts */}
                      <td className="p-3.5 text-center font-mono text-cyan-700 font-bold">
                        {st.positionPoints}
                      </td>

                      {/* Bonus Pts */}
                      <td className="p-3.5 text-center font-mono text-purple-700 font-bold">
                        {st.bonusPoints}
                      </td>

                      {/* Total Points */}
                      <td className="p-3.5 text-center font-mono font-black text-emerald-700 text-sm">
                        <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 shadow-sm">
                          {st.totalPoints} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPointsTable;
