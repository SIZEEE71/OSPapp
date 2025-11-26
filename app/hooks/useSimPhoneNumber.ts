import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

interface PhoneNumber {
  phoneNumber: string;
  slotId: number;
  subscriptionId: number;
}

const API_URL = 'http://qubis.pl:4000/api/firefighters/phone';

function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  let normalized = phone.replace(/[^\d+]/g, '');
  
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  if (normalized.startsWith('48')) {
    normalized = normalized.substring(2);
  }
  
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

// Request READ_PHONE_STATE permission on Android
async function requestPhoneStatePermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      {
        title: 'Phone State Permission',
        message: 'This app needs access to your phone state to read SIM card number',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
}

export function useSimPhoneNumber() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [simData, setSimData] = useState<PhoneNumber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firefighterId, setFirefighterId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getPhoneNumber() {
      try {
        setLoading(true);
        setError(null);

        if (Platform.OS !== 'android') {
          setError('Available on Android only');
          setLoading(false);
          return;
        }

        // Request permission first
        const hasPermission = await requestPhoneStatePermission();
        
        if (!hasPermission) {
          setError('Permission denied');
          setLoading(false);
          return;
        }

        // Import native module
        const SimCardsManager = require('react-native-sim-cards-manager').default;

        // Get SIM cards
        const simCards = await SimCardsManager.getSimCards();

        if (!simCards || simCards.length === 0) {
          setError('No SIM card found');
          setLoading(false);
          return;
        }

        const firstSim = simCards[0];
        const phone = firstSim.phoneNumber;

        if (!mounted) return;

        setPhoneNumber(phone);
        setSimData(firstSim);

        // Try to find firefighter by phone number
        try {
          const normalized = normalizePhoneNumber(phone);
          
          const url = `${API_URL}/${encodeURIComponent(normalized)}`;
          const response = await fetch(url);
          if (response.ok) {
            const firefighter = await response.json();
            if (mounted) {
              setFirefighterId(firefighter.id);
            }
          }
        } catch (err) {
          // Firefighter lookup failed - silently continue
        }

        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to get SIM number');
          setLoading(false);
        }
      }
    }

    getPhoneNumber();

    return () => {
      mounted = false;
    };
  }, []);

  return { phoneNumber, simData, loading, error, firefighterId };
}
