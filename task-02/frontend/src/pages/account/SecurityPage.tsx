import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SecurityPage: React.FC = () => {
  const { refreshProfile } = useAuth();
  const toast = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      const msg = 'New passwords do not match.';
      setPwdFeedback({ type: 'error', text: msg });
      toast.error(msg);
      return;
    }

    try {
      setChangingPassword(true);
      setPwdFeedback(null);
      await apiRequest('/api/v1/profile/change-password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmPassword,
        },
      });
      const msg = 'Password updated successfully.';
      setPwdFeedback({ type: 'success', text: msg });
      toast.success(msg);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.message || 'Failed to update password.';
      setPwdFeedback({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setChangingEmail(true);
      setEmailFeedback(null);
      await apiRequest('/api/v1/profile/change-email', {
        method: 'POST',
        body: {
          new_email: newEmail,
          current_password: emailPassword,
        },
      });
      const msg = 'Email address updated successfully.';
      setEmailFeedback({ type: 'success', text: msg });
      toast.success(msg);
      setNewEmail('');
      setEmailPassword('');
      await refreshProfile();
    } catch (err: any) {
      const msg = err.message || 'Failed to update email.';
      setEmailFeedback({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
          Security
        </h1>
        <p className="text-xs text-[#A5ABB5] mt-1">
          Manage your password and sign-in email.
        </p>

        {/* Account Nav Tabs */}
        <div className="flex items-center gap-4 mt-6 border-b border-[#242A35] pb-3 text-xs font-medium">
          <Link to="/profile" className="text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors">
            Personal details
          </Link>
          <Link to="/orders" className="text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors">
            Orders
          </Link>
          <Link to="/security" className="text-[#4FB7A5] border-b-2 border-[#4FB7A5] pb-3 -mb-3 font-semibold">
            Security
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Password Form */}
        <form onSubmit={handlePasswordSubmit} className="bg-[#10131A] p-6 rounded-xl border border-[#242A35] space-y-4">
          <h2 className="text-sm font-semibold text-[#F5F3EE] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#4FB7A5]" />
            Change password
          </h2>

          {pwdFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${
                pwdFeedback.type === 'success'
                  ? 'bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5]'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {pwdFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{pwdFeedback.text}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="px-4 py-2 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          >
            {changingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>

        {/* Change Email Form */}
        <form onSubmit={handleEmailSubmit} className="bg-[#10131A] p-6 rounded-xl border border-[#242A35] space-y-4">
          <h2 className="text-sm font-semibold text-[#F5F3EE] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#4FB7A5]" />
            Change email address
          </h2>

          {emailFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${
                emailFeedback.type === 'success'
                  ? 'bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5]'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {emailFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{emailFeedback.text}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">New email address</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">Current password</label>
            <input
              type="password"
              required
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={changingEmail}
            className="px-4 py-2 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          >
            {changingEmail ? 'Updating…' : 'Update email'}
          </button>
        </form>
      </div>
    </div>
  );
};
