import { useEffect, useRef } from 'react';
import {
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const DEFAULT_TARGET_NUMBER = '123123123';
const COOLDOWN_MS = 1000;
const WAIT_AFTER_CALL_MS = 8000;

const CallDetectorNative: {
  startListening?: (targetNumber: string) => Promise<void>;
  stopListening?: () => Promise<void>;
} = NativeModules.CallDetector || {};

interface CallDetectionOptions {
  enabled?: boolean;
  targetPhoneNumber?: string;
  onAlarmDetected: (payload: { phoneNumber?: string; detectedAt: number }) => void;
}

type NativeCallEvent = {
  state: 'RINGING' | 'OFFHOOK' | 'IDLE';
  number?: string;
  timestamp?: number;
};

function normalizeNumber(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/\+/g, '').replace(/\D/g, '');
}

async function requestCallPermissions(): Promise<boolean> {
  try {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ]);
    return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
  } catch (error) {
    console.warn('Call permission error', error);
    return false;
  }
}

export function useCallDetection({
  enabled = true,
  targetPhoneNumber = DEFAULT_TARGET_NUMBER,
  onAlarmDetected,
}: CallDetectionOptions) {
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const cooldownRef = useRef<number>(0);
  const lastRingRef = useRef<number>(0);
  const normalizedTarget = normalizeNumber(targetPhoneNumber);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') {
      return;
    }

    let isMounted = true;

    const setup = async () => {
      if (!CallDetectorNative?.startListening) {
        console.warn('CallDetector native module not available. Build the dev client with the plugin.');
        return;
      }
      const granted = await requestCallPermissions();
      if (!granted || !isMounted) {
        return;
      }
      await CallDetectorNative.startListening(normalizedTarget ?? DEFAULT_TARGET_NUMBER);
    };

    setup();

    const subscription = DeviceEventEmitter.addListener('OSP_CALL_EVENT', (event: NativeCallEvent) => {
      if (!event || !event.state) return;
      const eventTimestamp = event.timestamp ?? Date.now();
      const eventNumber = normalizeNumber(event.number);
      if (normalizedTarget && eventNumber && !eventNumber.endsWith(normalizedTarget)) {
        return;
      }

      if (event.state === 'RINGING') {
        lastRingRef.current = eventTimestamp;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }

      if (event.state === 'IDLE' && lastRingRef.current) {
        if (Date.now() - cooldownRef.current < COOLDOWN_MS) {
          return;
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          cooldownRef.current = Date.now();
          onAlarmDetected({ phoneNumber: eventNumber, detectedAt: Date.now() });
          lastRingRef.current = 0;
          timerRef.current = null;
        }, WAIT_AFTER_CALL_MS);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      CallDetectorNative?.stopListening?.();
    };
  }, [enabled, normalizedTarget, onAlarmDetected]);
}
