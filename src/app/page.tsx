'use client';

import { useSession } from 'next-auth/react';

import { BookmarkDashboard } from '@/components/BookmarkDashboard';

export default function HomePage() {
  const { data: session } = useSession();

  const isAdminUser = !!(session?.user && 'role' in session.user && session.user.role === 'admin');

  return <BookmarkDashboard variant="public" isAdminUser={isAdminUser} />;
}