'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    try {
      await login(email, password);
      toast.success('Welcome back! 👋');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Logo */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl gradient-bg mb-4 shadow-xl shadow-green-700/30">
          <span className="text-3xl">🎓</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">CampusHub</h1>
        <p className="text-[hsl(var(--foreground-muted))] mt-1.5 text-sm">Campus services, on demand.</p>
      </div>

      <div className="card card-shadow p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Welcome back 👋</h2>
          <p className="text-[hsl(var(--foreground-muted))] text-sm mt-0.5">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--foreground-muted))]" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="input-base pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--foreground-muted))]" />
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base pl-10 pr-11"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3.5 rounded-2xl gradient-bg text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-700/25 active:scale-[0.98]">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign in →'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(var(--foreground-muted))]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))] font-semibold transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
