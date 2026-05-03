'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { walletAPI } from '@/lib/api';
import { WalletTransaction } from '@/types';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function WalletPage() {
  const { user, updateUser } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [balance, setBalance] = useState(user?.walletBalance || 0);
  const [addAmount, setAddAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const { data } = await walletAPI.get();
      setBalance(data.wallet.balance);
      setTransactions(data.wallet.transactions);
    } catch {
      toast.error('Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (!amount || amount < 10) return toast.error('Minimum top-up is ₹10');
    setIsAdding(true);
    try {
      const { data } = await walletAPI.addFunds(amount);
      setBalance(data.balance);
      updateUser({ walletBalance: data.balance });
      setAddAmount('');
      await fetchWallet();
      toast.success(`₹${amount} added to wallet!`);
    } catch {
      toast.error('Failed to add funds');
    } finally {
      setIsAdding(false);
    }
  };

  const QUICK_AMOUNTS = [50, 100, 200, 500];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        {/* Balance card */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Available Balance</p>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
        </div>

        {/* Add funds */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">Add Funds</h3>
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAddAmount(String(amt))}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                  addAmount === String(amt)
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                )}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <form onSubmit={handleAddFunds} className="flex gap-3">
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount (₹)"
              min="10"
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
        </div>

        {/* Transactions */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">Transactions</h3>
          {isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    tx.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    {tx.type === 'credit'
                      ? <TrendingUp className="w-4 h-4 text-green-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(tx.createdAt)}</p>
                  </div>
                  <span className={cn(
                    'font-semibold text-sm',
                    tx.type === 'credit' ? 'text-green-400' : 'text-red-400'
                  )}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
