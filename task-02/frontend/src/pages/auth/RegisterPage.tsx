import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register(email, fullName, password);
      toast.success('Account created.');
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="bg-[#10131A] p-8 sm:p-10 rounded-2xl border border-[#242A35] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#151922] border border-[#242A35] flex items-center justify-center mx-auto text-[#4FB7A5]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F3EE] tracking-tight">
            Create your account
          </h1>
          <p className="text-xs text-[#A5ABB5]">
            Save your details and keep track of your orders.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
              Full name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A5ABB5] block mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete="new-password"
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
            className="w-full py-2.5 px-4 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#242A35]">
          <p className="text-xs text-[#A5ABB5]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4FB7A5] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
