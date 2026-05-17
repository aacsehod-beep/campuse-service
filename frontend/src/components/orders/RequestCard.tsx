'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Order, CATEGORY_META, STATUS_META } from '@/types';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { MapPin, Clock, Zap, Users, Tag } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

interface Props {
  order: Order;
  showStatus?: boolean;
}

export default function RequestCard({ order, showStatus = false }: Props) {
  const meta = CATEGORY_META[order.category];
  const statusMeta = STATUS_META[order.status];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <Link href={`/orders/${order._id}`}>
        <div className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all group cursor-pointer">
          <div className="flex items-start gap-4">
            {/* Category icon */}
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              meta.bg
            )}>
              <meta.icon className={cn('w-5 h-5', meta.color)} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', meta.bg, meta.color)}>
                      {meta.label}
                    </span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize border border-border', 
                      order.mode === 'bidding' ? 'text-violet-400' : 'text-blue-400'
                    )}>
                      {order.mode}
                    </span>
                    {order.urgency === 'asap' && (
                      <span className="flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400">
                        <Zap className="w-3 h-3" />
                        ASAP
                      </span>
                    )}
                    {order.isPriorityBoosted && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400">
                        ⭐ Boosted
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground line-clamp-2 leading-relaxed">
                    {order.description}
                  </p>
                </div>

                {(order.budget || order.finalPrice) && (
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">
                      {formatCurrency(order.finalPrice ?? order.budget ?? 0)}
                    </p>
                    {!order.finalPrice && <p className="text-xs text-muted-foreground">budget</p>}
                  </div>
                )}
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-3">
                  {/* Author */}
                  {typeof order.userId !== 'string' && order.userId && (
                  <div className="flex items-center gap-1.5">
                    <UserAvatar
                      name={(order.userId as { name: string }).name}
                      avatar={(order.userId as { avatar?: string }).avatar}
                      size={20}
                    />
                    <span className="text-xs text-muted-foreground">{(order.userId as { name: string }).name}</span>
                  </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeAgo(order.createdAt)}
                  </div>

                  {/* Location */}
                  {order.location?.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{order.location.address.split(',')[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Bid count */}
                  {order.mode === 'bidding' && order.bids && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {order.bids.length} bid{order.bids.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Status badge */}
                  {showStatus && (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-md',
                      statusMeta.bg, statusMeta.color
                    )}>
                      {statusMeta.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
