import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Trash2, CheckCircle2, AlertCircle, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { apiRequest } from '../../lib/api-client';

export const ProfilePage: React.FC = () => {
  const { user, updateProfileName, uploadAvatar, removeAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return null;
  }

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingName(true);
      setFeedback(null);
      await updateProfileName(fullName);
      setFeedback({ type: 'success', text: 'Profile name updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update name.' });
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setFeedback(null);
      await uploadAvatar(file);
      setFeedback({ type: 'success', text: 'Avatar uploaded and updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to upload avatar.' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setFeedback(null);
      await removeAvatar();
      setFeedback({ type: 'success', text: 'Avatar removed.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to remove avatar.' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await apiRequest('/api/v1/profile/account', { method: 'DELETE' });
      await logout();
      navigate('/');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Account deletion failed.' });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Profile & Avatar Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, profile picture, and account data.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs mb-6 flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar url={user.avatar_url} name={user.full_name} size="xl" />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md cursor-pointer transition-all"
              title="Upload new picture"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h3 className="font-bold text-base text-white">Profile Photo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a custom profile picture (JPEG, PNG, or WebP, max 2MB).
            </p>
            <div className="flex items-center gap-3 pt-1 justify-center sm:justify-start">
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
              </button>
              {user.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Form */}
        <form onSubmit={handleNameSave} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white">Account Details</h3>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {user.role}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingName}
            className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
          >
            {savingName ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Account Deletion (Preserves Orders with Anonymization) */}
        {user.role === 'CUSTOMER' && (
          <div className="glass-panel p-6 rounded-2xl border border-rose-950/60 bg-rose-950/10 space-y-3">
            <h3 className="font-bold text-base text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once deleted, your profile details are removed. Past orders are kept for records without your personal information.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer"
            >
              Delete My Account
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure? Your personal details will be removed, you will be signed out, and this cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
