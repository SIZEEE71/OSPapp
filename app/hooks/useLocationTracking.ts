import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

const API_URL = 'http://qubis.pl:4000/api/location/update';
const INTERVAL_MS = 3000; // 3 seconds

interface LocationTrackingParams {
  firefighterId: number;
  enabled?: boolean;
}

/**
 * Hook that continuously tracks device location and sends it to the backend
 * @param firefighterId - The ID of the firefighter to track
 * @param enabled - Whether tracking is enabled (default: true)
 */
export function useLocationTracking({ firefighterId, enabled = true }: LocationTrackingParams) {
  const intervalRef = useRef<number | null>(null);
  const isEnabledRef = useRef(enabled);

  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !firefighterId) return;

    let mounted = true;

    async function requestPermissions() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
      }
    }

    async function sendLocation() {
      if (!isEnabledRef.current || !mounted) return;

      try {
        // Check if location services are enabled
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          console.warn('Location services are disabled. Please enable GPS on your device/emulator.');
          return;
        }

        // Try to get location with timeout and fallback options
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Use Low for emulator compatibility
          timeInterval: 5000, // Maximum wait time
        });

        const { latitude, longitude } = location.coords;

        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firefighter_id: firefighterId,
            lat: latitude,
            lng: longitude,
            label: null,
          }),
        });

      } catch (error: any) {
        console.error('❌ Error sending location:', error.message || error);
        
        // Provide helpful debugging info
        if (error.message?.includes('unavailable')) {
          console.warn('💡 Emulator fix: Open emulator settings (... button) → Location → Set location manually');
        }
      }
    }

    async function startTracking() {
      const hasPermission = await requestPermissions();
      if (!hasPermission || !mounted) return;

      // Send immediately
      await sendLocation();

      // Then send every INTERVAL_MS
      intervalRef.current = setInterval(sendLocation, INTERVAL_MS);
    }

    startTracking();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [firefighterId, enabled]);
}
