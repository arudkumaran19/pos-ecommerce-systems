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
      setSuccessMsg(`Customer status updated to ${!selectedUser.is_active ? 'Active' : 'Suspended'}`);
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update customer status');
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
      setActionError(err.message || 'Failed to reset password');
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight">Customers</h1>
          <p className="text-[#A5ABB5] text-xs mt-0.5">
            Manage customer accounts, roles, and access status.
          </p>
        </div>
        <div className="text-xs text-[#A5ABB5] bg-[#10131A] px-3 py-1.5 rounded-lg border border-[#242A35]">
          Total customers: <span className="font-semibold text-[#F5F3EE]">{total}</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#10131A] p-3.5 rounded-xl border border-[#242A35] flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#6F7682] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#151922] border border-[#242A35] text-[#A5ABB5] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4FB7A5]"
          >
            <option value="">All roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#151922] border border-[#242A35] text-[#A5ABB5] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4FB7A5]"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#10131A] rounded-xl border border-[#242A35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242A35] text-[11px] font-semibold text-[#A5ABB5] uppercase tracking-wider bg-[#151922]/50">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242A35] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A5ABB5]">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#4FB7A5] border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A5ABB5]">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#151922]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar url={u.avatar_url} name={u.full_name} size="sm" />
                          <div>
                            <span className="font-semibold text-[#F5F3EE] block">
                              {u.full_name || 'Customer'} {isSelf && <span className="text-[10px] text-[#4FB7A5] font-normal ml-1">(You)</span>}
                            </span>
                            <span className="text-[#A5ABB5] text-[11px] block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          u.role === 'ADMIN'
                            ? 'bg-[#151922] text-[#4FB7A5] border border-[#4FB7A5]/30'
                            : 'bg-[#151922] text-[#A5ABB5] border border-[#242A35]'
                        }`}>
                          {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                          {u.role === 'ADMIN' ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          u.is_active
                            ? 'bg-[#151922] text-[#4FB7A5] border border-[#4FB7A5]/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#A5ABB5]">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Status button */}
                          <button
                            disabled={isSelf}
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('status');
                            }}
                            title={isSelf ? 'Cannot deactivate self' : u.is_active ? 'Suspend account' : 'Activate account'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-[#242A35] text-[#6F7682]'
                                : u.is_active
                                ? 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                                : 'border-[#4FB7A5]/30 text-[#4FB7A5] hover:bg-[#4FB7A5]/10'
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
                            title={isSelf ? 'Cannot change own role' : 'Change role'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-[#242A35] text-[#6F7682]'
                                : 'border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922]'
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
                            title={isSelf ? 'Use Security settings to change your own password' : 'Reset password'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-[#242A35] text-[#6F7682]'
                                : 'border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922]'
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
          <div className="p-3.5 border-t border-[#242A35] flex items-center justify-between text-xs text-[#A5ABB5]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10131A] border border-[#242A35] max-w-md w-full p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <h3 className="font-bold text-[#F5F3EE] text-base">
                {modalType === 'status' && (selectedUser.is_active ? 'Suspend Account' : 'Activate Account')}
                {modalType === 'role' && 'Change Account Role'}
                {modalType === 'password' && 'Reset Password'}
              </h3>
              <button onClick={closeModal} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="text-xs text-[#A5ABB5]">
              Target: <span className="font-semibold text-[#F5F3EE]">{selectedUser.full_name} ({selectedUser.email})</span>
            </div>

            {/* Modal-specific forms */}
            {modalType === 'status' && (
              <div className="space-y-3">
                <p className="text-xs text-[#A5ABB5]">
                  {selectedUser.is_active
                    ? 'Suspending this customer will prevent them from signing in and placing orders.'
                    : 'Activating this customer will restore their store access.'}
                </p>
                <div>
                  <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Reason</label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Account review"
                    className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE]">
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusToggle}
                    disabled={actionLoading}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedUser.is_active
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F]'
                    }`}
                  >
                    {actionLoading ? 'Updating…' : selectedUser.is_active ? 'Suspend account' : 'Activate account'}
                  </button>
                </div>
              </div>
            )}

            {modalType === 'role' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Select role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5]"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Reason</label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Role update"
                    className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE]">
                    Cancel
                  </button>
                  <button
                    onClick={handleRoleChange}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold"
                  >
                    {actionLoading ? 'Updating…' : 'Save role'}
                  </button>
                </div>
              </div>
            )}

            {modalType === 'password' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#A5ABB5] block mb-1">New password (min 8 characters)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE]">
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    disabled={actionLoading || newPassword.length < 8}
                    className="px-3.5 py-1.5 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Resetting…' : 'Reset password'}
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
