'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
  'flex min-h-[96px] w-full rounded-2xl border border-[color-mix(in srgb, var(--primary) 16%, var(--border))] bg-[color-mix(in srgb, var(--input) 94%, transparent 6%)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[color-mix(in srgb, var(--muted-foreground) 90%, transparent 10%)] shadow-sm shadow-[var(--shadow-card)]/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]/30 focus-visible:border-[var(--primary)] focus-visible:shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-[2px] custom-scrollbar',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };