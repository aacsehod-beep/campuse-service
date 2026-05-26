'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import BottomNav from '@/components/layout/Sidebar';
import { connectSocket } from '@/lib/socket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useSocket();

  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (token) connectSocket(token);
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Admin gets full-width; normal pages stay mobile-first */}
      <main className={isAdminRoute ? 'min-h-screen' : 'max-w-md mx-auto pb-safe min-h-screen'}>
        {children}
      </main>
      {!isAdminRoute && <BottomNav />}
    </div>
  );
}

