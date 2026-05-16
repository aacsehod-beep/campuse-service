'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/lib/api';
import { useOrderStore } from '@/store/orderStore';
import RequestCard from '@/components/orders/RequestCard';
import { Zap, Power, MapPin, Loader2, Package } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { ordersAPI } from '@/lib/api';

export default function ProviderPage() {
  const { user, updateUser } = useAuthStore();
  const { coordinates, getLocation } = useGeolocation();
  const [isToggling, setIsToggling] = useState(false);
  const [nearbyOrders, setNearbyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchNearby = async (coords?: [number, number]) => {
    setLoadingOrders(true);
    try {
      const params: Record<string, unknown> = { status: 'BROADCASTED', limit: 20 };
      if (coords) {
        params.lat = coords[1];
        params.lng = coords[0];
        params.radius = 3000;
      }
      const { data } = await ordersAPI.getAll(params);
      setNearbyOrders(data.orders || []);
    } catch {
      // fallback: fetch without location
      try {
        const { data } = await ordersAPI.getAll({ status: 'BROADCASTED', limit: 20 });
        setNearbyOrders(data.orders || []);
      } catch { /* ignore */ }
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchNearby(); // load immediately without coords
    getLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (coordinates) fetchNearby(coordinates);
  }, [coordinates]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAvailability = async () => {
    setIsToggling(true);
    try {
      const newState = !user?.isAvailable;
      await usersAPI.toggleAvailability(newState, coordinates ? { coordinates } : undefined);
      updateUser({ isAvailable: newState });
      toast.success(newState ? '✅ You are now available for requests' : '⛔ You are now offline');
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[hsl(var(--primary))]" />
              Provider Mode
            </h1>
            <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">Toggle availability and accept nearby requests</p>
          </div>
          {/* Online/Offline toggle */}
          <button
            onClick={toggleAvailability}
            disabled={isToggling}
            className={cn(
              'relative w-14 h-7 rounded-full transition-colors focus:outline-none disabled:opacity-60',
              user?.isAvailable ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]'
            )}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin absolute inset-0 m-auto" />
            ) : (
              <span className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform',
                user?.isAvailable ? 'translate-x-7' : 'translate-x-0.5'
              )} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Status card with radar animation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className={cn('card card-shadow p-5 flex items-center gap-4 transition-colors', user?.isAvailable ? 'border-emerald-500/30' : '')}
        >
          {/* Radar / Power icon */}
          <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
            {user?.isAvailable && (
              <>
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-emerald-500/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                  className="absolute inset-0 rounded-full bg-emerald-500/15"
                />
              </>
            )}
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shadow-md z-10',
              user?.isAvailable ? 'bg-emerald-500/15 shadow-emerald-600/20' : 'bg-[hsl(var(--surface-2))]'
            )}>
              <Power className={cn('w-6 h-6', user?.isAvailable ? 'text-emerald-500' : 'text-[hsl(var(--foreground-muted))]')} />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">{user?.isAvailable ? 'You are Online' : 'You are Offline'}</p>
            <p className="text-sm text-[hsl(var(--foreground-muted))] mt-0.5">
              {user?.isAvailable ? 'Requests near you are visible' : 'Toggle to start accepting requests'}
            </p>
            {coordinates && user?.isAvailable && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1.5">
                <MapPin className="w-3 h-3" /> Showing within 3km
              </p>
            )}
          </div>
        </motion.div>

        {/* Nearby orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[hsl(var(--foreground))]">
              Requests near you
            </h2>
            {nearbyOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-semibold">
                {nearbyOrders.length}
              </span>
            )}
          </div>

          {loadingOrders ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--surface-2))] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[hsl(var(--surface-2))] rounded-lg w-5/6" />
                      <div className="h-3 bg-[hsl(var(--surface-2))] rounded-lg w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[hsl(var(--foreground-muted))] gap-3">
              <div className="w-14 h-14 rounded-3xl bg-[hsl(var(--surface-2))] flex items-center justify-center">
                <Package className="w-7 h-7 opacity-40" />
              </div>
              <p className="text-sm font-medium">No requests nearby right now</p>
              <p className="text-xs text-center">
                {user?.isAvailable ? 'New requests will appear here' : 'Go online to see nearby requests'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyOrders.map((order) => (
                <RequestCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
