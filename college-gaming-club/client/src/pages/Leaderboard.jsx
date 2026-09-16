import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { Trophy, Search, ArrowUpDown, Flame, Gamepad2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('BGMI');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Sorting Handler
  const [sortField, setSortField] = useState('points');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGame]);

  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      const gList = res.data.games || [];
      setGames(gList);
      // If BGMI is not in list, keep BGMI or pick first
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
      setLoading(true);
      const url =
        selectedGame === 'all'
          ? '/teams?sort=points'
          : `/teams?game=${encodeURIComponent(selectedGame)}&sort=points`;
      const res = await API.get(url);
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  // Priority game tabs to show prominently
  const primaryGames = ['BGMI', 'Free Fire', 'Valorant'];

  return (
    <div className="py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            <Trophy className="w-4 h-4" />
            <span>Collegiate Standings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-words">
            CAMPUS ESPORTS POINTS TABLE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Official collegiate points and standings. Select a game to view tournament records and points ranking.
          </p>
        </div>

        <Link
          to="/tournaments"
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-bold font-mono transition-colors"
        >
          View Tournaments →
        </Link>
      </div>

      {/* 10. GAME SELECTOR TABS: [ BGMI ] [ FREE FIRE ] ... */}
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
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center text-xs font-mono text-slate-400 px-1">
          <span>Showing rankings for <strong>{selectedGame === 'all' ? 'All Titles' : selectedGame}</strong></span>
        </div>
      </div>

      {/* Points Table */}
      {loading ? (
        <Loading message={`Loading ${selectedGame} points table...`} />
      ) : processedTeams.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">
            No points available yet.
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No teams or match records have been registered for {selectedGame} yet.
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
                  const isTop3 = rank <= 3;
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
                      {/* Rank */}
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

                      {/* Team Name */}
                      <td className="p-3 sm:p-4">
                        <Link
                          to={`/teams/${team._id}`}
                          className="flex items-center gap-3 group"
                        >
                          <img
                            src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
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

                      {/* Game */}
                      <td className="p-3 sm:p-4 hidden sm:table-cell text-xs text-slate-300">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px]">
                          {team.game}
                        </span>
                      </td>

                      {/* Matches */}
                      <td className="p-3 sm:p-4 text-center font-bold text-slate-300">
                        {team.calculatedMatches}
                      </td>

                      {/* Wins */}
                      <td className="p-3 sm:p-4 text-center font-bold text-emerald-400">
                        {team.wins || 0}
                      </td>

                      {/* Points */}
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
  );
};

export default Leaderboard;
