import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api-client';
import { useToast } from '../../context/ToastContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();

  const [inputToken, setInputToken] = useState(token);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiRequest('/api/v1/auth/reset-password', {
        method: 'POST',
        body: {
          token: inputToken,
          new_password: newPassword,
        },
      });
      setSuccess(true);
      toast.success('Password updated successfully.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const msg = err.message || 'Reset failed. The link may have expired.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="bg-[#10131A] p-8 sm:p-10 rounded-2xl border border-[#242A35] space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-[#F5F3EE] tracking-tight">
            Set new password
          </h1>
          <p className="text-xs text-[#A5ABB5]">
            Enter your new account password below.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-xl bg-[#151922] border border-[#242A35] text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#4FB7A5] mx-auto" />
            <h2 className="text-sm font-semibold text-[#F5F3EE]">Password updated</h2>
            <p className="text-xs text-[#A5ABB5]">
              Your password has been changed. Redirecting to sign in…
            </p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 rounded-lg bg-[#4FB7A5] text-[#080A0F] text-xs font-semibold"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!token && (
              <div>
                <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
                  Reset token
                </label>
                <input
                  type="text"
                  required
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Paste your reset token"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
                New password (min 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
