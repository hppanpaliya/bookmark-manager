'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle';
  lines?: number;
}

export function Skeleton({ className = '', variant = 'default', lines = 1 }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-[var(--muted)] via-[var(--muted)]/80 to-[var(--muted)] bg-[length:200%_100%]';

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-xl border border-[var(--card-border)] p-6 space-y-4', className)}
      >
        <div className={cn('h-4 rounded', baseClasses)} style={{ animationDelay: '0s' }} />
        <div className={cn('h-4 rounded w-3/4', baseClasses)} style={{ animationDelay: '0.1s' }} />
        <div className={cn('h-3 rounded w-1/2', baseClasses)} style={{ animationDelay: '0.2s' }} />
        <div className="flex gap-2 pt-2">
          <div className={cn('h-8 w-16 rounded-lg', baseClasses)} style={{ animationDelay: '0.3s' }} />
          <div className={cn('h-8 w-8 rounded-lg', baseClasses)} style={{ animationDelay: '0.4s' }} />
        </div>
      </motion.div>
    );
  }

  if (variant === 'circle') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('rounded-full', baseClasses, className)}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'h-4 rounded',
              baseClasses,
              i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('rounded', baseClasses, className)}
    />
  );
}

// Enhanced loading spinner
export function LoadingSpinner({ size = 'default', className = '' }: { size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <motion.div
        className={cn('relative', sizes[size])}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={cn('absolute inset-0 rounded-full border-4 border-[var(--muted)] border-t-[var(--primary)] animate-spin')} />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
        </motion.div>
      </motion.div>
    </div>
  );
}