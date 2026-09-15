import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClasses = 'animate-pulse bg-slate-800/60 border border-slate-700/30';
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  }[variant];

  return <div className={`${baseClasses} ${variantClasses} ${className}`} />;
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between space-y-4">
      <div className="w-full h-48 rounded-xl bg-slate-800/50 animate-pulse border border-slate-700/20" />
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16" variant="text" />
          <Skeleton className="h-3 w-20" variant="text" />
        </div>
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-3 w-full" variant="text" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20" variant="text" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};
