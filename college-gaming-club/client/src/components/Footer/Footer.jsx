import React from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad2,
  MapPin,
  Mail,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800/50 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mb-8">
          {/* Col 1: Brand & HQ */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-lg tracking-wider text-white font-mono leading-tight">
                UEM<br />
                <span className="text-cyan-400">GAMING</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              The official esports organization at UEM Jaipur. Cultivating talent and organizing competitive gaming experiences.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-300">Room 204, UEM Jaipur</p>
                  <p>Campus Lab</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <a
                  href="mailto:esports@uemjgaming.club"
                  className="hover:text-cyan-400 transition-colors"
                >
                  esports@uemjgaming.club
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/tournaments"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Tournaments
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Points Table
                </Link>
              </li>
              <li>
                <Link
                  to="/teams"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Teams
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Rules & FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Esports Titles */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Esports Titles
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/tournaments?game=Valorant"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Valorant
                </Link>
              </li>
              <li>
                <Link
                  to="/tournaments?game=BGMI"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  BGMI
                </Link>
              </li>
              <li>
                <Link
                  to="/tournaments?game=EA%20Sports%20FC"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  EA Sports FC
                </Link>
              </li>
              <li>
                <Link
                  to="/tournaments?game=Free%20Fire"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Free Fire
                </Link>
              </li>
              <li>
                <Link
                  to="/tournaments?game=Minecraft"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Minecraft Bedwars
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Community & Socials */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Community
            </h4>
            <div className="space-y-3 text-sm">
              <a
                href="https://discord.gg/uemgaming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-400 hover:text-cyan-400 transition-colors group"
              >
                <MessageCircle className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                Discord Server
              </a>
              <a
                href="https://whatsapp.com/group/uemgaming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-400 hover:text-cyan-400 transition-colors group"
              >
                <MessageSquare className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                WhatsApp Community
              </a>
              <a
                href="https://instagram.com/uemgaming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-400 hover:text-cyan-400 transition-colors group"
              >
                <span className="w-4 h-4 group-hover:translate-x-1 transition-transform inline-flex items-center justify-center">📸</span>
                Instagram
              </a>
              <a
                href="https://youtube.com/uemgaming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-400 hover:text-cyan-400 transition-colors group"
              >
                <span className="w-4 h-4 group-hover:translate-x-1 transition-transform inline-flex items-center justify-center">▶️</span>
                YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Credits */}
        <div className="border-t border-slate-800/50 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {currentYear} UEM Jaipur Gaming Club. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="hover:text-cyan-400 transition-colors">
                Contact
              </Link>
              <span>•</span>
              <p>
                Developed with <span className="text-cyan-400">❤️</span> by UEM Gaming Club Dev Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
