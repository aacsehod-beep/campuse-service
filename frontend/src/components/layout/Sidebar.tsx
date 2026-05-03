'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Package, MessageSquare, User } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/feed',      label: 'Home',    icon: Home },
  { href: '/create',   label: 'Request',  icon: PlusCircle },
  { href: '/my-orders',label: 'Orders',   icon: Package },
  { href: '/chat',     label: 'Chat',     icon: MessageSquare },
  { href: '/profile',  label: 'Profile',  icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06]"
      style={{ height: 'var(--bottom-nav-height)' }}
    >
      <div className="max-w-md mx-auto h-full flex items-center justify-around px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const isCreate = href === '/create';

          if (isCreate) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center">
                <div className={cn(
                  'w-14 h-14 -mt-6 rounded-2xl gradient-bg flex items-center justify-center shadow-lg glow transition-transform active:scale-95',
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] mt-1 text-muted-foreground">{label}</span>
              </Link>
            );
          }

          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 relative px-3 py-1">
              <div className={cn(
                'relative w-6 h-6 transition-all',
                isActive ? 'text-violet-400' : 'text-[hsl(var(--foreground-muted))]',
              )}>
                <Icon className="w-6 h-6" />
                {label === 'Chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-violet-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-violet-400' : 'text-[hsl(var(--foreground-muted))]',
              )}>
                {label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-violet-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
