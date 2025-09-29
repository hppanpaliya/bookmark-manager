'use client';

import { useSession } from 'next-auth/react';

import { BookmarkDashboard } from '@/components/BookmarkDashboard';
import { PageTransition } from '@/components/PageTransition';

export default function HomePage() {
  const { data: session } = useSession();

  const isAdminUser = !!(session?.user && 'role' in session.user && session.user.role === 'admin');

  return (
    <PageTransition>
      <BookmarkDashboard variant="public" isAdminUser={isAdminUser} />
    </PageTransition>
  );
}