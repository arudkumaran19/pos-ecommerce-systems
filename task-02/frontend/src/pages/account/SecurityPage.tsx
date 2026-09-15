import React, { useState } from 'react';
import { Key, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';

export const SecurityPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

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
      setPwdFeedback({ type: 'error', text: 'New passwords do not match.' });
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
      setPwdFeedback({ type: 'success', text: 'Password updated. Other active sessions revoked.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdFeedback({ type: 'error', text: err.message || 'Failed to update password.' });
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
      setEmailFeedback({ type: 'success', text: 'Email address updated successfully.' });
      setNewEmail('');
      setEmailPassword('');
      await refreshProfile();
    } catch (err: any) {
      setEmailFeedback({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Security & Credentials
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage password authentication and email credentials.
        </p>
      </div>

      <div className="space-y-8">
        {/* Password Form */}
        <form onSubmit={handlePasswordSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            Change Password
          </h2>

          {pwdFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                pwdFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Change Email Form */}
        <form onSubmit={handleEmailSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            Change Email Address
          </h2>

          {emailFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                emailFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">New Email Address</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new.email@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm with Current Password</label>
            <input
              type="password"
              required
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={changingEmail}
            className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
          >
            {changingEmail ? 'Updating Email...' : 'Update Email Address'}
          </button>
        </form>
      </div>
    </div>
  );
};
