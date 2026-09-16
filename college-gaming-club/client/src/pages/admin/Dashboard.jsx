import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import {
  Users,
  Shield,
  Trophy,
  Swords,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [teamsLeaderboard, setTeamsLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await API.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentUsers(res.data.recentUsers || []);
          setRecentTournaments(res.data.recentTournaments || []);
          setTeamsLeaderboard(res.data.teamsLeaderboard || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loading message="Crunching club analytics..." />;

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      subtitle: 'Verified campus gamers',
    },
    {
      title: 'Active Teams',
      value: stats?.totalTeams || 0,
      icon: Shield,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-400',
      subtitle: 'Registered squad rosters',
    },
    {
      title: 'Tournaments',
      value: stats?.totalTournaments || 0,
      icon: Trophy,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
      subtitle: `${stats?.liveTournaments || 0} currently live`,
    },
    {
      title: 'Live Matches',
      value: stats?.liveMatches || 0,
      icon: Swords,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
      subtitle: 'In-progress arenas',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fuchsia-400 font-mono">
            <Activity className="w-4 h-4" />
            <span>Mission Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            ESPORTS ANALYTICS & OVERVIEW
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry on tournament participation, user onboarding, and match activity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Server Status: Online (5000)</span>
        </div>
      </div>

      {/* 4 High-Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg"
          >
            <div className="space-y-1 z-10 min-w-0 pr-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block truncate">
                {card.title}
              </span>
              <p className={`text-2xl sm:text-3xl font-black font-mono ${card.textColor}`}>
                {card.value}
              </p>
              <span className="text-[10px] text-slate-500 block truncate">{card.subtitle}</span>
            </div>

            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg shrink-0`}
            >
              <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytical Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active & Upcoming Tournaments */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" /> Active & Upcoming Tournaments
            </h3>
            <Link to="/admin/tournaments" className="text-xs text-cyan-400 hover:underline shrink-0">
              Manage →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentTournaments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No tournaments yet</p>
            ) : (
              recentTournaments.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-white block truncate font-mono">{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.game} • {t.format}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-amber-400 font-bold">
                      {t.prizePool?.currency || '₹'}{t.prizePool?.total?.toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        t.status === 'live'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Ranked Teams */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" /> Leaderboard Top Teams
            </h3>
            <Link to="/admin/teams" className="text-xs text-cyan-400 hover:underline shrink-0">
              Manage →
            </Link>
          </div>

          <div className="space-y-2.5">
            {teamsLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No registered teams</p>
            ) : (
              teamsLeaderboard.map((team, idx) => (
                <div
                  key={team._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="font-mono font-bold text-amber-400 w-5 text-center">
                      #{idx + 1}
                    </span>
                    <img
                      src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                      alt={team.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{team.name}</span>
                      <span className="text-[10px] text-slate-400">{team.game}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <span className="text-emerald-400">{team.wins || 0}W</span>
                    <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {team.points || 0} PTS
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Recent Player Onboardings
            </h3>
            <Link to="/admin/users" className="text-xs text-cyan-400 hover:underline shrink-0">
              View All →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentUsers.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No registrations yet</p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=100&q=80'}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">{u.name}</span>
                      <span className="text-[10px] text-slate-400">@{u.username} • {u.college}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 text-cyan-400 border border-slate-800 font-mono shrink-0">
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
