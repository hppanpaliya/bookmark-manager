'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavigationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

export function NavigationLink({
  href,
  children,
  className = '',
  activeClassName = '',
  onClick
}: NavigationLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={onClick}>
      <motion.div
        className={cn(
          'relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? cn(
                'bg-[color-mix(in srgb, var(--primary) 16%, transparent)] text-[var(--primary-foreground)] shadow-[var(--shadow-card)]/45',
                activeClassName
              )
            : 'text-[color-mix(in srgb, var(--muted-foreground) 85%, transparent 15%)] hover:bg-[color-mix(in srgb, var(--accent) 75%, transparent 25%)] hover:text-[var(--foreground)]',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 -z-10 rounded-2xl border border-[color-mix(in srgb, var(--primary) 28%, transparent)] bg-[color-mix(in srgb, var(--primary) 20%, transparent)] shadow-[var(--shadow-card)]/40"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}