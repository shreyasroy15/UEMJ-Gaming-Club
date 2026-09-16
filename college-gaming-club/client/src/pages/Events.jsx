import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Clock, Users, Sparkles, CheckCircle2, Search } from 'lucide-react';

const Events = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filterCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = filterCategory === 'all' ? '/events' : `/events?category=${encodeURIComponent(filterCategory)}`;
      const res = await API.get(url);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (event) => {
    if (!isAuthenticated) {
      addToast('Please login to register for events', 'info');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post(`/events/${event._id}/register`);
      if (res.data.success) {
        addToast(res.data.message || 'Successfully registered for event!', 'success');
        setRegisteringEvent(null);
        fetchEvents();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', 'LAN Gaming', 'Workshop', 'Meetup', 'Championship'];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Calendar className="w-4 h-4" />
            <span>Campus Gatherings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
            GAMING EVENTS & LAN NIGHTS
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            From overnight pizza & LAN parties to game development workshops and tournament ceremonies.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <Loading message="Loading campus calendar..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events scheduled"
          description="Check back soon for new LAN parties and esports workshops."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => {
            const isRegistered =
              user && event.registrations?.some((r) => (r.user?._id || r.user) === user._id);
            const isFull = event.registrations?.length >= event.capacity;

            return (
              <div
                key={event._id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Image */}
                <div className="relative w-full sm:w-56 h-48 sm:h-auto shrink-0 bg-slate-950">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
                      {event.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Register action */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {event.registrations?.length || 0} / {event.capacity} Slots
                      </span>
                    </div>

                    {isRegistered ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                      </span>
                    ) : isFull ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                        Full Capacity
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegisterEvent(event)}
                        disabled={submitting}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all"
                      >
                        Register Free
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
