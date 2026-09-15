import React, { useEffect, useState } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { User, PaginatedResponse, UserRole } from '../../types';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/formatters';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<'status' | 'role' | 'password' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CUSTOMER');
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('query', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter === 'active' ? 'true' : 'false');

      const data = await apiClient.get<PaginatedResponse<User>>(`/api/v1/admin/users?${params.toString()}`);
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient.patch(`/api/v1/admin/users/${selectedUser.id}/status`, {
        is_active: !selectedUser.is_active,
        reason: actionReason || (selectedUser.is_active ? 'Admin suspended user' : 'Admin activated user')
      });
      setSuccessMsg(`User status updated to ${!selectedUser.is_active ? 'Active' : 'Suspended'}`);
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient.patch(`/api/v1/admin/users/${selectedUser.id}/role`, {
        role: newRole,
        reason: actionReason || `Admin role change to ${newRole}`
      });
      setSuccessMsg(`User role updated to ${newRole}`);
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient.post(`/api/v1/admin/users/${selectedUser.id}/reset-password`, {
        new_password: newPassword
      });
      setSuccessMsg(`Password successfully reset for ${selectedUser.email}`);
      closeModal();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reset user password');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setActionReason('');
    setNewPassword('');
    setActionError(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Customer & User Directory</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user accounts, roles, security status, and credentials
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Total Users: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar url={u.avatar_url} name={u.full_name} size="sm" />
                          <div>
                            <span className="font-bold text-white block">
                              {u.full_name} {isSelf && <span className="text-[10px] text-indigo-400 font-normal ml-1">(You)</span>}
                            </span>
                            <span className="text-slate-400 text-[11px] block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Status button */}
                          <button
                            disabled={isSelf}
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('status');
                            }}
                            title={isSelf ? 'Cannot deactivate self' : u.is_active ? 'Suspend Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                                : u.is_active
                                ? 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                                : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Role button */}
                          <button
                            disabled={isSelf}
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN');
                              setModalType('role');
                            }}
                            title={isSelf ? 'Cannot change own role' : 'Change Role'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                                : 'border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* Password reset button */}
                          <button
                            disabled={isSelf}
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('password');
                            }}
                            title={isSelf ? 'Use Security settings to change your own password' : 'Admin Password Reset'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                                : 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                            }`}
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {modalType === 'status' && (selectedUser.is_active ? 'Suspend User' : 'Activate User')}
                {modalType === 'role' && 'Change User Role'}
                {modalType === 'password' && 'Administrative Password Reset'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="text-xs text-slate-400">
              Target User: <strong className="text-white">{selectedUser.full_name}</strong> ({selectedUser.email})
            </div>

            {/* Status Modal Body */}
            {modalType === 'status' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  {selectedUser.is_active
                    ? 'Are you sure you want to suspend this user? They will be immediately locked out of logging in.'
                    : 'Reactivating this user will restore their ability to authenticate and place orders.'}
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Reason for Audit Trail</label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Requested account hold / Fraud review"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">Cancel</button>
                  <button
                    onClick={handleStatusToggle}
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-semibold ${selectedUser.is_active ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                  >
                    {actionLoading ? 'Updating...' : selectedUser.is_active ? 'Suspend Account' : 'Activate Account'}
                  </button>
                </div>
              </div>
            )}

            {/* Role Modal Body */}
            {modalType === 'role' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Reason for Role Change</label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Promoted to operational admin"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">Cancel</button>
                  <button
                    onClick={handleRoleChange}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    {actionLoading ? 'Updating...' : 'Confirm Role Change'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Reset Modal Body */}
            {modalType === 'password' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Enter a temporary or new password for this user (minimum 8 characters).
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">Cancel</button>
                  <button
                    onClick={handlePasswordReset}
                    disabled={actionLoading || newPassword.length < 8}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
