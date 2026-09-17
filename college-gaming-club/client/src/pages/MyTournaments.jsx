import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const MyTournaments = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTournaments = async () => {
      try {
        setLoading(true);
        // Fetch new dynamic tournament squad registrations
        const res = await API.get('/registrations/my-tournaments');
        setRegistrations(res.data.registrations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyTournaments();
    }
  }, [user]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    addToast(`Team code ${code} copied!`, 'success');
  };

  return (
    <div className="py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
          <Trophy className="w-4 h-4" />
          <span>Player Tournament Portal</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1">
          MY REGISTERED TOURNAMENTS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Track your team rosters, player completion checklists, and collegiate championship standings.
        </p>
      </div>

      {loading ? (
        <Loading message="Fetching registered tournaments..." />
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No registered tournaments"
          description="You haven't entered any tournaments yet. Join a tournament or create a squad with your friends!"
          action={
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950"
            >
              Browse Open Tournaments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((reg) => {
            const tournament = reg.tournament;
            if (!tournament) return null;

            const mySlot = reg.players?.find(
              (p) => (p.user?._id || p.user) === user?._id
            );
            const isCaptain = (reg.captain?._id || reg.captain) === user?._id;
            const isComplete = reg.status === 'complete' || reg.status === 'verified';
            const completedPlayers = reg.players?.filter((p) => p.status === 'completed') || [];

            return (
              <div
                key={reg._id}
                className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition-all"
              >
                <div>
                  {/* Banner header */}
                  <div className="relative h-32 w-full overflow-hidden">
                    <img
                      src={tournament.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'}
                      alt={tournament.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 font-mono">
                      {tournament.game}
                    </span>
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                        reg.status === 'verified'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : isComplete
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}
                    >
                      {reg.status === 'verified'
                        ? '✓ Verified'
                        : isComplete
                        ? '✓ Complete'
                        : '⏳ Incomplete'}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono leading-snug">
                        {tournament.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Team: <strong>{reg.teamName}</strong></span>
                        {reg.teamTag && <span className="text-indigo-400">[{reg.teamTag}]</span>}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Your Role:</span>
                        <span className="font-bold text-white uppercase">
                          {isCaptain ? '👑 Captain' : mySlot?.role || 'Player'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Your Status:</span>
                        <span className={mySlot?.status === 'completed' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {mySlot?.status === 'completed' ? '✓ Completed' : '⏳ Action Needed'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Roster Filled:</span>
                        <span className="text-cyan-400 font-bold">
                          {completedPlayers.length}/{reg.players?.length} Ready
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Team Code:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(reg.teamCode)}
                          className="font-bold text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {reg.teamCode} <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-5 pt-0">
                  <Link
                    to={`/tournaments/${tournament._id}/register`}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    Open Squad Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTournaments;
