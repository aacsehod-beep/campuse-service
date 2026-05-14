import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

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

  const getLocation = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setState((s) => ({
        ...s,
        error: 'Location permission denied. Please enable it in settings.',
        isLoading: false,
      }));
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { longitude, latitude } = position.coords;
      const coords: [number, number] = [longitude, latitude];

      // Reverse geocoding via Nominatim
      let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocoded) {
          const parts = [geocoded.name, geocoded.street, geocoded.district].filter(Boolean);
          address = parts.join(', ') || address;
        }
      } catch {
        // Use raw coordinates as fallback
      }

      setState({ coordinates: coords, address, error: null, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setState((s) => ({ ...s, error: message, isLoading: false }));
    }
  }, []);

  return { ...state, getLocation };
}
