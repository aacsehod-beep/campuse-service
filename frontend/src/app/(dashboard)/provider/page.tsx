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

  const fetchNearby = async () => {
    if (!coordinates) return;
    setLoadingOrders(true);
    try {
      const { data } = await ordersAPI.getAll({
        lat: coordinates[1],
        lng: coordinates[0],
        radius: 3000,
        status: 'BROADCASTED',
        limit: 20,
      });
      setNearbyOrders(data.orders || []);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (coordinates) fetchNearby();
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-violet-400" />
              Provider Mode
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Toggle availability and accept nearby requests</p>
          </div>
        </div>

        {/* Availability toggle */}
        <div className={cn(
          'glass-card rounded-2xl p-6 flex items-center justify-between mb-6 transition-colors',
          user?.isAvailable ? 'border-green-500/30' : 'border-border'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center',
              user?.isAvailable ? 'bg-green-500/10' : 'bg-secondary'
            )}>
              <Power className={cn('w-6 h-6', user?.isAvailable ? 'text-green-400' : 'text-muted-foreground')} />
            </div>
            <div>
              <p className="font-semibold">{user?.isAvailable ? 'You are Online' : 'You are Offline'}</p>
              <p className="text-sm text-muted-foreground">
                {user?.isAvailable ? 'Requests near you are visible' : 'Toggle to start accepting'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={isToggling}
            className={cn(
              'relative w-14 h-7 rounded-full transition-colors focus:outline-none disabled:opacity-60',
              user?.isAvailable ? 'bg-green-500' : 'bg-secondary border border-border'
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

        {/* Location info */}
        {coordinates && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 px-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Showing requests within 3km of your location</span>
          </div>
        )}

        {/* Nearby orders */}
        <h2 className="font-semibold mb-3">
          Requests near you
          {nearbyOrders.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {nearbyOrders.length}
            </span>
          )}
        </h2>

        {loadingOrders ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : nearbyOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
            <Package className="w-10 h-10 opacity-30" />
            <p className="text-sm">No requests nearby right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyOrders.map((order) => (
              <RequestCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
