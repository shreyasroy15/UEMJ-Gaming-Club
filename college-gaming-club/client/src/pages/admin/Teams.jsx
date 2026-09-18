import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Trophy, Users, Shield, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminTeams = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/tournaments');
      setTournaments(res.data.tournaments || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white font-mono">
          TOURNAMENT TEAMS MANAGEMENT
        </h1>
        <p className="text-xs text-slate-400">
          Select a tournament to manage its registered teams, rosters, and identity proofs.
        </p>
      </div>

      {loading ? (
        <Loading message="Loading tournaments..." />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description="There are no tournaments available to manage teams."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link
              key={tournament._id}
              to={`/admin/teams/${tournament._id}`}
              className="group block p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {tournament.name}
                  </h3>
                  <p className="text-xs text-slate-400">{tournament.game}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>
                    Teams: <strong className="text-white">{tournament.registeredTeams?.length || 0}</strong> {tournament.maxTeams ? `/ ${tournament.maxTeams}` : ''}
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase ${
                  tournament.status === 'live' ? 'bg-emerald-950 text-emerald-400' :
                  tournament.status === 'upcoming' ? 'bg-amber-950 text-amber-400' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {tournament.status}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeams;
