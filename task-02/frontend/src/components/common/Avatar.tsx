import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ url, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const getInitials = (n?: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const fullUrl = url?.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${url}` : url;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border border-slate-700/80 bg-slate-800 text-slate-200 font-semibold shadow-inner ${sizeClasses[size]} ${className}`}
    >
      {fullUrl ? (
        <img src={fullUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-slate-400" />
      )}
    </div>
  );
};
