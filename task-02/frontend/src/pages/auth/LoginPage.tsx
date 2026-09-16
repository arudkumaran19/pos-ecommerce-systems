import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      toast.success('Signed in successfully.');
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      navigate(redirect || '/');
    } catch (err: any) {
      const msg = err.message || 'Incorrect email or password. Please try again.';
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
            Welcome back
          </h1>
          <p className="text-xs text-[#A5ABB5]">
            Sign in to continue shopping.
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
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#A5ABB5]">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-[#4FB7A5] hover:underline">
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6F7682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F7682] hover:text-[#A5ABB5] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#242A35]">
          <p className="text-xs text-[#A5ABB5]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#4FB7A5] hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
