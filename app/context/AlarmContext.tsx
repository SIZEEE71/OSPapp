import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
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
  const lastTriggerRef = useRef<number>(0);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoDeclineTimeoutRef.current) {
      clearTimeout(autoDeclineTimeoutRef.current);
      autoDeclineTimeoutRef.current = null;
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

  const startVoiceCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      await stopVoiceCapture();
      await Voice.start(VOICE_LOCALE);
      setIsVoiceListening(true);
      clearVoiceTimeout();
      voiceTimeoutRef.current = setTimeout(() => {
        stopVoiceCapture();
      }, VOICE_TIMEOUT_MS) as unknown as NodeJS.Timeout;
    } catch (error) {
      console.warn('Voice start error', error);
      setIsVoiceListening(false);
    }
  }, [clearVoiceTimeout, stopVoiceCapture]);

  const scheduleNotification = useCallback(async () => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Trwający alarm',
          body: 'Potwierdź udział w alarmie.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
      notificationIdRef.current = id;
    } catch (error) {
      console.warn('Alarm notification error', error);
    }
  }, []);

  const clearNotification = useCallback(async () => {
    try {
      if (notificationIdRef.current) {
        await Notifications.dismissNotificationAsync(notificationIdRef.current);
        notificationIdRef.current = null;
      } else {
        await Notifications.dismissAllNotificationsAsync();
      }
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

        setActiveAlarm((prev) => (prev ? { ...prev, status: 'responded', lastResponse: responseType } : prev));
        await stopVoiceCapture();
        clearNotification();
        clearTimers();
        Speech.stop();
      } catch (error) {
        console.error('Error sending alarm response:', error);
        if (!silent) {
          Alert.alert('Błąd', 'Nie udało się wysłać odpowiedzi. Spróbuj ponownie.');
        }
      } finally {
        setIsResponding(false);
      }
    },
    [activeAlarm, clearNotification, clearTimers, stopVoiceCapture]
  );

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
        };

        const response = await fetch(API_ENDPOINTS.alarmResponse.trigger, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to create alarm');
        }

        const data = await response.json();
        setActiveAlarm({
          id: data.alarmId,
          callNumber: data.call_phone_number,
          startedAt: data.alarm_time ?? new Date().toISOString(),
          expiresAt: Date.now() + FIVE_MINUTES_MS,
          status: 'awaiting_response',
        });
      } catch (error) {
        console.error('Alarm trigger failed:', error);
      }
    },
    []
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const handleSpeechResults = (event: SpeechResultsEvent) => {
      const phrases = event.value ?? [];
      for (const phrase of phrases) {
        const detected = detectResponseFromSpeech(phrase);
        if (detected) {
          stopVoiceCapture();
          respondToAlarm(detected, false);
          break;
        }
      }
    };

    const handleSpeechError = (event: SpeechErrorEvent) => {
      console.warn('Voice recognition error', event.error);
      stopVoiceCapture();
    };

    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechPartialResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;

    return () => {
      stopVoiceCapture();
      Voice.destroy().then(Voice.removeAllListeners).catch(() => undefined);
    };
  }, [respondToAlarm, stopVoiceCapture]);

  useCallDetection({
    enabled: Platform.OS === 'android' && !activeAlarm,
    targetPhoneNumber: TARGET_PHONE_NUMBER,
    onAlarmDetected: handleAlarmDetected,
  });

  useEffect(() => {
    if (activeAlarm?.status === 'awaiting_response') {
      setOverlayCountdown(DEFAULT_COUNTDOWN);
      clearTimers();
      Speech.stop();
      Speech.speak('Czy bierzesz udział w alarmie?', {
        language: 'pl-PL',
        rate: 0.92,
        pitch: 1.0,
      });
      scheduleNotification();
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

    return () => {
      if (!activeAlarm) {
        clearTimers();
        stopVoiceCapture();
      }
    };
  }, [activeAlarm, clearTimers, respondToAlarm, scheduleNotification, startVoiceCapture, stopVoiceCapture]);

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
