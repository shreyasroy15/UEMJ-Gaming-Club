import React from 'react';
import { Gamepad2, Shield, Trophy, Users, Heart, Zap, Cpu, Award } from 'lucide-react';

const About = () => {
  const leadership = [
    {
      name: 'Alex Rivera',
      role: 'President & Head of Esports',
      department: 'Dept. of Computer Science & Eng.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Shreyas Sharma',
      role: 'Vice President & Tournament Director',
      department: 'Dept. of Computer Science & Eng.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Rohit Verma',
      role: 'Head of Mobile Esports',
      department: 'Dept. of Information Technology',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Anya Sen',
      role: 'Community Lead & Broadcast Producer',
      department: 'Dept. of AI & Machine Learning',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
          ABOUT THE ORGANIZATION
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-white font-mono leading-tight">
          COLLEGE GAMING CLUB
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">
          Founded in 2022 at University of Engineering & Management, we bridge the gap between casual campus gaming and high-tier competitive collegiate esports.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">Competitive Excellence</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Representing the university at national collegiate leagues like Red Bull Campus Clutch, BGIS, and AIU University Championships.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">Inclusive Community</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Welcoming all skill levels. Whether you are aiming for Radiant in Valorant or enjoying Minecraft and FIFA with friends, there is a squad for you.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-950/80 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">Gaming & Tech Careers</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Fostering student casters, tournament admins, esports graphics designers, and game developers through hands-on production experience.
          </p>
        </div>
      </div>

      {/* Leadership Board */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            EXECUTIVE COMMITTEE
          </span>
          <h2 className="text-3xl font-black text-white font-mono">
            CLUB LEADERSHIP
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leadership.map((member) => (
            <div
              key={member.name}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3"
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
              />
              <div>
                <h4 className="text-base font-bold text-white font-mono">{member.name}</h4>
                <p className="text-xs font-semibold text-cyan-400 mt-0.5">{member.role}</p>
                <p className="text-[11px] text-slate-400 mt-1">{member.department}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
