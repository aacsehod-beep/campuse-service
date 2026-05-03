'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coordinates: [number, number] | null;
  address: string;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    address: '',
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        const coords: [number, number] = [longitude, latitude];

        // Reverse geocoding using a free service
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await resp.json();
          if (data.display_name) {
            const parts = data.display_name.split(',');
            address = parts.slice(0, 3).join(',').trim();
          }
        } catch {
          // Use raw coordinates as fallback
        }

        setState({ coordinates: coords, address, error: null, isLoading: false });
      },
      (error) => {
        setState((s) => ({
          ...s,
          error: error.message || 'Failed to get location',
          isLoading: false,
        }));
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, []);

  return { ...state, getLocation };
}
