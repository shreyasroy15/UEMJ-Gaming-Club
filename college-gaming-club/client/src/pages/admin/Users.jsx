import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import { Users, Shield, Trash2, Edit, Search } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditRole = (u) => {
    setEditingUser(u);
    setSelectedRole(u.role || 'student');
    setEditModalOpen(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await API.put(`/users/${editingUser._id}`, { role: selectedRole });
      if (res.data.success) {
        addToast(`Role updated to ${selectedRole} for ${editingUser.name}`, 'success');
        setEditModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (uId, uName) => {
    if (!window.confirm(`Permanently remove player account "${uName}"?`)) return;

    try {
      await API.delete(`/users/${uId}`);
      addToast('User deleted', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">
            USER ACCOUNTS & ROLES
          </h1>
          <p className="text-xs text-slate-400">
            Audit registered players and supervise collegiate memberships.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {loading ? (
        <Loading message="Loading student user directory..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try modifying your search." />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Player</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">College</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Matches</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=100&q=80'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-white block">{u.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">@{u.username}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-400 font-mono">{u.email}</td>

                    <td className="p-4 text-slate-400 truncate max-w-xs">{u.college}</td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                          u.role === 'admin'
                            ? 'bg-fuchsia-950 text-fuchsia-400 border-fuchsia-800'
                            : 'bg-slate-950 text-cyan-400 border-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4 font-mono">
                      {u.stats?.matchesPlayed || 0} ({u.stats?.wins || 0}W)
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditRole(u)}
                        title="Change User Role"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        title="Delete User"
                        className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-900 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Change Role for ${editingUser?.name}`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="student">student (Standard Player)</option>
              <option value="admin">admin (Full Superuser Privileges)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
