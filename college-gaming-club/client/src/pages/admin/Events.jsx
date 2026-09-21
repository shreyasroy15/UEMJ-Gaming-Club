import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import { Calendar, Plus, Trash2, Edit, Users } from 'lucide-react';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    category: 'LAN Gaming',
    date: '',
    time: '4:00 PM - 8:00 PM',
    location: 'Lab 3 & 4',
    capacity: 100,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: 'Campus esports gathering.',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      category: 'LAN Gaming',
      date: new Date(Date.now() + 5 * 24 * 3600000).toISOString().slice(0, 10),
      time: '6:00 PM - 10:00 PM',
      location: 'University Computer Center, Lab 3',
      capacity: 100,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      description: evt.description,
      image: evt.image,
      category: evt.category || 'LAN Gaming',
      date: new Date(evt.date).toISOString().slice(0, 10),
      time: evt.time || '4:00 PM - 8:00 PM',
      location: evt.location || 'Lab 3',
      capacity: evt.capacity || 100,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingEvent) {
        await API.put(`/events/${editingEvent._id}`, formData);
        addToast('Event updated successfully', 'success');
      } else {
        await API.post('/events', formData);
        addToast('Event created successfully', 'success');
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eId, eTitle) => {
    if (!window.confirm(`Delete event "${eTitle}"?`)) return;

    try {
      await API.delete(`/events/${eId}`);
      addToast('Event deleted', 'success');
      fetchEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-mono">
            CAMPUS EVENTS & LAN NIGHTS
          </h1>
          <p className="text-xs text-slate-600">
            Publish gaming gatherings, manage capacity thresholds, and view player RSVPs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-indigo-500"
        >
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {loading ? (
        <Loading message="Loading events..." />
      ) : events.length === 0 ? (
        <EmptyState icon={Calendar} title="No events created" description="Add your first event." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((evt) => (
            <div
              key={evt._id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="flex gap-4">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                />
                <div className="min-w-0 space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {evt.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-mono truncate">{evt.title}</h3>
                  <p className="text-xs text-slate-600 truncate">{evt.location}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(evt.date).toLocaleDateString()} • {evt.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-600 font-mono">
                  RSVPs: <strong className="text-slate-900">{evt.registrations?.length || 0}</strong> / {evt.capacity}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(evt._id, evt.title)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
              >
                <option value="LAN Gaming">LAN Gaming</option>
                <option value="Workshop">Workshop</option>
                <option value="Meetup">Meetup</option>
                <option value="Championship">Championship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="10"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Time Interval *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5:00 PM - 9:00 PM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Location / Venue *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Image URL *
            </label>
            <input
              type="url"
              required
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminEvents;
