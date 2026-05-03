'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/lib/api';
import { formatCurrency, generateAvatarUrl } from '@/lib/utils';
import {
  Star, Package, TrendingUp, Wallet, Shield, Edit3, Loader2,
  CheckCircle2, LogOut, Zap, ChevronRight, Bell,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<{
    ordersAsCustomer: number; ordersAsProvider: number;
    totalEarnings: number; rating: number; reliabilityScore: number;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', hostel: user?.hostel || '', phone: user?.phone || '' });

  useEffect(() => {
    usersAPI.getMyStats().then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await usersAPI.updateProfile(form);
      updateUser(data.user);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setIsSaving(false); }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const statCards = [
    { label: 'Orders placed',   value: stats?.ordersAsCustomer ?? '–', icon: Package,    color: 'text-blue-400',   bg: 'bg-blue-500/15' },
    { label: 'Fulfilled',       value: stats?.ordersAsProvider ?? '–', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/15' },
    { label: 'Total earned',    value: stats ? formatCurrency(stats.totalEarnings) : '–', icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/15' },
    { label: 'Rating',          value: stats ? stats.rating.toFixed(1) : '–', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-4">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card card-shadow p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Image
                src={user.avatar || generateAvatarUrl(user.name)}
                alt={user.name}
                width={68}
                height={68}
                className="rounded-2xl ring-2 ring-violet-500/30"
              />
              {user.isAvailable && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[hsl(var(--card))]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-base py-2 text-sm" placeholder="Full name" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.hostel} onChange={(e) => setForm((p) => ({ ...p, hostel: e.target.value }))}
                      className="input-base py-2 text-sm" placeholder="Hostel" />
                    <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="input-base py-2 text-sm" placeholder="Phone" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={isSaving}
                      className="flex-1 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground-muted))]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold">{user.name}</h2>
                  <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--foreground-muted))]">
                    {user.hostel && <span>🏠 {user.hostel}</span>}
                    {user.phone && <span>📞 {user.phone}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Badges */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[hsl(var(--border))]">
              <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                <span className="text-xs font-semibold text-yellow-400">{(user.rating ?? 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-green-400">{user.reliabilityScore ?? 100}%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">{user.completedOrders} done</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Wallet quick card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link href="/wallet">
            <div className="card card-shadow p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-violet-600/25">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[hsl(var(--foreground-muted))]">Wallet balance</p>
                <p className="text-xl font-bold gradient-text">{formatCurrency(user.walletBalance)}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[hsl(var(--foreground-muted))]" />
            </div>
          </Link>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card card-shadow p-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('w-4.5 h-4.5', color)} />
              </div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Action list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card card-shadow overflow-hidden">
          {[
            { href: '/provider', icon: Zap, label: 'Provider Mode', sub: 'Earn by fulfilling requests', color: 'text-violet-400', bg: 'bg-violet-500/15' },
            { href: '/notifications', icon: Bell, label: 'Notifications', sub: 'Alerts & updates', color: 'text-blue-400', bg: 'bg-blue-500/15' },
          ].map(({ href, icon: Icon, label, sub, color, bg }, i) => (
            <Link key={href} href={href}>
              <div className={cn('flex items-center gap-3 px-4 py-3.5 active:bg-[hsl(var(--surface-2))] transition-colors', i > 0 && 'border-t border-[hsl(var(--border))]')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon className={cn('w-4.5 h-4.5', color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[hsl(var(--foreground-muted))]">{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleLogout}
            className="w-full card card-shadow p-4 flex items-center gap-3 text-red-400 active:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <LogOut className="w-4.5 h-4.5 text-red-400" />
            </div>
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </motion.div>

        <div className="h-2" />
      </div>
    </div>
  );
}
