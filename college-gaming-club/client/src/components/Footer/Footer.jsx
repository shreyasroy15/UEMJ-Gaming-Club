import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Shield, Heart, Send, MapPin, Mail, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Col 1: Brand & College Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-xl tracking-wider text-white font-mono">
                COLLEGE <span className="text-cyan-400">GAMING</span> CLUB
              </span>
            </Link>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The official esports and competitive gaming student organization of the university. Cultivating talent, organizing campus tournaments, and creating unforgettable gaming experiences.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>UEM Campus, Sikar Road, Jaipur, Rajasthan 303807</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>esports@uemjgaming.club</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/tournaments" className="hover:text-cyan-400 transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link to="/games" className="hover:text-cyan-400 transition-colors">
                  Popular Games
                </Link>
              </li>
              <li>
                <Link to="/teams" className="hover:text-cyan-400 transition-colors">
                  Student Teams
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-cyan-400 transition-colors">
                  Campus Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-cyan-400 transition-colors">
                  Events & LAN Nights
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Esports Titles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Esports Titles
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/tournaments?game=Valorant" className="hover:text-cyan-400 transition-colors">
                  Valorant 5v5
                </Link>
              </li>
              <li>
                <Link to="/tournaments?game=BGMI" className="hover:text-cyan-400 transition-colors">
                  BGMI Squads
                </Link>
              </li>
              <li>
                <Link to="/tournaments?game=Counter-Strike%202" className="hover:text-cyan-400 transition-colors">
                  Counter-Strike 2
                </Link>
              </li>
              <li>
                <Link to="/tournaments?game=EA%20Sports%20FC" className="hover:text-cyan-400 transition-colors">
                  EA Sports FC 24
                </Link>
              </li>
              <li>
                <Link to="/tournaments?game=Minecraft" className="hover:text-cyan-400 transition-colors">
                  Minecraft Bedwars
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Community & Discord */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Join Discord
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect with 1,200+ campus gamers, find scrim scrims partners, and get live match alerts.
            </p>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-bold transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Join Discord Server
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} College Gaming Club. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <Link to="/about" className="hover:text-slate-400 transition-colors">
              Rules & Code of Conduct
            </Link>
            <Link to="/contact" className="hover:text-slate-400 transition-colors">
              Contact Us
            </Link>
            <span className="flex items-center gap-1 text-slate-600">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Gamers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
