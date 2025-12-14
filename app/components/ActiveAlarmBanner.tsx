import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../theme';
import { useAlarmContext } from '../context/AlarmContext';
import { API_ENDPOINTS } from '../config/api';

interface AlarmSummary {
  confirmed: number;
  not_confirmed: number;
  total: number;
}

const REFRESH_INTERVAL_MS = 10000;

const formatTime = (value?: string) => {
  if (!value) return 'brak danych';
  try {
    const date = new Date(value);
    return date.toLocaleString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return value;
  }
};

const ActiveAlarmBanner: React.FC = () => {
  const { activeAlarm } = useAlarmContext();
  const [summary, setSummary] = useState<AlarmSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const alarmId = activeAlarm?.id;

  const loadStats = useCallback(async () => {
    if (!alarmId) return;
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.alarmResponse.stats(alarmId));
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }
      const data = await response.json();
      setSummary(data.summary ?? null);
      setLastUpdated(Date.now());
    } catch (error) {
      console.warn('Active alarm stats error', error);
    } finally {
      setLoading(false);
    }
  }, [alarmId]);

  useEffect(() => {
    if (!alarmId) {
      setSummary(null);
      setLastUpdated(null);
      return;
    }

    let isMounted = true;
    const refresh = async () => {
      if (!isMounted) return;
      await loadStats();
    };

    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [alarmId, loadStats]);

  const statusLabel = useMemo(() => {
    if (!activeAlarm) return '';
    return activeAlarm.status === 'responded' ? 'Odpowiedź wysłana' : 'Oczekiwanie na odpowiedź';
  }, [activeAlarm]);

  if (!activeAlarm) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.title}>Trwający alarm</Text>
          <Text style={styles.subtitle}>Start: {formatTime(activeAlarm.startedAt)}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TAK</Text>
          <Text style={styles.statValue}>{summary?.confirmed ?? '—'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>NIE</Text>
          <Text style={styles.statValue}>{summary?.not_confirmed ?? '—'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Łącznie</Text>
          <Text style={styles.statValue}>{summary?.total ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Odświeżanie danych...</Text>
          </View>
        ) : (
          <Text style={styles.updatedText}>
            {lastUpdated ? `Zaktualizowano ${new Date(lastUpdated).toLocaleTimeString('pl-PL')}` : 'Oczekiwanie na dane'}
          </Text>
        )}
        <TouchableOpacity style={styles.refreshButton} onPress={loadStats} disabled={loading}>
          <Text style={styles.refreshText}>Odśwież</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  refreshText: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  updatedText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default ActiveAlarmBanner;
