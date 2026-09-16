import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api-client';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await apiRequest('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setSubmitted(true);
      toast.success('Password reset link sent.');
    } catch (err: any) {
      const msg = err.message || 'Failed to submit request.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="bg-[#10131A] p-8 sm:p-10 rounded-2xl border border-[#242A35] space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#F5F3EE] tracking-tight">
            Reset password
          </h1>
          <p className="text-xs text-[#A5ABB5]">
            Enter your email address and we'll send you a password reset link.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-5 rounded-xl bg-[#151922] border border-[#242A35] text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#4FB7A5] mx-auto" />
            <h2 className="text-sm font-semibold text-[#F5F3EE]">Check your email</h2>
            <p className="text-xs text-[#A5ABB5] leading-relaxed">
              If an account exists for <span className="text-[#F5F3EE] font-medium">{email}</span>, you will receive password reset instructions shortly.
            </p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 rounded-lg bg-[#151922] border border-[#242A35] text-xs font-medium text-[#F5F3EE] hover:bg-[#1C222C] transition-colors mt-2"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
