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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div>
            <div className="mx-auto h-12 w-12 bg-[var(--primary)] rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-[var(--primary-foreground)]" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--foreground)]">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
              Enter your admin password to access the management interface
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin Password"
                className="text-center"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--ring)] border-[var(--border)] rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--foreground)]">
                Remember me
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[var(--destructive)] text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/" className="text-[var(--primary)] hover:opacity-80 text-sm">
                ← Back to Bookmarks
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}