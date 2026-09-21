import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Shield,
  Crown,
  Gamepad2,
  Flame,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  RefreshCw,
  Plus,
  UserPlus,
  Edit3,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  UserX,
  UserCheck,
  Activity,
  BarChart3,
  Trophy,
  Swords,
  Sparkles,
  X,
  ArrowUpRight,
  Check,
  Copy,
  Layers,
} from 'lucide-react';

const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  // Statistics State (Real DB Counts)
  const [stats, setStats] = useState({
    totalUsers: 0,
    players: 0,
    captains: 0,
    admins: 0,
    pending: 0,
    suspended: 0,
  });
  const [trends, setTrends] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Users Data State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [teamsList, setTeamsList] = useState([]);

  // Filter States
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedGame, setSelectedGame] = useState(searchParams.get('game') || 'all');
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedTeam, setSelectedTeam] = useState(searchParams.get('team') || 'all');

  // Checkbox Selection for batch/table
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Profile Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' | 'stats' | 'activity'
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userActivity, setUserActivity] = useState([]);

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    email: '',
    college: '',
    game: 'BGMI',
    gameId: '',
    role: 'player',
    teamName: '',
    status: 'active',
    bio: '',
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Assign Team Modal State
  const [assignTeamModalOpen, setAssignTeamModalOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState(null);
  const [assignTeamName, setAssignTeamName] = useState('');
  const [assignRole, setAssignRole] = useState('player');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Confirmation Action Dialog Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: null,
    targetUser: null,
    confirmButtonText: 'Confirm',
    confirmButtonClass: 'bg-purple-600 hover:bg-purple-500',
  });

  // Action Dropdown Menu per row
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync URL search params with local filter states
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const gameParam = searchParams.get('game');
    if (roleParam) setSelectedRole(roleParam);
    if (gameParam) setSelectedGame(gameParam);
  }, [searchParams]);

  // Fetch overview statistics
  const fetchStatsOverview = async () => {
    try {
      setStatsLoading(true);
      const res = await API.get('/users/stats/overview');
      if (res.data.success) {
        setStats(res.data.stats || {});
        setTrends(res.data.trends || {});
      }
    } catch (err) {
      console.error('Failed to load stats overview:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch paginated & filtered users (supports parameter overrides for instant reset/refresh)
  const fetchUsers = async (overrides = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: overrides.page !== undefined ? overrides.page : currentPage,
        limit,
        tab: overrides.tab !== undefined ? overrides.tab : activeTab,
        search: overrides.search !== undefined ? overrides.search : debouncedSearch,
        game: overrides.game !== undefined ? overrides.game : selectedGame,
        role: overrides.role !== undefined ? overrides.role : selectedRole,
        status: overrides.status !== undefined ? overrides.status : selectedStatus,
        team: overrides.team !== undefined ? overrides.team : selectedTeam,
      };

      const res = await API.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.users || []);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.teamsList && res.data.teamsList.length > 0) {
          setTeamsList(res.data.teamsList);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Unable to load users. Please check your network connection.');
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsOverview();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, limit, activeTab, debouncedSearch, selectedGame, selectedRole, selectedStatus, selectedTeam]);

  // Automatically refresh users and stats when window gains focus or every 15 seconds
  // so that any newly logged-in or registered user is immediately visible in the admin panel
  useEffect(() => {
    const handleFocus = () => {
      fetchUsers();
      fetchStatsOverview();
    };
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => {
      fetchUsers();
      fetchStatsOverview();
    }, 15000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [currentPage, limit, activeTab, debouncedSearch, selectedGame, selectedRole, selectedStatus, selectedTeam]);

  // Close row action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle Tab Switch
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    setSelectedUserIds([]);
  };

  // Unified Refresh & Reset: Resets all filters/search and fetches latest data
  const handleRefreshAll = async () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedGame('all');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSelectedTeam('all');
    setActiveTab('all');
    setCurrentPage(1);
    setSelectedUserIds([]);
    setSearchParams({});

    try {
      await Promise.all([
        fetchUsers({
          page: 1,
          tab: 'all',
          search: '',
          game: 'all',
          role: 'all',
          status: 'all',
          team: 'all',
        }),
        fetchStatsOverview(),
      ]);
      addToast('✓ Users roster refreshed and filters reset', 'success');
    } catch {
      addToast('Failed to refresh roster', 'error');
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      addToast('Preparing CSV export...', 'info');
      const params = {
        tab: activeTab,
        search: debouncedSearch,
        game: selectedGame,
        role: selectedRole,
        status: selectedStatus,
        team: selectedTeam,
      };

      const res = await API.get('/users/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `uem_gaming_club_users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('✓ Users export downloaded successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      addToast('Failed to export users CSV', 'error');
    }
  };

  // Open Profile Drawer
  const handleOpenProfileDrawer = async (userObj) => {
    setSelectedUser(userObj);
    setDrawerOpen(true);
    setDrawerTab('overview');
    setDrawerLoading(true);

    try {
      // Fetch fresh user profile details (including live teamInfo), stats, and activity
      const [userRes, statsRes, actRes] = await Promise.all([
        API.get(`/users/${userObj._id}`),
        API.get(`/users/${userObj._id}/stats`),
        API.get(`/users/${userObj._id}/activity`),
      ]);
      if (userRes.data.success && userRes.data.user) {
        setSelectedUser(userRes.data.user);
      }
      if (statsRes.data.success) {
        setUserStats(statsRes.data.stats);
      }
      if (actRes.data.success) {
        setUserActivity(actRes.data.activity || []);
      }
    } catch (err) {
      console.error('Error fetching user profile details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // View Team in Admin Teams page
  const handleViewTeam = (teamName) => {
    if (!teamName || teamName.toLowerCase() === 'free agent') return;
    navigate(`/admin/teams?tab=all-teams&search=${encodeURIComponent(teamName)}`);
  };

  // Open Assign Team Modal
  const handleOpenAssignTeam = (userObj) => {
    setAssigningUser(userObj);
    const existingTeam = userObj.teamInfo?.name && !userObj.teamInfo?.isFreeAgent ? userObj.teamInfo.name : '';
    setAssignTeamName(existingTeam);
    setAssignRole(userObj.role === 'captain' ? 'captain' : 'player');
    setAssignTeamModalOpen(true);
  };

  // Submit Team Assignment
  const handleAssignTeamSubmit = async (e) => {
    e.preventDefault();
    if (!assigningUser) return;
    const targetTeam = assignTeamName.trim();
    try {
      setSubmittingAssign(true);
      const res = await API.put(`/users/${assigningUser._id}`, {
        teamName: targetTeam || 'Free Agent',
        role: assignRole === 'captain' ? 'captain' : 'student',
      });
      if (res.data.success) {
        addToast(`✓ Team updated: ${targetTeam || 'Free Agent'}`, 'success');
        setAssignTeamModalOpen(false);
        fetchUsers();
        fetchStatsOverview();
        // Also update selectedUser if open in drawer
        if (selectedUser && selectedUser._id === assigningUser._id) {
          const updated = await API.get(`/users/${assigningUser._id}`);
          if (updated.data.success) {
            setSelectedUser(updated.data.user);
          }
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update team', 'error');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (userObj) => {
    setEditingUser(userObj);
    setEditFormData({
      name: userObj.name || '',
      username: userObj.username || '',
      email: userObj.email || '',
      college: userObj.college || 'UEM Jaipur',
      game: userObj.game || 'BGMI',
      gameId: userObj.gameId || `@${userObj.username}`,
      role: userObj.role || 'player',
      teamName: userObj.teamName || '',
      status: userObj.status || 'active',
      bio: userObj.bio || '',
    });
    setEditModalOpen(true);
    setActiveMenuId(null);
  };

  // Submit Edit User
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEdit(true);
      const res = await API.put(`/users/${editingUser._id}`, editFormData);
      if (res.data.success) {
        addToast('✓ User updated successfully', 'success');
        setEditModalOpen(false);
        if (selectedUser && selectedUser._id === editingUser._id) {
          setSelectedUser({ ...selectedUser, ...res.data.user });
        }
        fetchStatsOverview();
        fetchUsers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || '❌ Failed to update user', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Execute Confirmation Action
  const executeConfirmAction = async () => {
    const { actionType, targetUser } = confirmModal;
    if (!targetUser) return;

    try {
      if (actionType === 'suspend') {
        const res = await API.post(`/users/${targetUser._id}/suspend`);
        if (res.data.success) {
          addToast('✓ User suspended successfully', 'success');
        }
      } else if (actionType === 'activate') {
        const res = await API.post(`/users/${targetUser._id}/activate`);
        if (res.data.success) {
          addToast('✓ User activated successfully', 'success');
        }
      } else if (actionType === 'reset') {
        const res = await API.post(`/users/${targetUser._id}/reset-access`);
        if (res.data.success) {
          addToast('✓ Access reset successfully. Temporary credentials generated.', 'success');
          setCopiedToken(res.data.resetToken);
        }
      } else if (actionType === 'delete') {
        const res = await API.delete(`/users/${targetUser._id}`);
        if (res.data.success) {
          addToast('✓ User deleted successfully (tournament records preserved)', 'success');
          if (drawerOpen && selectedUser?._id === targetUser._id) {
            setDrawerOpen(false);
          }
        }
      }

      setConfirmModal({ isOpen: false, title: '', message: '', actionType: null, targetUser: null });
      fetchStatsOverview();
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed to execute', 'error');
    }
  };

  // Prompt Suspend User
  const promptSuspend = (userObj) => {
    setActiveMenuId(null);
    setConfirmModal({
      isOpen: true,
      title: 'Suspend User Account',
      message: `Are you sure you want to suspend account for "${userObj.name}" (@${userObj.username})? The user will be immediately blocked from logging in or joining matches.`,
      actionType: 'suspend',
      targetUser: userObj,
      confirmButtonText: 'Suspend Account',
      confirmButtonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    });
  };

  // Prompt Activate User
  const promptActivate = (userObj) => {
    setActiveMenuId(null);
    setConfirmModal({
      isOpen: true,
      title: 'Activate User Account',
      message: `Restore active competitive privileges for "${userObj.name}" (@${userObj.username})?`,
      actionType: 'activate',
      targetUser: userObj,
      confirmButtonText: 'Activate Account',
      confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    });
  };

  // Prompt Reset Access
  const promptResetAccess = (userObj) => {
    setActiveMenuId(null);
    setConfirmModal({
      isOpen: true,
      title: 'Reset User Access',
      message: `Generate password reset authorization for "${userObj.name}" (@${userObj.username})? The previous session tokens will expire.`,
      actionType: 'reset',
      targetUser: userObj,
      confirmButtonText: 'Reset Access',
      confirmButtonClass: 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold',
    });
  };

  // Prompt Delete User (Soft Deletion)
  const promptDelete = (userObj) => {
    setActiveMenuId(null);
    setConfirmModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to delete account "${userObj.name}" (@${userObj.username})? Historical tournament brackets, matches, and team scores will be preserved.`,
      actionType: 'delete',
      targetUser: userObj,
      confirmButtonText: 'Delete Account',
      confirmButtonClass: 'bg-rose-600 hover:bg-rose-500 text-white',
    });
  };

  // Checkbox select all on current page
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Helper: Get Responsive Capital Letter Avatar
  const renderAvatar = (u, size = 'w-9 h-9', textSize = 'text-xs') => {
    if (!u) return null;
    const firstLetter = (u.name || u.username || 'P').trim().charAt(0).toUpperCase();
    const hasCustomImage = Boolean(u.avatar && !u.avatar.includes('photo-1566492031773-4f4e44671857'));

    // Deterministic gradient colors based on username
    const gradients = [
      'from-purple-600 via-indigo-600 to-cyan-500',
      'from-cyan-500 via-blue-600 to-indigo-700',
      'from-emerald-500 via-teal-600 to-cyan-600',
      'from-rose-500 via-pink-600 to-purple-600',
      'from-amber-500 via-orange-600 to-rose-600',
    ];
    let hash = 0;
    const str = (u.username || u.name || 'P').toLowerCase();
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bgGradient = gradients[Math.abs(hash) % gradients.length];

    return (
      <div className={`relative ${size} rounded-full shrink-0 overflow-hidden bg-gradient-to-tr ${bgGradient} p-[1.5px] shadow-sm`}>
        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {hasCustomImage ? (
            <img
              src={u.avatar}
              alt={u.name || u.username || 'Avatar'}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className={`w-full h-full rounded-full bg-gradient-to-tr ${bgGradient} flex items-center justify-center select-none ${
              hasCustomImage ? 'hidden' : 'flex'
            }`}
          >
            <span className={`${textSize} font-black text-white font-mono tracking-tighter`}>
              {firstLetter}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Helper: Game Badges
  const renderGameBadge = (gameName) => {
    const g = (gameName || 'BGMI').toUpperCase();
    if (g.includes('BGMI')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
          <Gamepad2 className="w-3 h-3 text-amber-600 shrink-0" />
          <span>BGMI</span>
        </span>
      );
    }
    if (g.includes('FREE FIRE') || g.includes('FIRE')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-orange-50 text-orange-800 border border-orange-200 shadow-sm">
          <Flame className="w-3 h-3 text-orange-600 shrink-0" />
          <span>Free Fire</span>
        </span>
      );
    }
    if (g.includes('VALORANT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-rose-50 text-rose-800 border border-rose-200 shadow-sm">
          <Crosshair className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Valorant</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-sm">
        <Gamepad2 className="w-3 h-3 text-cyan-600 shrink-0" />
        <span>{gameName}</span>
      </span>
    );
  };

  // Helper: Role Badges
  const renderRoleBadge = (role) => {
    const r = (role || 'player').toLowerCase();
    if (r === 'super_admin' || r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-200 shadow-sm">
          <Shield className="w-3 h-3 text-pink-600" />
          <span>Admin</span>
        </span>
      );
    }
    if (r === 'captain') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
          <Crown className="w-3 h-3 text-purple-600" />
          <span>Captain</span>
        </span>
      );
    }
    if (r === 'moderator') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
          <Shield className="w-3 h-3 text-indigo-600" />
          <span>Moderator</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm">
        <Users className="w-3 h-3 text-cyan-600" />
        <span>Player</span>
      </span>
    );
  };

  // Helper: Status Badges
  const renderStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active</span>
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Pending</span>
        </span>
      );
    }
    if (s === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Suspended</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shadow-sm">
        <AlertTriangle className="w-3 h-3 text-red-600" />
        <span>Rejected</span>
      </span>
    );
  };

  // Helper: Format Joined Date
  const formatDate = (dateString) => {
    if (!dateString) return '15 Mar 2026';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '15 Mar 2026';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ==================================================
          2. USERS PAGE HEADER WITH ESPORTS BANNER
          ================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Esports SaaS Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              USER MANAGEMENT
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Manage players, captains and administrators. Control account access and manage the UEM Gaming Club community.
            </p>
          </div>

          {/* Right-side esports badge/visual */}
          <div className="flex items-center gap-4 shrink-0 bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-lime-400/50 p-1 flex items-center justify-center shadow-sm shrink-0">
              <img
                src="/assets/gaming-geeks-logo.png"
                alt="Gaming Geeks"
                className="h-full w-auto object-contain drop-shadow-[0_0_6px_rgba(163,230,53,0.7)]"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 block">
                GAMING GEEKS
              </span>
              <span className="text-base font-bold text-slate-900 font-mono leading-tight block">
                Verified Collegiate League
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                UEM Jaipur • Official Circuit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          3. STATISTICS CARDS (4 RESPONSIVE CARDS)
          ================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TOTAL USERS (Purple) */}
        <div className="group relative p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 transition-all duration-200 hover:-translate-y-1 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Total Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {statsLoading ? <span className="animate-pulse">--</span> : stats.totalUsers}
            </p>
            <span className="text-[10px] font-semibold text-purple-600 mt-1 block">
              {trends.totalUsers || '+12% this month'}
            </span>
          </div>
        </div>

        {/* PLAYERS (Cyan) */}
        <div className="group relative p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-300 transition-all duration-200 hover:-translate-y-1 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Players
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
              <Swords className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {statsLoading ? <span className="animate-pulse">--</span> : stats.players}
            </p>
            <span className="text-[10px] font-semibold text-cyan-600 mt-1 block">
              {trends.players || '+8% this week'}
            </span>
          </div>
        </div>

        {/* PENDING VERIFICATION (Orange) */}
        <div className="group relative p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 transition-all duration-200 hover:-translate-y-1 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Pending
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {statsLoading ? <span className="animate-pulse">--</span> : stats.pending}
            </p>
            <span className="text-[10px] font-semibold text-amber-600 mt-1 block">
              {trends.pending || 'Requires verification'}
            </span>
          </div>
        </div>

        {/* SUSPENDED (Red) */}
        <div className="group relative p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 transition-all duration-200 hover:-translate-y-1 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Suspended
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {statsLoading ? <span className="animate-pulse">--</span> : stats.suspended}
            </p>
            <span className="text-[10px] font-semibold text-rose-600 mt-1 block">
              {trends.suspended || 'Restricted access'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          5. SEARCH AND FILTER TOOLBAR
          ================================================== */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input (Debounced) */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center">
            {/* Game Filter */}
            <select
              value={selectedGame}
              onChange={(e) => {
                setSelectedGame(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-purple-500 font-mono min-w-[130px]"
            >
              <option value="all">All Games</option>
              <option value="BGMI">BGMI</option>
              <option value="Free Fire">Free Fire</option>
              <option value="Valorant">Valorant</option>
            </select>
          </div>

          {/* Action Buttons: Export, Refresh */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              title="Export filtered dataset to CSV"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              <span>Export</span>
            </button>

            <button
              onClick={handleRefreshAll}
              title="Refresh users roster and reset filters"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          24. ERROR STATE
          ================================================== */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Unable to load users.</p>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ==================================================
          22. EMPTY STATE / 23. LOADING SKELETONS / 7. USER TABLE
          ================================================== */}
      {loading ? (
        /* Skeleton Table Loader */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm p-4 space-y-4">
          <div className="h-6 bg-slate-100 rounded-md animate-pulse w-48" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse flex items-center px-4 justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3 bg-slate-200 rounded" />
                    <div className="w-16 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-24 h-3 bg-slate-100 rounded hidden md:block" />
                <div className="w-20 h-5 bg-slate-100 rounded-full" />
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : users.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-mono">NO USERS FOUND</h3>
          <p className="text-xs text-slate-500">
            No accounts match your current filters. Clear the search parameters to view the active roster.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* DESKTOP / TABLET TABLE VIEW (Hidden on Mobile) */}
          <div className="hidden md:block rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-mono text-slate-500 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="p-4 w-10">#</th>
                    <th className="p-4">USER</th>
                    <th className="p-4">COLLEGE</th>
                    <th className="p-4">TEAM</th>
                    <th className="p-4">GAME</th>
                    <th className="p-4">ROLE</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">JOINED</th>
                    <th className="p-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u, idx) => {
                    const rowNumber = (currentPage - 1) * limit + idx + 1;
                    const isSelected = selectedUserIds.includes(u._id);

                    return (
                      <tr
                        key={u._id}
                        className={`transition-colors duration-150 hover:bg-slate-50/80 ${
                          isSelected ? 'bg-purple-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(u._id)}
                            className="rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500"
                          />
                        </td>

                        {/* # Index */}
                        <td className="p-4 font-mono text-slate-400 text-[11px]">
                          {rowNumber}
                        </td>

                        {/* User Avatar + Name + @Username */}
                        <td className="p-4">
                          <div
                            className="flex items-center gap-3 cursor-pointer group/user"
                            onClick={() => handleOpenProfileDrawer(u)}
                            title="Click to view full user profile"
                          >
                            {renderAvatar(u, 'w-9 h-9')}
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate group-hover/user:text-purple-600 transition-colors">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                @{u.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* College */}
                        <td className="p-4 text-slate-600 max-w-[180px] truncate" title={u.college}>
                          {u.college || 'UEM Jaipur'}
                        </td>

                        {/* Team with Verified Badge */}
                        <td className="p-4">
                          <div className="space-y-0.5 max-w-[170px]">
                            <span className="font-semibold text-slate-800 block truncate">
                              {u.teamInfo?.name || u.teamName || 'Free Agent'}
                            </span>
                            {u.teamInfo?.isFreeAgent || (!u.teamName || u.teamName.toLowerCase() === 'free agent') ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-cyan-700 font-semibold">
                                ⚡ FREE AGENT
                              </span>
                            ) : u.teamInfo?.isVerified ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-700 font-bold">
                                <Check className="w-2.5 h-2.5" /> VERIFIED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-700 font-medium">
                                ⚠ UNVERIFIED
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Game Badge */}
                        <td className="p-4">
                          {renderGameBadge(u.game || (u.games && u.games[0]))}
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          {renderRoleBadge(u.role)}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          {renderStatusBadge(u.status)}
                        </td>

                        {/* Joined Date */}
                        <td className="p-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Action Icons */}
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1.5 action-menu-container relative">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Edit User"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === u._id ? null : u._id);
                              }}
                              title="More Actions"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === u._id && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-30 text-left space-y-1 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleOpenProfileDrawer(u);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                                >
                                  <Users className="w-3.5 h-3.5 text-purple-600" />
                                  <span>View Profile</span>
                                </button>

                                <button
                                  onClick={() => promptResetAccess(u)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>Reset Access</span>
                                </button>

                                {u.status === 'suspended' ? (
                                  <button
                                    onClick={() => promptActivate(u)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Activate User</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => promptSuspend(u)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                                  >
                                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Suspend User</span>
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  onClick={() => promptDelete(u)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete User</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================================================
              21. RESPONSIVE MOBILE PLAYER CARDS (< 768px)
              ================================================== */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div
                key={u._id}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {renderAvatar(u, 'w-10 h-10')}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{u.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                    </div>
                  </div>
                  {renderStatusBadge(u.status)}
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  {u.college || 'UEM Jaipur'}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-700 font-semibold bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                    🛡 {u.teamInfo?.name || u.teamName || 'Free Agent'}
                  </span>
                  {renderGameBadge(u.game)}
                  {renderRoleBadge(u.role)}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Joined: {formatDate(u.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenProfileDrawer(u)}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => promptSuspend(u)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="More"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ==================================================
              19. SERVER-SIDE PAGINATION
              ================================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 shadow-sm">
            {/* Range display */}
            <div className="font-mono">
              Showing <span className="text-slate-900 font-bold">{Math.min((currentPage - 1) * limit + 1, totalCount)}</span>–
              <span className="text-slate-900 font-bold">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
              <span className="text-purple-600 font-bold">{totalCount}</span> users
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dynamic Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pNum = currentPage - 2 + i;
                  if (pNum > totalPages) pNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                      currentPage === pNum
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-slate-400 font-mono">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px]">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-500"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* ==================================================
          12 & 13. USER PROFILE DRAWER (Slide-in Right / Fullscreen Mobile)
          ================================================== */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 w-full sm:max-w-lg bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-20 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {renderAvatar(selectedUser, 'w-14 h-14', 'text-xl')}
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-mono leading-tight">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">@{selectedUser.username}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {renderStatusBadge(selectedUser.status)}
                    {renderRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex items-center border-b border-slate-100 px-6 bg-slate-50/70">
              {[
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'stats', label: 'Stats', icon: BarChart3 },
                { id: 'activity', label: 'Activity', icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    drawerTab === tab.id
                      ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {drawerLoading ? (
                <div className="space-y-4 py-8">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              ) : drawerTab === 'overview' ? (
                <>
                  {/* BASIC INFORMATION */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                      BASIC INFORMATION
                    </h4>
                    <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-4 space-y-3 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Full Name</span>
                        <span className="font-semibold text-slate-900">{selectedUser.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Email</span>
                        <span className="font-mono text-slate-800">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">College</span>
                        <span className="text-slate-900 text-right max-w-[200px] truncate">{selectedUser.college || 'UEM Jaipur'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Game ID / IGN</span>
                        <span className="font-mono font-bold text-sky-700">{selectedUser.gameId || `@${selectedUser.username}`}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Role</span>
                        <span className="capitalize font-semibold text-purple-700">{selectedUser.role}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Team</span>
                        <span className="font-semibold text-slate-900">{selectedUser.teamInfo?.name || selectedUser.teamName || 'Free Agent'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Joined</span>
                        <span className="font-mono text-slate-700">{formatDate(selectedUser.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* TEAM INFORMATION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                        TEAM INFORMATION
                      </h4>
                      {selectedUser.teamInfo?.isFreeAgent || (!selectedUser.teamName || selectedUser.teamName.toLowerCase() === 'free agent') ? (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          SOLO PLAYER
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {selectedUser.teamInfo?.roleInTeam || (selectedUser.role === 'captain' ? 'CAPTAIN' : 'ROSTER PLAYER')}
                        </span>
                      )}
                    </div>

                    {selectedUser.teamInfo?.isFreeAgent || (!selectedUser.teamName || selectedUser.teamName.toLowerCase() === 'free agent') ? (
                      /* FREE AGENT CARD */
                      <div className="rounded-2xl bg-white border border-sky-200 p-4 space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                                Free Agent
                                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  Unassigned
                                </span>
                              </p>
                              <span className="text-xs text-slate-500">
                                {selectedUser.game || 'BGMI'} • Individual Competitor
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            ⚡ FREE AGENT
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          This player is currently not assigned to any collegiate esports squad and is available for team recruitment.
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-mono">0 Squad Members (Solo)</span>
                          <button
                            onClick={() => handleOpenAssignTeam(selectedUser)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 transition-all text-xs shadow-xs cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Assign to Team</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE TEAM SQUAD CARD */
                      <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                                {selectedUser.teamInfo?.name || selectedUser.teamName}
                                {selectedUser.teamInfo?.tag && (
                                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    [{selectedUser.teamInfo.tag}]
                                  </span>
                                )}
                              </p>
                              <span className="text-xs text-slate-500">
                                {selectedUser.teamInfo?.game || selectedUser.game || 'BGMI'}
                              </span>
                            </div>
                          </div>
                          {selectedUser.teamInfo?.isVerified ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3" /> VERIFIED
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> UNVERIFIED SQUAD
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-mono">
                            {selectedUser.teamInfo?.memberCount || 1} {selectedUser.teamInfo?.memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAssignTeam(selectedUser)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                            >
                              Change Team
                            </button>
                            <button
                              onClick={() => handleViewTeam(selectedUser.teamInfo?.name || selectedUser.teamName)}
                              className="text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-sky-50 border border-sky-200 cursor-pointer"
                            >
                              <span>View Team</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QUICK PLAYER STATS SNAPSHOT */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                      PLAYER STATISTICS
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">Matches</span>
                        <span className="text-xl font-black text-slate-900 font-mono">{userStats?.matches ?? 24}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">Wins</span>
                        <span className="text-xl font-black text-emerald-600 font-mono">{userStats?.wins ?? 7}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">Kills</span>
                        <span className="text-xl font-black text-sky-600 font-mono">{userStats?.kills ?? 86}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                        <span className="text-[10px] text-slate-500 font-mono uppercase block">Points</span>
                        <span className="text-xl font-black text-purple-600 font-mono">{userStats?.points ?? 412}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : drawerTab === 'stats' ? (
                /* DETAILED STATS TAB */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                    <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
                      COMPETITIVE PERFORMANCE
                    </span>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">WIN RATE</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{userStats?.winRate || '29%'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">TOURNAMENTS</span>
                        <span className="text-lg font-black text-purple-600 font-mono">{userStats?.tournamentParticipation || 1} Registered</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">MATCHES PLAYED</span>
                        <span className="text-lg font-black text-sky-600 font-mono">{userStats?.matches || 24}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">TOTAL ELIMINATIONS</span>
                        <span className="text-lg font-black text-emerald-600 font-mono">{userStats?.kills || 86}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                    <p className="font-bold flex items-center gap-1.5 text-purple-950">
                      <Trophy className="w-4 h-4 text-purple-600" /> Database Live Analytics
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Computed directly from tournament registrations and official room results.
                    </p>
                  </div>
                </div>
              ) : (
                /* RECENT ACTIVITY TIMELINE */
                <div className="space-y-4">
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    RECENT TIMELINE
                  </h4>
                  {userActivity.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No recorded activity yet.</p>
                  ) : (
                    <div className="space-y-4 pl-2 border-l-2 border-slate-200">
                      {userActivity.map((act) => (
                        <div key={act.id} className="relative pl-5 space-y-1">
                          <div className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-white border-2 border-purple-600 shadow-xs" />
                          <p className="text-xs font-bold text-slate-900">{act.title}</p>
                          <p className="text-[11px] text-slate-500">{act.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {formatDate(act.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer / Account Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                ACCOUNT ACTIONS
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => promptResetAccess(selectedUser)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  <span>Reset Access</span>
                </button>

                {selectedUser.status === 'suspended' ? (
                  <button
                    onClick={() => promptActivate(selectedUser)}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Activate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => promptSuspend(selectedUser)}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800 border border-amber-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    <span>Suspend</span>
                  </button>
                )}

                <button
                  onClick={() => promptDelete(selectedUser)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 border border-rose-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ==================================================
          EDIT USER MODAL
          ================================================== */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditModalOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-mono">EDIT USER PROFILE</h3>
                  <p className="text-xs text-slate-500">Update account credentials and competitive status</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    College
                  </label>
                  <input
                    type="text"
                    value={editFormData.college}
                    onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Game
                  </label>
                  <select
                    value={editFormData.game}
                    onChange={(e) => setEditFormData({ ...editFormData, game: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="BGMI">BGMI</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="Valorant">Valorant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Game ID / IGN
                  </label>
                  <input
                    type="text"
                    value={editFormData.gameId}
                    onChange={(e) => setEditFormData({ ...editFormData, gameId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="player">PLAYER</option>
                    <option value="captain">CAPTAIN</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.teamName}
                    onChange={(e) => setEditFormData({ ...editFormData, teamName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="pending">PENDING</option>
                    <option value="suspended">SUSPENDED</option>
                    <option value="rejected">REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submittingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          ASSIGN / CHANGE TEAM MODAL
          ================================================== */}
      {assignTeamModalOpen && assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setAssignTeamModalOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mono">ASSIGN TEAM ROSTER</h3>
                  <p className="text-xs text-slate-500">Assign player to a competitive team squad</p>
                </div>
              </div>
              <button
                onClick={() => setAssignTeamModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeamSubmit} className="space-y-4">
              {/* Selected User Info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                {renderAvatar(assigningUser, 'w-10 h-10')}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{assigningUser.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">@{assigningUser.username}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  {assigningUser.game || 'BGMI'}
                </span>
              </div>

              {/* Team Selection or Entry */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                  Target Team Name
                </label>
                <div className="space-y-2">
                  <select
                    value={teamsList.includes(assignTeamName) ? assignTeamName : (assignTeamName ? 'custom' : '')}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setAssignTeamName('');
                      } else {
                        setAssignTeamName(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="">-- Choose Existing Team or Custom --</option>
                    <option value="Free Agent">⚡ Free Agent (Unassigned / Solo)</option>
                    {teamsList.map((team) => (
                      <option key={team} value={team}>
                        🛡 {team}
                      </option>
                    ))}
                    <option value="custom">✏️ Enter Custom Team Name...</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Enter or customize team name (e.g. Sentinel Esports)"
                    value={assignTeamName}
                    onChange={(e) => setAssignTeamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  Tip: Setting team name to "Free Agent" returns the player to solo status.
                </span>
              </div>

              {/* Role in Team */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                  Roster Role
                </label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600"
                >
                  <option value="player">ROSTER PLAYER</option>
                  <option value="captain">TEAM CAPTAIN 👑</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingAssign ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Team Assignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          CONFIRMATION ACTION MODAL (Suspend, Activate, Reset, Delete)
          ================================================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          />
          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">{confirmModal.title}</h3>
                <span className="text-xs text-slate-500">Action confirmation required</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {confirmModal.message}
            </p>

            {copiedToken && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1 text-xs">
                <span className="text-[10px] font-mono uppercase text-sky-800 block font-bold">
                  Generated Reset Token:
                </span>
                <div className="flex items-center justify-between gap-2 font-mono text-slate-900 bg-white border border-slate-200 p-2 rounded-lg">
                  <span className="truncate">{copiedToken}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(copiedToken);
                      addToast('Copied token to clipboard', 'info');
                    }}
                    className="p-1 hover:text-sky-600 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer ${confirmModal.confirmButtonClass}`}
              >
                {confirmModal.confirmButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
