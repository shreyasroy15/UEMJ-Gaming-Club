import React, { useState, useEffect } from 'react';
import ScrollAnimation from 'react-animate-on-scroll';
import API from '../services/api';
import GameCard from '../components/GameCard/GameCard';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { Gamepad2, Search } from 'lucide-react';

const Games = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await API.get('/games');
        setGames(res.data.games || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const filteredGames = games.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <ScrollAnimation animateIn="fadeInDown" animateOnce={false} duration={0.45} offset={60} initiallyVisible={true}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              <Gamepad2 className="w-4 h-4" />
              <span>Varsity Esports Titles</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
              SUPPORTED GAMES
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Explore our official competitive gaming titles. Register for sanctioned campus leagues and scrims.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search games or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </ScrollAnimation>

      {/* Content */}
      {loading ? (
        <Loading message="Loading supported game titles..." />
      ) : filteredGames.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No games found"
          description="Try changing your search query."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, idx) => (
            <ScrollAnimation
              key={game._id}
              animateIn="fadeInUp"
              animateOnce={false}
              duration={0.45}
              offset={60}
              delay={Math.min(idx * 40, 160)}
              className="h-full"
            >
              <GameCard game={game} />
            </ScrollAnimation>
          ))}
        </div>
      )}
    </div>
  );
};

export default Games;
