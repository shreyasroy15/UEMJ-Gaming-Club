import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollAnimation from 'react-animate-on-scroll';
import API from '../services/api';
import TournamentCard from '../components/TournamentCard/TournamentCard';
import GameCard from '../components/GameCard/GameCard';
import Modal from '../components/Modal/Modal';
import Prism from '../components/Prism/Prism';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Gamepad2,
  Users,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Calendar,
  Shield,
  Medal,
  Award,
  ChevronRight,
  ChevronDown,
  Radio,
} from 'lucide-react';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [featuredTournament, setFeaturedTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Countdown state for featured tournament
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Registration modal state
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tournamentsRes, gamesRes, teamsRes, eventsRes, annRes] = await Promise.all([
          API.get('/tournaments'),
          API.get('/games'),
          API.get('/teams?sort=points'),
          API.get('/events?status=upcoming'),
          API.get('/announcements'),
        ]);

        const allTournaments = tournamentsRes.data.tournaments || [];
        setTournaments(allTournaments);

        // Pick featured tournament (first upcoming or first item)
        const featured = allTournaments.find((t) => t.status === 'upcoming') || allTournaments[0];
        setFeaturedTournament(featured);

        setGames(gamesRes.data.games || []);
        setLeaderboard((teamsRes.data.teams || []).slice(0, 5));
        setEvents((eventsRes.data.events || []).slice(0, 3));
        setAnnouncements((annRes.data.announcements || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load home page content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch user's teams if registering
  useEffect(() => {
    if (isAuthenticated && selectedTournament) {
      API.get('/teams')
        .then((res) => {
          const myTeams = (res.data.teams || []).filter(
            (t) => t.captain?._id === user._id || t.captain === user._id
          );
          setUserTeams(myTeams);
          if (myTeams.length > 0) {
            setSelectedTeamId(myTeams[0]._id);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [isAuthenticated, selectedTournament, user]);

  // Real Countdown Timer
  useEffect(() => {
    if (!featuredTournament) return;

    const targetDate = new Date(featuredTournament.startDate || featuredTournament.registrationDeadline).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [featuredTournament]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      addToast('Please select a team to register', 'error');
      return;
    }

    try {
      setRegistering(true);
      const res = await API.post(`/tournaments/${selectedTournament._id}/register`, {
        teamId: selectedTeamId,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Team successfully registered!', 'success');
        setSelectedTournament(null);
        // Refresh tournaments
        const updated = await API.get('/tournaments');
        setTournaments(updated.data.tournaments || []);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (tournamentFilter === 'all') return true;
    return t.status === tournamentFilter;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#080a10]">
      {/* 1. FULL-SCREEN HERO SECTION */}
      <section className="relative min-h-[calc(100svh-4rem)] sm:min-h-[calc(100svh-5rem)] flex flex-col justify-between overflow-hidden bg-black cyber-grid px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-4 sm:pb-6">
        {/* 3D WebGL Prism Animated Background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-80">
          <Prism
            animationType="rotate"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0.5}
            glow={1}
          />
        </div>

        {/* Glowing Background Radial Effects */}
        <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-fuchsia-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-[#080a10] pointer-events-none" />

        {/* Ambient Corner Cyber HUD Accents (Desktop) */}
        <div className="hidden lg:block absolute top-6 left-8 pointer-events-none select-none text-[10px] font-mono text-cyan-500/30 uppercase tracking-widest">
          SYS.ARENA // V2.5.0
        </div>
        <div className="hidden lg:block absolute top-6 right-8 pointer-events-none select-none text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          LATENCY: 12MS • REGION: ASIA-SOUTH
        </div>

        {/* Main Center Content */}
        <div className="relative max-w-5xl mx-auto text-center z-10 space-y-6 sm:space-y-8 my-auto w-full py-4 sm:py-6">
          {/* Badge */}
          <ScrollAnimation animateIn="fadeInDown" animateOnce={false} duration={0.45} offset={80} initiallyVisible={true}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider uppercase shadow-lg shadow-cyan-500/15 backdrop-blur-md hover:border-cyan-400 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Collegiate Esports League • Season 2025</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 ml-1 border border-cyan-500/30">
                LIVE
              </span>
            </div>
          </ScrollAnimation>

          {/* Headline with Cyber Glow */}
          <ScrollAnimation animateIn="zoomIn" animateOnce={false} duration={0.45} offset={80} initiallyVisible={true}>
            <div className="relative">
              <h1 className="text-3xl min-[420px]:text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white font-mono leading-tight sm:leading-none break-words">
                ENTER THE{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 glow-cyan inline-block drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
                  ARENA
                </span>
              </h1>
            </div>
          </ScrollAnimation>

          {/* Subtitle & Description */}
          <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={80} delay={60} initiallyVisible={true}>
            <div className="space-y-3 max-w-2xl mx-auto px-2">
              <p className="text-sm sm:text-lg md:text-xl font-bold text-slate-200 tracking-wider font-mono uppercase flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span>PLAY</span>
                <span className="text-cyan-400">•</span>
                <span>COMPETE</span>
                <span className="text-cyan-400">•</span>
                <span>CONNECT</span>
                <span className="text-cyan-400">•</span>
                <span>CONQUER</span>
              </p>
              <p className="text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed font-normal">
                Your premier university esports community for competitive tournaments, collegiate scrims, LAN parties, and campus championships. Form squads, battle rivals, and etch your name on the leaderboard.
              </p>
            </div>
          </ScrollAnimation>

          {/* Buttons */}
          <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={80} delay={100} initiallyVisible={true}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1 w-full max-w-md sm:max-w-none mx-auto">
              <Link
                to={isAuthenticated ? '/tournaments' : '/register'}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700 hover:from-cyan-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 group"
              >
                <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
                <span>{isAuthenticated ? 'EXPLORE ARENA' : 'JOIN THE CLUB'}</span>
              </Link>
              <Link
                to="/tournaments"
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/60 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 group backdrop-blur-md"
              >
                <span>BROWSE TOURNAMENTS</span>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollAnimation>
        </div>

        {/* Bottom Section: Statistics Strip & Scroll Cue */}
        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-4 pt-4">
          {/* Statistics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
            <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={80} delay={40} className="h-full">
              <div className="h-full p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/40 backdrop-blur-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10">
                <div className="h-0.5 w-6 rounded-full bg-gradient-to-r from-cyan-400 to-transparent mb-2.5 group-hover:w-10 transition-all duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">500+</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Gamers</span>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={80} delay={80} className="h-full">
              <div className="h-full p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/40 backdrop-blur-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10">
                <div className="h-0.5 w-6 rounded-full bg-gradient-to-r from-amber-400 to-transparent mb-2.5 group-hover:w-10 transition-all duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">25+</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider block mt-1.5">Tournaments</span>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={80} delay={120} className="h-full">
              <div className="h-full p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-indigo-500/40 backdrop-blur-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="h-0.5 w-6 rounded-full bg-gradient-to-r from-indigo-400 to-transparent mb-2.5 group-hover:w-10 transition-all duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">12</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider block mt-1.5">Esports Titles</span>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={80} delay={160} className="h-full">
              <div className="h-full p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/40 backdrop-blur-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="h-0.5 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-transparent mb-2.5 group-hover:w-10 transition-all duration-300" />
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">10+</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider block mt-1.5">Varsity Squads</span>
              </div>
            </ScrollAnimation>
          </div>

          {/* Interactive Scroll Down Indicator */}
          <div className="flex justify-center pt-2 pb-1">
            <button
              onClick={() => {
                const target = document.getElementById('featured-section') || document.getElementById('tournaments-section');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
                }
              }}
              className="group flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors focus:outline-none cursor-pointer py-1 px-3"
              aria-label="Scroll down to explore arena tournaments"
            >
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                Explore Arena
              </span>
              <ChevronDown className="w-4 h-4 text-cyan-400 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. FEATURED TOURNAMENT WITH LIVE COUNTDOWN */}
      {featuredTournament && (
        <section id="featured-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={60}>
            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-900/80 shadow-2xl shadow-cyan-500/10">
              {/* Background Banner with Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={featuredTournament.banner}
                  alt={featuredTournament.name}
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
              </div>

              {/* Content Container */}
              <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                      FEATURED TOURNAMENT
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-200 border border-slate-700">
                      {featuredTournament.game}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono leading-tight">
                    {featuredTournament.name}
                  </h2>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {featuredTournament.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-200 font-mono">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>Prize Pool: <strong className="text-amber-300">{featuredTournament.prizePool?.currency} {featuredTournament.prizePool?.total?.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <span>Teams: <strong>{featuredTournament.registeredTeams?.length || 0} / {featuredTournament.maxTeams}</strong></span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-3 pt-4">
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          addToast('Please login to register a team', 'info');
                          return;
                        }
                        setSelectedTournament(featuredTournament);
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 text-center"
                    >
                      REGISTER NOW
                    </button>
                    <Link
                      to={`/tournaments/${featuredTournament.slug || featuredTournament._id}`}
                      className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all text-center"
                    >
                      VIEW DETAILS
                    </Link>
                  </div>
                </div>

                {/* Working Countdown Box */}
                <div className="w-full lg:w-auto p-4 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-xl shadow-2xl flex flex-col items-center shrink-0">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono mb-3 sm:mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> REGISTRATION COUNTDOWN
                  </span>

                  <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center w-full max-w-xs sm:max-w-none">
                    <div className="p-2 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 min-w-0 flex-1">
                      <span className="text-xl min-[380px]:text-2xl sm:text-3xl font-black text-white font-mono block">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Days</span>
                    </div>

                    <div className="p-2 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 min-w-0 flex-1">
                      <span className="text-xl min-[380px]:text-2xl sm:text-3xl font-black text-white font-mono block">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Hours</span>
                    </div>

                    <div className="p-2 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 min-w-0 flex-1">
                      <span className="text-xl min-[380px]:text-2xl sm:text-3xl font-black text-white font-mono block">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Minutes</span>
                    </div>

                    <div className="p-2 sm:p-3 bg-slate-900 rounded-xl border border-slate-800 min-w-0 flex-1">
                      <span className="text-xl min-[380px]:text-2xl sm:text-3xl font-black text-cyan-400 font-mono block">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Seconds</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-4 text-center">
                    Starts {new Date(featuredTournament.startDate).toLocaleDateString()} • Format: {featuredTournament.format}
                  </p>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </section>
      )}

      {/* 3. UPCOMING TOURNAMENTS WITH STATUS FILTERS */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-900">
          <ScrollAnimation animateIn="fadeInLeft" animateOnce={false} duration={0.45} offset={60}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                CAMPUS LEAGUE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                UPCOMING TOURNAMENTS
              </h2>
            </div>
          </ScrollAnimation>

          {/* Filters */}
          <ScrollAnimation animateIn="fadeInRight" animateOnce={false} duration={0.45} offset={60}>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
              {['all', 'upcoming', 'live', 'completed'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTournamentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap shrink-0 transition-all ${
                    tournamentFilter === filter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </ScrollAnimation>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No tournaments found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, idx) => (
              <ScrollAnimation
                key={tournament._id}
                animateIn="fadeInUp"
                animateOnce={false}
                duration={0.45}
                offset={60}
                delay={Math.min(idx * 40, 160)}
                className="h-full"
              >
                <TournamentCard
                  tournament={tournament}
                  onRegisterClick={(t) => {
                    if (!isAuthenticated) {
                      addToast('Please login to register your team', 'info');
                      return;
                    }
                    setSelectedTournament(t);
                  }}
                />
              </ScrollAnimation>
            ))}
          </div>
        )}

        <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={60}>
          <div className="text-center mt-10">
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-cyan-400 border border-slate-800 hover:border-cyan-500/40 transition-all"
            >
              VIEW ALL TOURNAMENTS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollAnimation>
      </section>

      {/* 4. POPULAR GAMES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-slate-950/40 rounded-3xl border border-slate-900 my-8">
        <ScrollAnimation animateIn="fadeInLeft" animateOnce={false} duration={0.45} offset={60}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                GAME ROSTER
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                POPULAR GAMES
              </h2>
            </div>
            <Link
              to="/games"
              className="text-xs font-bold text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              All Games <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollAnimation>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, idx) => (
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
      </section>

      {/* 5. LEADERBOARD PREVIEW & UPCOMING EVENTS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Leaderboard Preview */}
          <ScrollAnimation animateIn="fadeInLeft" animateOnce={false} duration={0.45} offset={60} className="h-full">
            <div className="flex flex-col justify-between space-y-6 h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                    STANDINGS
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                    LEADERBOARD PREVIEW
                  </h2>
                </div>
                <Link
                  to="/leaderboard"
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Full Leaderboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {leaderboard.map((team, idx) => (
                  <div
                    key={team._id}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0">
                        {idx === 0 ? (
                          <span className="text-amber-400 text-base sm:text-lg">🥇</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-300 text-base sm:text-lg">🥈</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-600 text-base sm:text-lg">🥉</span>
                        ) : (
                          <span className="text-slate-500 font-bold">#{idx + 1}</span>
                        )}
                      </div>
                      <img
                        src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                        alt={team.name}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white font-mono truncate">{team.name}</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{team.game}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono shrink-0">
                      <span className="text-slate-400 hidden sm:inline">
                        <strong>{team.matchesPlayed || 0}</strong> M
                      </span>
                      <span className="text-emerald-400 text-[11px] sm:text-xs">
                        <strong>{team.wins || 0}</strong> W
                      </span>
                      <span className="text-amber-400 font-bold px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[11px] sm:text-xs">
                        {team.points || 0} PTS
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/leaderboard"
                className="w-full text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors block"
              >
                VIEW FULL LEADERBOARD
              </Link>
            </div>
          </ScrollAnimation>

          {/* Upcoming Events */}
          <ScrollAnimation animateIn="fadeInRight" animateOnce={false} duration={0.45} offset={60} className="h-full">
            <div className="flex flex-col justify-between space-y-6 h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    CALENDAR
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                    UPCOMING EVENTS
                  </h2>
                </div>
                <Link
                  to="/events"
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  All Events <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all items-start sm:items-center"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0 sm:hidden">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                          {event.category}
                        </span>
                        <h4 className="text-sm font-bold text-white font-mono truncate mt-0.5">{event.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{event.location}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block flex-1 min-w-0 space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {event.category}
                      </span>
                      <h4 className="text-sm font-bold text-white font-mono truncate">{event.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{event.location}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {new Date(event.date).toLocaleDateString()} • {event.time}
                      </p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <p className="text-[11px] text-slate-400 sm:hidden flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      <Link
                        to="/events"
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors shrink-0"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/events"
                className="w-full text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors block"
              >
                EXPLORE ALL EVENTS
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* 6. LATEST ANNOUNCEMENTS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={60}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-400 font-mono">
                OFFICIAL BULLETINS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                CLUB ANNOUNCEMENTS
              </h2>
            </div>
            <Link
              to="/news"
              className="text-xs font-bold text-slate-400 hover:text-cyan-400 flex items-center gap-1"
            >
              All Bulletins <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.map((ann, idx) => (
            <ScrollAnimation
              key={ann._id}
              animateIn="fadeInUp"
              animateOnce={false}
              duration={0.45}
              offset={60}
              delay={Math.min(idx * 40, 160)}
              className="h-full"
            >
              <div
                className="h-full p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-500/30">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono line-clamp-2">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                <Link
                  to="/news"
                  className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Read Announcement <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </section>

      {/* 7. COMMUNITY CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <ScrollAnimation animateIn="zoomIn" animateOnce={false} duration={0.45} offset={60}>
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-14 text-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/60 border border-cyan-500/30 shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-5 sm:space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
                GET INVOLVED
              </span>
              <h2 className="text-2xl min-[400px]:text-3xl sm:text-5xl font-black text-white font-mono">
                READY TO JOIN THE CLUB?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Step up to collegiate esports. Compete in campus tournaments, represent your department, join LAN parties, and meet players just like you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to={isAuthenticated ? '/profile' : '/register'}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all"
                >
                  JOIN NOW
                </Link>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" /> DISCORD COMMUNITY
                </a>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* Tournament Registration Modal */}
      <Modal
        isOpen={!!selectedTournament}
        onClose={() => setSelectedTournament(null)}
        title={`Register for ${selectedTournament?.name || 'Tournament'}`}
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <p className="text-slate-300">
              <strong>Game:</strong> {selectedTournament?.game}
            </p>
            <p className="text-slate-300">
              <strong>Format:</strong> {selectedTournament?.format}
            </p>
            <p className="text-slate-300">
              <strong>Entry Fee:</strong> {selectedTournament?.entryFee === 0 ? 'Free' : `₹${selectedTournament?.entryFee}`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Your Team (You must be Captain)
            </label>
            {userTeams.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <p>You have not created any team for this tournament yet.</p>
                <Link
                  to="/teams"
                  onClick={() => setSelectedTournament(null)}
                  className="inline-block font-bold text-cyan-400 underline"
                >
                  Create a Team first
                </Link>
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {userTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} ({team.game}) - [{team.members?.length || 1} members]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedTournament(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            {userTeams.length > 0 && (
              <button
                type="submit"
                disabled={registering}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Confirm Registration'}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Home;
