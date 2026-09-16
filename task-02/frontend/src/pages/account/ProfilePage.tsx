import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Trash2, CheckCircle2, AlertCircle, Shield, User as UserIcon, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { apiRequest } from '../../lib/api-client';
import { useToast } from '../../context/ToastContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfileName, uploadAvatar, removeAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
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
      setFeedback({ type: 'success', text: 'Name updated successfully.' });
      toast.success('Name updated.');
    } catch (err: any) {
      const msg = err.message || 'Failed to update name.';
      setFeedback({ type: 'error', text: msg });
      toast.error(msg);
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
      setFeedback({ type: 'success', text: 'Profile photo updated.' });
      toast.success('Photo updated.');
    } catch (err: any) {
      const msg = err.message || 'Failed to upload photo.';
      setFeedback({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setFeedback(null);
      await removeAvatar();
      setFeedback({ type: 'success', text: 'Photo removed.' });
      toast.info('Photo removed.');
    } catch (err: any) {
      const msg = err.message || 'Failed to remove photo.';
      setFeedback({ type: 'error', text: msg });
      toast.error(msg);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await apiRequest('/api/v1/profile/account', { method: 'DELETE' });
      await logout();
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Failed to delete account.';
      setFeedback({ type: 'error', text: msg });
      toast.error(msg);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
          My Account
        </h1>
        <p className="text-xs text-[#A5ABB5] mt-1">
          Manage your personal details and account settings.
        </p>

        {/* Account Nav Tabs */}
        <div className="flex items-center gap-4 mt-6 border-b border-[#242A35] pb-3 text-xs font-medium">
          <Link to="/profile" className="text-[#4FB7A5] border-b-2 border-[#4FB7A5] pb-3 -mb-3 font-semibold">
            Personal details
          </Link>
          <Link to="/orders" className="text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors">
            Orders
          </Link>
          <Link to="/security" className="text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors">
            Security
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs mb-6 flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5]'
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
        {/* Profile Photo Card */}
        <div className="bg-[#10131A] p-6 rounded-xl border border-[#242A35] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar url={user.avatar_url} name={user.full_name} size="lg" className="border border-[#242A35]" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#151922] border border-[#242A35] text-[#F5F3EE] hover:text-[#4FB7A5] rounded-full transition-colors cursor-pointer"
                title="Change photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F5F3EE]">{user.full_name || 'Customer'}</p>
              <p className="text-xs text-[#A5ABB5]">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] hover:bg-[#1C222C] text-xs font-medium transition-colors cursor-pointer"
            >
              {uploadingAvatar ? 'Uploading…' : 'Change photo'}
            </button>
            {user.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="px-3 py-1.5 rounded-lg bg-[#151922] border border-[#242A35] text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Personal Details Form */}
        <div className="bg-[#10131A] p-6 rounded-xl border border-[#242A35]">
          <h2 className="text-sm font-semibold text-[#F5F3EE] mb-4">Personal details</h2>
          <form onSubmit={handleNameSave} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
                Email address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full max-w-md px-3.5 py-2.5 rounded-lg bg-[#080A0F]/50 border border-[#242A35] text-xs text-[#6F7682] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#6F7682] mt-1">
                You can change your email in <Link to="/security" className="text-[#4FB7A5] hover:underline">Security settings</Link>.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingName}
              className="px-4 py-2 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingName ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-[#10131A] p-6 rounded-xl border border-rose-500/20 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-rose-400">Delete account</h3>
            <p className="text-xs text-[#A5ABB5] mt-0.5">
              Permanently delete your account and personal details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10131A] border border-[#242A35] p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-[#F5F3EE]">Delete your account?</h3>
            <p className="text-xs text-[#A5ABB5] leading-relaxed">
              This action cannot be undone. Your active orders and history will no longer be linked to this account.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 rounded-lg bg-[#151922] border border-[#242A35] text-xs text-[#F5F3EE] hover:bg-[#1C222C] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
