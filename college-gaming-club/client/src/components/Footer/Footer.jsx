import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, MapPin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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

          {/* Col 2: Esports Titles */}
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
