import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TournamentCard from '../components/TournamentCard/TournamentCard';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import { useAuth } from '../context/AuthContext';
import { Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyTournaments = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTournaments = async () => {
      try {
        setLoading(true);
        // Fetch all tournaments and all user teams
        const [tournamentsRes, teamsRes] = await Promise.all([
          API.get('/tournaments'),
          API.get('/teams'),
        ]);

        const allTournaments = tournamentsRes.data.tournaments || [];
        const allTeams = teamsRes.data.teams || [];

        // Find teams where user is a member
        const myTeamIds = allTeams
          .filter((t) => t.members?.some((m) => (m.user?._id || m.user) === user?._id))
          .map((t) => t._id.toString());

        // Filter tournaments that have these teams registered
        const myTourneys = allTournaments.filter((tourney) =>
          tourney.registeredTeams?.some((reg) => myTeamIds.includes((reg.team?._id || reg.team).toString()))
        );

        setTournaments(myTourneys);
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

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
          <Trophy className="w-4 h-4" />
          <span>Player Dashboard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
          MY REGISTERED TOURNAMENTS
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tournaments where your squads are competing for collegiate championship titles.
        </p>
      </div>

      {loading ? (
        <Loading message="Fetching registered tournaments..." />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No registered tournaments"
          description="You haven't entered any tournaments yet. Join a tournament with your squad!"
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
          {tournaments.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTournaments;
