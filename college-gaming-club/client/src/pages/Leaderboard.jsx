import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { Trophy, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedGame, setSelectedGame] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('points');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchGames();
    fetchLeaderboard();
  }, [selectedGame]);

  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      setGames(res.data.games || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const url = selectedGame === 'all' ? '/teams' : `/teams?game=${encodeURIComponent(selectedGame)}`;
      const res = await API.get(url);
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter & Sort
  const processedTeams = teams
    .filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.tag && t.tag.toLowerCase().includes(search.toLowerCase()))
    )
    .map((team) => {
      const matches = team.matchesPlayed || (team.wins || 0) + (team.losses || 0);
      const winRate = matches > 0 ? Math.round(((team.wins || 0) / matches) * 100) : 0;
      return { ...team, calculatedMatches: matches, winRate };
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

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            <Trophy className="w-4 h-4" />
            <span>Collegiate Standings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
            CAMPUS ESPORTS LEADERBOARD
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Official standings across all collegiate games. Points awarded for tournament wins, scrims, and podium finishes.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams in leaderboard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Games</option>
          {games.map((g) => (
            <option key={g._id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <Loading message="Calculating team rankings..." />
      ) : processedTeams.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No teams on the leaderboard yet"
          description="Register your squad and compete in tournaments to earn leaderboard points."
        />
      ) : (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-[11px] sm:text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 sm:p-4 w-12 sm:w-16 text-center">Rank</th>
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
                    className="p-3 sm:p-4 text-center cursor-pointer hover:text-white hidden md:table-cell"
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
                    <div className="flex items-center justify-center gap-1 text-emerald-400">
                      Wins <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 sm:p-4 text-center cursor-pointer hover:text-white hidden md:table-cell"
                    onClick={() => handleSort('losses')}
                  >
                    <div className="flex items-center justify-center gap-1 text-rose-400">
                      Losses <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 sm:p-4 text-center cursor-pointer hover:text-white hidden lg:table-cell"
                    onClick={() => handleSort('winRate')}
                  >
                    <div className="flex items-center justify-center gap-1 text-cyan-400">
                      Win Rate <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 sm:p-4 text-right cursor-pointer hover:text-white pr-4 sm:pr-6"
                    onClick={() => handleSort('points')}
                  >
                    <div className="flex items-center justify-end gap-1 text-amber-400">
                      Points <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {processedTeams.map((team, idx) => {
                  return (
                    <tr
                      key={team._id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="p-3 sm:p-4 text-center font-mono font-bold text-xs sm:text-sm">
                        {idx === 0 ? (
                          <span className="text-amber-400 text-base sm:text-lg">🥇</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-300 text-base sm:text-lg">🥈</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-600 text-base sm:text-lg">🥉</span>
                        ) : (
                          <span className="text-slate-500 font-semibold">#{idx + 1}</span>
                        )}
                      </td>

                      <td className="p-3 sm:p-4">
                        <Link
                          to={`/teams/${team._id}`}
                          className="flex items-center gap-2.5 sm:gap-3 group-hover:text-cyan-400 transition-colors"
                        >
                          <img
                            src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                            alt={team.name}
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="font-bold text-white font-mono text-xs sm:text-sm truncate">{team.name}</span>
                              {team.tag && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-900">
                                  {team.tag}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                              <span className="sm:hidden text-cyan-400 font-semibold">{team.game} • </span>
                              Captain: {team.captain?.name || team.captain?.username || 'Active'}
                            </span>
                          </div>
                        </Link>
                      </td>

                      <td className="p-3 sm:p-4 text-xs font-semibold text-slate-300 hidden sm:table-cell">
                        <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800">
                          {team.game}
                        </span>
                      </td>

                      <td className="p-3 sm:p-4 text-center font-mono text-slate-300 hidden md:table-cell">
                        {team.calculatedMatches}
                      </td>

                      <td className="p-3 sm:p-4 text-center font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                        {team.wins || 0}
                      </td>

                      <td className="p-3 sm:p-4 text-center font-mono font-bold text-rose-400 hidden md:table-cell">
                        {team.losses || 0}
                      </td>

                      <td className="p-3 sm:p-4 text-center font-mono text-cyan-300 hidden lg:table-cell">
                        {team.winRate}%
                      </td>

                      <td className="p-3 sm:p-4 text-right font-mono font-black text-amber-400 pr-4 sm:pr-6 text-xs sm:text-base whitespace-nowrap">
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
  );
};

export default Leaderboard;
