import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlarmContext } from '../context/AlarmContext';
import colors from '../theme';

const AlarmOverlay: React.FC = () => {
  const { activeAlarm, overlayCountdown, respondToAlarm, isResponding, isVoiceListening } = useAlarmContext();
  const visible = activeAlarm?.status === 'awaiting_response';

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Trwający alarm</Text>
          <Text style={styles.subtitle}>Numer alarmowy {activeAlarm?.callNumber ?? '608101402'}</Text>
          <Text style={styles.question}>Czy bierzesz udział w alarmie?</Text>
          {isVoiceListening && (
            <Text style={styles.voiceHint}>Nasłuchiwanie odpowiedzi głosowej...</Text>
          )}
          <Text style={styles.countdownLabel}>Pozostały czas na odpowiedź:</Text>
          <Text style={styles.countdownValue}>{overlayCountdown}s</Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.negativeButton]}
              disabled={isResponding}
              onPress={() => respondToAlarm('NIE')}
            >
              {isResponding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>NIE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.positiveButton]}
              disabled={isResponding}
              onPress={() => respondToAlarm('TAK')}
            >
              {isResponding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>TAK</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  question: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  voiceHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  countdownValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  positiveButton: {
    backgroundColor: '#2e7d32',
  },
  negativeButton: {
    backgroundColor: '#c62828',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AlarmOverlay;
