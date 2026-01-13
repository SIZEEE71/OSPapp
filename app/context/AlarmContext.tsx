import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import AlarmOverlay from '../components/AlarmOverlay';
import { API_ENDPOINTS } from '../config/api';
import { useCallDetection } from '../hooks/useCallDetection';

export type AlarmResponseType = 'TAK' | 'NIE';

export interface ActiveAlarm {
  id: number;
  callNumber?: string | null;
  startedAt: string;
  expiresAt: number;
  status: 'awaiting_response' | 'responded';
  lastResponse?: AlarmResponseType;
}

interface AlarmContextValue {
  activeAlarm: ActiveAlarm | null;
  overlayCountdown: number;
  respondToAlarm: (response: AlarmResponseType) => Promise<void>;
  isResponding: boolean;
  isVoiceListening: boolean;
  shouldShareLocation: boolean;
  dismissAlarm: () => void;
}

const AlarmContext = createContext<AlarmContextValue | undefined>(undefined);

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DEFAULT_COUNTDOWN = 15;
const TARGET_PHONE_NUMBER = '608101402';
const VOICE_LOCALE = 'pl-PL';
const VOICE_TIMEOUT_MS = DEFAULT_COUNTDOWN * 1000;
const YES_KEYWORDS = ['tak', 'potwierdzam'];
const NO_KEYWORDS = ['nie', 'odmawiam'];

const normalizeCommand = (input?: string | null) =>
  (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z\s]/g, '')
    .trim();

const detectResponseFromSpeech = (phrase?: string | null): AlarmResponseType | null => {
  const normalized = normalizeCommand(phrase);
  if (!normalized) {
    return null;
  }
  if (YES_KEYWORDS.some((word) => normalized.includes(word))) {
    return 'TAK';
  }
  if (NO_KEYWORDS.some((word) => normalized.includes(word))) {
    return 'NIE';
  }
  return null;
};

