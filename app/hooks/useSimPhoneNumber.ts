import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

interface PhoneNumber {
  phoneNumber: string;
  slotId: number;
  subscriptionId: number;
}

const API_URL = 'http://qubis.pl:4000/api/firefighters/phone';

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
    
    console.log('Permission result:', granted);
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
        console.log('Requesting READ_PHONE_STATE permission...');
        const hasPermission = await requestPhoneStatePermission();
        
        if (!hasPermission) {
          setError('Permission denied');
          setLoading(false);
          return;
        }

        console.log('Permission granted, fetching SIM info...');

        // Import native module
        const SimCardsManager = require('react-native-sim-cards-manager').default;

        // Get SIM cards
        const simCards = await SimCardsManager.getSimCards();
        console.log('SIM Cards found:', simCards);

        if (!simCards || simCards.length === 0) {
          setError('No SIM card found');
          setLoading(false);
          return;
        }

        const firstSim = simCards[0];
        const phone = firstSim.phoneNumber;
        console.log('Phone number from SIM:', phone);

        if (!mounted) return;

        setPhoneNumber(phone);
        setSimData(firstSim);

        // Try to find firefighter by phone number
        try {
          const url = `${API_URL}/${encodeURIComponent(phone)}`;
          console.log('Fetching firefighter from:', url);
          const response = await fetch(url);
          if (response.ok) {
            const firefighter = await response.json();
            console.log('Found firefighter:', firefighter);
            if (mounted) {
              setFirefighterId(firefighter.id);
            }
          } else {
            console.log('Firefighter not found (HTTP', response.status + ')');
          }
        } catch (err) {
          console.log('Firefighter lookup failed:', err);
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
