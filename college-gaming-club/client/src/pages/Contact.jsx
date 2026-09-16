import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Mail, MapPin, Send, Phone, MessageSquare, ChevronDown } from 'lucide-react';

const Contact = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      addToast('Your message has been sent to the Gaming Club committee!', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitting(false);
    }, 600);
  };

  const faqs = [
    {
      q: 'Who can join the College Gaming Club?',
      a: 'Any enrolled student of the university across all years and departments can join. Membership is 100% free.',
    },
    {
      q: 'Do I need a pro gaming laptop or rig to participate?',
      a: 'No! You can participate in all LAN events and tournament matches using our university esports lab computers (Room 204) or mobile titles.',
    },
    {
      q: 'How do I register my team for campus tournaments?',
      a: 'First, create a team roster in the Teams section, invite your teammates by username, and then head over to the Tournaments page to hit "Register".',
    },
    {
      q: 'Where do tournament finals take place?',
      a: 'Knockout finals and championship matches are played on stage in the University Auditorium with live projector broadcasts and audience shoutcasting.',
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
          GET IN TOUCH
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-mono">
          CONTACT & COMMUNITY SUPPORT
        </h1>
        <p className="text-sm text-slate-400">
          Have queries about tournament rules, sponsorships, or scrims? Drop us a message or reach out on Discord.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Form */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-6">
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" /> Send a Direct Inquiry
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Rivera"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                University Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. student@uemjgaming.club"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Tournament Roster Inquiry"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Message *
              </label>
              <textarea
                rows="4"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your questions or notes here..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Address & FAQ Column */}
        <div className="space-y-8">
          {/* Quick info */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">Esports Headquarters</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Student Activity Center, Room 204, UEM Jaipur Campus, Sikar Road, Rajasthan 303807</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>esports@uemjgaming.club</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>+91 98765 43210 (Club Helpline)</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">{faq.q}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
