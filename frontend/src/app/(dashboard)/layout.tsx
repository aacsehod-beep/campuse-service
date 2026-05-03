'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import BottomNav from '@/components/layout/Sidebar';
import { connectSocket } from '@/lib/socket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  useSocket();

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
      {/* Scrollable content area with bottom padding for nav */}
      <main className="max-w-md mx-auto pb-safe min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