export const AlarmProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const [overlayCountdown, setOverlayCountdown] = useState(DEFAULT_COUNTDOWN);
  const [isResponding, setIsResponding] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoDeclineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const notificationRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerRef = useRef<number>(0);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up background notification task
  useEffect(() => {
    // Obsługa odpowiedzi na powiadomienie
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      // User tapped on notification - could navigate to alarm confirmation
    });

    return () => subscription.remove();
  }, []);

  // Check for intent alarm when app starts (from PhoneStateReceiver)
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let isMounted = true;
    const checkIntentAlarm = async () => {
      try {
        const { NativeModules } = require('react-native');
        const CallDetector = NativeModules.CallDetector;
        if (!CallDetector?.checkIntentAlarm) {
          return;
        }
        
        const alarmData = await CallDetector.checkIntentAlarm();
        if (isMounted && alarmData) {
          console.log('🚨 Intent alarm detected:', alarmData);
          // Wyzwól alarm z danych z intentu
          handleAlarmDetected({
            phoneNumber: alarmData.phoneNumber,
            detectedAt: alarmData.detectedAt || Date.now(),
          });
        }
      } catch (error) {
        console.warn('Error checking intent alarm:', error);
      }
    };

    // Sprawdzaj intent na start
    const timeoutId = setTimeout(checkIntentAlarm, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Polling: check for active alarms every 5 seconds (for users without incoming call event)
  useEffect(() => {
    if (!activeAlarm) {
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(API_ENDPOINTS.alarms.list());
          const alarms = await res.json();
          
          if (Array.isArray(alarms) && alarms.length > 0) {
            // Find most recent active alarm (end_time is null AND alarm_time is in past)
            const now = Date.now();
            const activeAlarms = alarms.filter((a: any) => {
              const alarmTime = new Date(a.alarm_time).getTime();
              return !a.end_time && alarmTime <= now;
            });

            if (activeAlarms.length > 0) {
              const mostRecent = activeAlarms.reduce((latest: any, current: any) =>
                new Date(current.alarm_time).getTime() > new Date(latest.alarm_time).getTime() ? current : latest
              );
              
              console.log('📡 Polling found active alarm:', mostRecent.id);
              // Set as active alarm
              setActiveAlarm({
                id: mostRecent.id,
                callNumber: mostRecent.call_phone_number,
                startedAt: mostRecent.alarm_time,
                expiresAt: Date.now() + FIVE_MINUTES_MS,
                status: 'awaiting_response',
              });
            }
          }
        } catch (error) {
          console.warn('Polling error:', error);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [activeAlarm]);

  const clearTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoDeclineTimeoutRef.current) {
      clearTimeout(autoDeclineTimeoutRef.current);
      autoDeclineTimeoutRef.current = null;
    }
    if (notificationRefreshIntervalRef.current) {
      clearInterval(notificationRefreshIntervalRef.current);
      notificationRefreshIntervalRef.current = null;
    }
  }, []);

  const clearVoiceTimeout = useCallback(() => {
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
  }, []);

  const stopVoiceCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    clearVoiceTimeout();
    if (isVoiceListening) {
      setIsVoiceListening(false);
    }
    try {
      await Voice.stop();
    } catch (error) {
      console.warn('Voice stop error', error);
    }
    try {
      await Voice.cancel();
    } catch (error) {
      console.warn('Voice cancel error', error);
    }
  }, [clearVoiceTimeout, isVoiceListening]);

  const clearNotification = useCallback(async () => {
    try {
      if (notificationIdRef.current) {
        await Notifications.dismissNotificationAsync(notificationIdRef.current);
        notificationIdRef.current = null;
      }
      // Cancel all scheduled notifications to ensure none repeat
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Dismiss notification error', error);
    }
  }, []);

  const respondToAlarm = useCallback(
    async (responseType: AlarmResponseType, silent = false) => {
      if (!activeAlarm) return;
      let firefighterId: number | null = null;
      try {
        const storedId = await AsyncStorage.getItem('activeFirefighterId');
        if (storedId) {
          firefighterId = parseInt(storedId, 10);
        }
      } catch (error) {
        console.warn('Unable to read firefighterId', error);
      }

      if (!firefighterId) {
        if (!silent) {
          Alert.alert('Brak użytkownika', 'Zaloguj się ponownie, aby potwierdzić alarm.');
        }
        return;
      }

      try {
        setIsResponding(true);
        const response = await fetch(API_ENDPOINTS.alarmResponse.respond(activeAlarm.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firefighter_id: firefighterId, response_type: responseType }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        await stopVoiceCapture();
        Speech.stop();
        
        // Clear refresh interval completely
        if (notificationRefreshIntervalRef.current) {
          clearInterval(notificationRefreshIntervalRef.current);
          notificationRefreshIntervalRef.current = null;
        }
        
        // Update alarm status - this will prevent scheduleNotification from running
        setActiveAlarm((prev) => (prev ? { ...prev, status: 'responded', lastResponse: responseType } : prev));
        
        // Send updated sticky notification showing the response
        try {
          console.log('📢 Showing response notification');
          const responseText = responseType === 'TAK' ? '✅ POTWIERDZONO' : '❌ ODRZUCONO';
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚨 TRWAJĄCY ALARM',
              body: responseText,
              sticky: true,
            },
            trigger: null, // Send immediately
          });
          notificationIdRef.current = id;
          console.log('✅ Response notification sent:', id);
        } catch (e) {
          console.warn('Error sending response notification:', e);
        }
      } catch (error) {
        console.error('Error sending alarm response:', error);
        if (!silent) {
          Alert.alert('Błąd', 'Nie udało się wysłać odpowiedzi. Spróbuj ponownie.');
        }
      } finally {
        setIsResponding(false);
      }
    },
    [activeAlarm, stopVoiceCapture]
  );

  const startVoiceCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      // Voice module may not be available on all setups
      // Try to use it, but don't fail if it's not available
      if (!Voice || !Voice.start) {
        console.warn('Voice module not available, skipping voice capture');
        setIsVoiceListening(false);
        return;
      }
      
      await stopVoiceCapture();
      await Voice.start(VOICE_LOCALE);
      setIsVoiceListening(true);
      clearVoiceTimeout();
      voiceTimeoutRef.current = setTimeout(() => {
        stopVoiceCapture();
      }, VOICE_TIMEOUT_MS) as unknown as NodeJS.Timeout;
    } catch (error) {
      console.warn('Voice start error:', error);
      setIsVoiceListening(false);
    }
  }, [clearVoiceTimeout, stopVoiceCapture]);

  const scheduleNotification = useCallback(async () => {
    try {
      // Don't dismiss previous - we want it to stay in notification center!
      
      // If already responded, don't schedule more notifications
      if (activeAlarm?.status === 'responded') {
        console.log('🔕 Alarm already responded, skipping notification');
        return;
      }
      
      console.log('📢 Scheduling SILENT alarm notification');
      // Schedule SILENT notification that stays in notification center
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 TRWAJĄCY ALARM',
          body: 'Potwierdź udział w alarmie. Kliknij aby odpowiedzieć.',
          sticky: true,
        },
        trigger: null, // Send immediately to ensure it appears
      });
      notificationIdRef.current = id;
      // Powiadomienie zostało zaplanowane
    } catch (error) {
      console.warn('Alarm notification error', error);
    }
  }, [activeAlarm]);

  const handleAlarmDetected = useCallback(
    async ({ phoneNumber, detectedAt }: { phoneNumber?: string; detectedAt: number }) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < 7000) {
        return;
      }
      lastTriggerRef.current = now;

      try {
        const payload = {
          call_phone_number: phoneNumber ?? TARGET_PHONE_NUMBER,
          alarm_time: new Date(detectedAt).toISOString(),
          end_time: new Date(detectedAt + FIVE_MINUTES_MS).toISOString(), // Auto-end after 5 minutes
        };

        console.log('🚨 Triggering alarm with payload:', payload);
        
        const response = await fetch(API_ENDPOINTS.alarmResponse.trigger, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Status odpowiedzi z serwera
          const errorText = await response.text();
          console.error('❌ Alarm trigger error response:', errorText);
          throw new Error(`Failed to create alarm: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Alarm created:', data);
        
        setActiveAlarm({
          id: data.alarmId,
          callNumber: data.call_phone_number,
          startedAt: data.alarm_time ?? new Date().toISOString(),
          expiresAt: Date.now() + FIVE_MINUTES_MS,
          status: 'awaiting_response',
        });
      } catch (error) {
        console.error('❌ Alarm trigger failed:', error);
      }
    },
    []
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    return () => {
      stopVoiceCapture();
      Voice.destroy().then(Voice.removeAllListeners).catch(() => undefined);
    };
  }, [stopVoiceCapture]);

  useCallDetection({
    enabled: Platform.OS === 'android' && !activeAlarm,
    targetPhoneNumber: TARGET_PHONE_NUMBER,
    onAlarmDetected: handleAlarmDetected,
  });

  useEffect(() => {
    const initializeAlarm = async () => {
      if (activeAlarm?.status === 'awaiting_response') {
        setOverlayCountdown(DEFAULT_COUNTDOWN);
        clearTimers();
        Speech.stop();
        Speech.speak('Czy bierzesz udział w alarmie?', {
          language: 'pl-PL',
          rate: 0.92,
          pitch: 1.0,
        });
        
        // Send notification once (silent, no refresh)
        await scheduleNotification();
        
        startVoiceCapture();

        countdownIntervalRef.current = setInterval(() => {
          setOverlayCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000) as unknown as NodeJS.Timeout;    

        autoDeclineTimeoutRef.current = setTimeout(() => {
          respondToAlarm('NIE', true);
        }, DEFAULT_COUNTDOWN * 1000) as unknown as NodeJS.Timeout;
      } else {
        clearTimers();
        stopVoiceCapture();
      }
    };

    initializeAlarm();

    return () => {
      if (!activeAlarm) {
        clearTimers();
        stopVoiceCapture();
      }
    };
  }, [activeAlarm, clearTimers, respondToAlarm, startVoiceCapture, stopVoiceCapture, scheduleNotification]);

  useEffect(() => {
    if (!activeAlarm) {
      clearNotification();
      Speech.stop();
      stopVoiceCapture();
      return;
    }

    const remaining = activeAlarm.expiresAt - Date.now();
    if (remaining <= 0) {
      setActiveAlarm(null);
      return;
    }

    const timeout = setTimeout(() => setActiveAlarm(null), remaining);
    return () => clearTimeout(timeout);
  }, [activeAlarm, clearNotification, stopVoiceCapture]);

  const shouldShareLocation = useMemo(
    () =>
      Boolean(
        activeAlarm &&
          activeAlarm.status === 'responded' &&
          activeAlarm.lastResponse === 'TAK' &&
          activeAlarm.expiresAt > Date.now()
      ),
    [activeAlarm]
  );

  const contextValue = useMemo<AlarmContextValue>(
    () => ({
      activeAlarm,
      overlayCountdown,
      respondToAlarm: (response) => respondToAlarm(response, false),
      isResponding,
      isVoiceListening,
      shouldShareLocation,
      dismissAlarm: () => setActiveAlarm(null),
    }),
    [activeAlarm, overlayCountdown, respondToAlarm, isResponding, isVoiceListening, shouldShareLocation]
  );

  return (
    <AlarmContext.Provider value={contextValue}>
      {children}
      <AlarmOverlay />
    </AlarmContext.Provider>
  );
};

export const useAlarmContext = (): AlarmContextValue => {
  const ctx = useContext(AlarmContext);
  if (!ctx) {
    throw new Error('useAlarmContext must be used within AlarmProvider');
  }
  return ctx;
};
