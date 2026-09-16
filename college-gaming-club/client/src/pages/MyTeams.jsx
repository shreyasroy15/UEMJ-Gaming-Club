import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TeamCard from '../components/TeamCard/TeamCard';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { useAuth } from '../context/AuthContext';
import { Shield, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        setLoading(true);
        const res = await API.get('/teams');
        const allTeams = res.data.teams || [];
        const myTeams = allTeams.filter((t) =>
          t.members?.some((m) => (m.user?._id || m.user) === user?._id)
        );
        setTeams(myTeams);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyTeams();
    }
  }, [user]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
            <Shield className="w-4 h-4" />
            <span>Roster Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
            MY SQUADS & TEAMS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Teams where you are active as a Captain or Roster Player.
          </p>
        </div>

        <Link
          to="/teams"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-bold text-white shadow-md shadow-cyan-500/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create or Join Team
        </Link>
      </div>

      {loading ? (
        <Loading message="Loading squad affiliations..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="You are not in any squad yet"
          description="Create your own team or request an invitation from an existing captain."
          action={
            <Link
              to="/teams"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950"
            >
              Browse Teams Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
