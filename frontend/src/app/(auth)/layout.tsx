'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/feed');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-[-15%] left-[-20%] w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[350px] h-[350px] rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
