import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  RefreshControl,
  SectionList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "./config/api";
import styles from "./styles/powiadomienia_styles";
import colors from "./theme";

interface PastAlarm {
  id: number;
  alarm_time: string;
  alarm_type: string | null;
  location: string | null;
  description: string | null;
  end_time: string | null;
  crew_count: number;
}

interface ExpiringTraining {
  id: number;
  training_name: string;
  completion_date: string | null;
  validity_until: string;
  days_until_expiry: number;
  firefighter_id?: number;
  name?: string;
  surname?: string;
}

interface VehicleInspection {
  id: number;
  name: string;
  operational_number: string;
  inspection_until: string | null;
  insurance_until: string | null;
  days_until_inspection?: number;
  days_until_insurance?: number;
}

interface UnpaidContribution {
  id: number;
  name: string;
  surname: string;
}

interface NotificationData {
  past_alarms: PastAlarm[];
  periodic_exams: ExpiringTraining[];
  vehicle_inspections: VehicleInspection[];
  unpaid_contributions?: UnpaidContribution[];
  all_firefighters_exams?: ExpiringTraining[];
}

interface Firefighter {
  id: number;
  name: string;
  surname: string;
  rank_id?: number;
  rank_name?: string;
}

export default function Powiadomienia() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { firefighterId } = useLocalSearchParams();
  const [notifications, setNotifications] = useState<NotificationData | null>(null);
  const [firefighter, setFirefighter] = useState<Firefighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [selectedAlarmId, setSelectedAlarmId] = useState<number | null>(null);
  const [crewList, setCrewList] = useState<Array<{ id: number; name: string; surname: string; response_type: string }>>([]);
  const [crewLoading, setCrewLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (!firefighterId) return;
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      const fighterId = parseInt(String(firefighterId), 10);
      const response = await fetch(
        API_ENDPOINTS.notifications.get(fighterId)
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(String(err));
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [firefighterId]);

  // Fetch firefighter details
  const fetchFirefighter = useCallback(async () => {
    if (!firefighterId) return;
    try {
      const fighterId = parseInt(String(firefighterId), 10);
      const response = await fetch(`http://qubis.pl:4000/api/firefighters-extended/${fighterId}`);
      if (!response.ok) return;
      const data = await response.json();
      setFirefighter(data);
    } catch (err) {
      console.error("Error fetching firefighter:", err);
    }
  }, [firefighterId]);

  // Fetch crew responses for alarm
  const fetchCrewResponses = useCallback(async (alarmId: number) => {
    try {
      setCrewLoading(true);
      const response = await fetch(`http://qubis.pl:4000/api/alarm-response/${alarmId}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch crew responses: ${response.status}`);
      }
      const data = await response.json();
      const responses = data.responses || [];
      setCrewList(Array.isArray(responses) ? responses : []);
    } catch (err) {
      console.error("Error fetching crew responses:", err);
      setCrewList([]);
    } finally {
      setCrewLoading(false);
    }
  }, []);

  const openCrewModal = (alarmId: number) => {
    setSelectedAlarmId(alarmId);
    setShowCrewModal(true);
    fetchCrewResponses(alarmId);
  };

  useEffect(() => {
    fetchFirefighter();
    fetchNotifications();
  }, [firefighterId]);

  // Back button handler
  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [router]);

  const isPrezes = firefighter?.rank_id === 12;
  const isNaczelnik = firefighter?.rank_id === 11;

  // Format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL");
  };

  // Format datetime
  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("pl-PL");
  };

  // Get urgency color
  const getUrgencyColor = (days: number | undefined | null): string => {
    if (days === undefined || days === null) return colors.text;
    if (days <= 14) return "#FF4444"; // Red - urgent
    if (days <= 30) return "#FF9500"; // Orange - warning
    if (days <= 60) return "#FFD700"; // Yellow - caution
    return colors.text; // Normal
  };

  // Render past alarm
  const renderPastAlarm = ({ item }: { item: PastAlarm }) => (
    <View style={styles.notificationCard}>
      <TouchableOpacity onPress={() => router.push(`/alarmy`)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.alarm_type || "Alarm"}</Text>
          <Text style={styles.cardDate}>{formatDateTime(item.alarm_time)}</Text>
        </View>
        <Text style={styles.cardLocation}>📍 {item.location || "Nieznana lokalizacja"}</Text>
        {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
      </TouchableOpacity>
      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={() => openCrewModal(item.id)}>
          <Text style={styles.cardMeta}>👥 {item.crew_count} strażaków</Text>
        </TouchableOpacity>
        {item.end_time && <Text style={styles.cardMeta}>✓ Zakończony</Text>}
      </View>
    </View>
  );

  // Render expiring training
  const renderExpiringTraining = ({ item }: { item: ExpiringTraining }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { borderLeftColor: getUrgencyColor(item.days_until_expiry), borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.training_name}</Text>
        <Text
          style={[
            styles.cardDate,
            { color: getUrgencyColor(item.days_until_expiry) },
          ]}
        >
          {formatDate(item.validity_until)}
        </Text>
      </View>
      {(item.firefighter_id || item.name) && (
        <Text style={styles.cardDescription}>
          👤 {item.name} {item.surname}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={[styles.cardMeta, { color: getUrgencyColor(item.days_until_expiry) }]}>
          ⏱️ {item.days_until_expiry} dni
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render vehicle inspection
  const renderVehicleInspection = ({ item }: { item: VehicleInspection }) => {
    const urgencyColor = getUrgencyColor(
      Math.min(item.days_until_inspection ?? 999, item.days_until_insurance ?? 999)
    );
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { borderLeftColor: urgencyColor, borderLeftWidth: 4 },
        ]}
        onPress={() => router.push(`/pojazdy-sprzet`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={[styles.cardDate, { color: urgencyColor }]}>
            {item.operational_number}
          </Text>
        </View>
        {item.inspection_until && (
          <Text style={styles.cardDescription}>
            🔍 Przegląd: {formatDate(item.inspection_until)} ({item.days_until_inspection} dni)
          </Text>
        )}
        {item.insurance_until && (
          <Text style={styles.cardDescription}>
            📋 Ubezpieczenie: {formatDate(item.insurance_until)} ({item.days_until_insurance} dni)
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render unpaid contributions
  const renderUnpaidContribution = ({ item }: { item: UnpaidContribution }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { borderLeftColor: "#FFC107", borderLeftWidth: 4 },
      ]}
      onPress={() => router.push(`/strazacy`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>💳 Nieopłacone składki</Text>
        <Text style={[styles.cardDate, { color: "#FFC107" }]}>
          {item.name} {item.surname}
        </Text>
      </View>
      <Text style={[styles.cardDescription, { color: "#FFC107" }]}>
        ⚠️ Prosimy o opłacenie składek
      </Text>
    </TouchableOpacity>
  );

  // Sections for SectionList
  const sections = [];

  if (notifications?.past_alarms && notifications.past_alarms.length > 0) {
    sections.push({
      title: "📢 Przeszłe alarmy",
      data: notifications.past_alarms,
      renderItem: renderPastAlarm,
    });
  }

  if (notifications?.periodic_exams && notifications.periodic_exams.length > 0) {
    sections.push({
      title: "🏥 Moje badania okresowe",
      data: notifications.periodic_exams,
      renderItem: renderExpiringTraining,
    });
  }

  if (notifications?.unpaid_contributions && notifications.unpaid_contributions.length > 0) {
    sections.push({
      title: "💳 Nieopłacone składki",
      data: notifications.unpaid_contributions,
      renderItem: renderUnpaidContribution,
    });
  }

  if (isNaczelnik && notifications?.all_firefighters_exams && notifications.all_firefighters_exams.length > 0) {
    sections.push({
      title: "🏥 Badania okresowe strażaków (Naczelnik)",
      data: notifications.all_firefighters_exams,
      renderItem: renderExpiringTraining,
    });
  }

  if (isPrezes) {
    if (notifications?.vehicle_inspections && notifications.vehicle_inspections.length > 0) {
      sections.push({
        title: "🚗 Pojazdy - przeglądy i ubezpieczenia (Prezes)",
        data: notifications.vehicle_inspections,
        renderItem: renderVehicleInspection,
      });
    }

    if (notifications?.all_firefighters_exams && notifications.all_firefighters_exams.length > 0) {
      sections.push({
        title: "🏥 Badania okresowe wszystkich strażaków (Prezes)",
        data: notifications.all_firefighters_exams,
        renderItem: renderExpiringTraining,
      });
    }
  }

  if (sections.length === 0 && !loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Wróć</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Powiadomienia</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak powiadomień</Text>
          <Text style={styles.emptySubtext}>Wszystko jest na bieżąco! ✓</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Wróć</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Powiadomienia</Text>
        <View style={{ width: 60 }} />
      </View>

      {firefighter && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            {firefighter.name} {firefighter.surname}
          </Text>
          {firefighter.rank_name && (
            <Text style={styles.userRank}>{firefighter.rank_name}</Text>
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Błąd: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchNotifications(true)}
          >
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Ładowanie powiadomień...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections as any}
          keyExtractor={(item: any, index: number) => String(item.id || index)}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(false)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak powiadomień</Text>
              <Text style={styles.emptySubtext}>Wszystko jest na bieżąco! ✓</Text>
            </View>
          }
        />
      )}

      {/* Crew Modal */}
      <Modal
        visible={showCrewModal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowCrewModal(false)}
        onRequestClose={() => setShowCrewModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCrewModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Odpowiedzi strażaków</Text>
              <View style={{ width: 30 }} />
            </View>

            {crewLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : crewList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Brak odpowiedzi</Text>
              </View>
            ) : (
              <View style={styles.modalContent}>
                {crewList.map((member, index) => (
                  <View key={`${member.id || index}`} style={styles.crewMemberItem}>
                    <Text style={styles.crewMemberName}>
                      {member.name} {member.surname}
                    </Text>
                    <Text
                      style={[
                        styles.crewMemberResponse,
                        { color: member.response_type === 'TAK' ? '#4CAF50' : '#FF6B6B' }
                      ]}
                    >
                      {member.response_type === 'TAK' ? '✓ TAK' : '✗ NIE'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
