'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { BookmarkDashboard } from '@/components/BookmarkDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAdminUser = !!(session?.user && 'role' in session.user && session.user.role === 'admin');

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAdminUser) {
      router.push('/admin/login');
    }
  }, [isAdminUser, status, router]);

  if (status === 'loading' || (!session && status !== 'unauthenticated')) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <BookmarkDashboard
      variant="admin"
      isAdminUser={true}
      onLogout={() => signOut({ callbackUrl: '/' })}
    />
  );
}