'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    hostel: '',
    phone: '',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error('Name, email and password are required');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    try {
      await register(form);
      toast.success('Account created! Welcome to CampusHub 🎉');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
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
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl gradient-bg mb-4 shadow-xl shadow-violet-600/30">
          <span className="text-3xl">🎓</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">CampusHub</h1>
        <p className="text-[hsl(var(--foreground-muted))] mt-1.5 text-sm">Join your campus network today.</p>
      </div>

      <div className="card card-shadow p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">Create account 🎉</h2>
          <p className="text-[hsl(var(--foreground-muted))] text-sm mt-0.5">Use your college email address</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[{ icon: User, field: 'name', type: 'text', placeholder: 'Your full name', label: 'Full Name' },
            { icon: Mail, field: 'email', type: 'email', placeholder: 'you@college.edu', label: 'College Email' }]
            .map(({ icon: Icon, field, type, placeholder, label }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--foreground-muted))]" />
                <input type={type} value={form[field as keyof typeof form]}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder={placeholder} className="input-base pl-10" required />
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--foreground-muted))]" />
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Min. 6 characters" className="input-base pl-10 pr-11" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))] hover:text-white transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ icon: Building2, field: 'hostel', placeholder: 'Block A', label: 'Hostel' },
              { icon: Phone, field: 'phone', placeholder: '9876500000', label: 'Phone' }]
              .map(({ icon: Icon, field, placeholder, label }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-medium text-white/70">{label} <span className="text-[hsl(var(--foreground-muted))]">(opt.)</span></label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--foreground-muted))]" />
                  <input type="text" value={form[field as keyof typeof form]}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={placeholder} className="input-base pl-9 py-2.5 text-sm" />
                </div>
              </div>
            ))}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3.5 rounded-2xl gradient-bg text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-600/25 active:scale-[0.98]">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : 'Create account →'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(var(--foreground-muted))]">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
