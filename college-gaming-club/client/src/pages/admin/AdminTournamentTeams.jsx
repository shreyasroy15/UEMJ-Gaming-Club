import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Users, Trophy, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminTournamentTeams = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, [tournamentId]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tournaments/${tournamentId}/admin-registrations`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load team registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading teams..." />;

  if (!data) return <div className="text-white">Error: No data loaded.</div>;
  const { tournament, registrations } = data;

  if (!tournament) return <div className="text-white">Error: Tournament data missing.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/teams')}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white font-mono uppercase">{tournament.name}</h1>
          <p className="text-xs text-slate-400">{tournament.game} • {registrations.length} Teams Registered</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-500">Registered Teams</p>
          <p className="text-2xl font-black text-white font-mono">{registrations.length} <span className="text-sm font-normal text-slate-500">/ {tournament.maxTeams}</span></p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Players</p>
          <p className="text-2xl font-black text-white font-mono">
            {registrations.reduce((acc, reg) => acc + (reg.players?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Team List */}
      {registrations.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams registered yet"
          description="Wait for teams to register for this tournament."
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4 text-white">Team Name</th>
                <th className="p-4 text-center">Players</th>
                <th className="p-4">Captain</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {registrations.map((reg) => (
                <tr key={reg._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-100">{reg.teamName}</td>
                  <td className="p-4 text-center font-mono">{reg.players?.length || 0}</td>
                  <td className="p-4 text-slate-400">{reg.captain?.username || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                      reg.status === 'verified' ? 'bg-emerald-950 text-emerald-400' :
                      reg.status === 'complete' ? 'bg-cyan-950 text-cyan-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/admin/teams/${tournamentId}/${reg._id}`}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 transition-colors text-[10px] font-bold"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTournamentTeams;
