'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/PageTransition';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Load saved password on component mount
  useEffect(() => {
    const savedPassword = localStorage.getItem('admin-password');
    const savedRememberMe = localStorage.getItem('admin-remember-me') === 'true';

    if (savedPassword && savedRememberMe) {
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid password');
      } else {
        // Check if sign in was successful
        const session = await getSession();
        if (session) {
          // Handle remember me functionality
          if (rememberMe) {
            localStorage.setItem('admin-password', password);
            localStorage.setItem('admin-remember-me', 'true');
          } else {
            localStorage.removeItem('admin-password');
            localStorage.removeItem('admin-remember-me');
          }

          router.push('/admin');
        } else {
          setError('Login failed');
        }
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[color-mix(in srgb, var(--primary) 18%, var(--card-border))] bg-[color-mix(in srgb, var(--card) 92%, transparent 8%)] p-8 shadow-[var(--shadow-card)]/40 backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at 20% -10%, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 65%)' }} />

          <div className="relative space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in srgb, var(--primary) 20%, transparent)] text-[var(--primary-foreground)] shadow-[var(--shadow-card)]/40">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">Admin Portal</h2>
              <p className="text-sm text-[color-mix(in srgb, var(--muted-foreground) 85%, transparent 15%)]">
                Enter your secure passphrase to unlock the control room.
              </p>
            </div>
          </div>

          <form className="relative mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                Admin Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="text-center text-base"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[color-mix(in srgb, var(--primary) 12%, var(--card-border))] bg-[color-mix(in srgb, var(--secondary) 65%, transparent 35%)] px-4 py-3">
              <label htmlFor="remember-me" className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                />
                Remember this device
              </label>
              <span className="text-xs text-[color-mix(in srgb, var(--muted-foreground) 85%, transparent 15%)]">
                Secure storage uses local encryption
              </span>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-[var(--destructive)]/30 bg-[color-mix(in srgb, var(--destructive) 14%, transparent)] px-4 py-2 text-sm text-[var(--destructive)]"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <Button type="submit" disabled={loading} className="w-full text-base">
                {loading ? 'Signing in…' : 'Enter Vault'}
              </Button>
              <Link
                href="/"
                className="inline-flex w-full justify-center rounded-2xl border border-transparent bg-[color-mix(in srgb, var(--accent) 70%, transparent 30%)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
              >
                ← Return to bookmarks
              </Link>
            </div>
          </form>
        </motion.div>

        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 55%), radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 60%)' }} />
      </div>
    </PageTransition>
  );
}