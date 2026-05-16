'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usersAPI, ordersAPI } from '@/lib/api';
import { User, Order } from '@/types';
import { Users, Package, Ban, CheckCircle2, Loader2, Search } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [tab, setTab] = useState<'users' | 'orders'>('users');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [u, o] = await Promise.all([
          usersAPI.getAllUsers(),
          ordersAPI.getAll({ limit: 50 }),
        ]);
        setUsers(u.data.users || []);
        setOrders(o.data.orders || []);
      } finally {
        setLoadingUsers(false);
        setLoadingOrders(false);
      }
    };
    fetchAll();
  }, []);

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-500/10' },
    { label: 'Total Orders', value: orders.length, icon: <Package className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-500/10' },
    { label: 'Active Orders', value: orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length, icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, bg: 'bg-green-500/10' },
    { label: 'Banned Users', value: users.filter((u) => u.isBanned).length, icon: <Ban className="w-5 h-5 text-red-400" />, bg: 'bg-red-500/10' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['users', 'orders'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
                tab === t ? 'bg-primary/10 border border-primary/30 text-primary' : 'border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
          {tab === 'users' && (
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Users table */}
        {tab === 'users' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            {loadingUsers ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Orders</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Rating</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={u.name}
                            avatar={u.avatar}
                            size={32}
                            className="rounded-lg"
                          />
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md text-xs font-medium capitalize',
                          u.role === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-secondary text-muted-foreground'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.completedOrders}</td>
                      <td className="px-4 py-3">
                        <span className="text-yellow-400">★</span> {u.rating.toFixed(1)}
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span className="px-2 py-0.5 rounded-md text-xs bg-red-500/10 text-red-400">Banned</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs bg-green-500/10 text-green-400">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Orders table */}
        {tab === 'orders' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            {loadingOrders ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Category</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Budget</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 max-w-[200px] truncate">{o.description}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{o.category}</td>
                      <td className="px-4 py-3">{formatCurrency(o.budget ?? 0)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-secondary text-muted-foreground capitalize">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{timeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
