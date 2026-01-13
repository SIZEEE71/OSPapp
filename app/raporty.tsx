import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    FlatList,
    Linking,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "./config/api";
import styles from "./styles/raporty_styles";
import colors from "./theme";

function formatDate(dateString: string): string {
  if (!dateString) return "";
  return dateString.split('T')[0];
}

interface Alarm {
  id: number;
  alarm_time: string;
  alarm_type: string | null;
  location: string | null;
  description: string | null;
  vehicle_id: number | null;
}

interface Report {
  id: number;
  alarm_id: number;
  report_date: string;
  report_number: string | null;
  created_by: number | null;
  created_at: string;
  alarm_time: string;
  alarm_type: string | null;
  location: string | null;
  created_by_name: string | null;
  created_by_surname: string | null;
}

export default function Raporty() {
  const router = useRouter();
  const { firefighterId } = useLocalSearchParams() as { firefighterId?: string };
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAlarmSelectModal, setShowAlarmSelectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);

  const [formData, setFormData] = useState({
    alarm_id: "",
    report_date: new Date().toISOString().split("T")[0],
    report_number: "",
  });

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.reports.list);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Błąd", "Nie udało się pobrać raportów");
    } finally {
      setLoading(false);
    }
  };

  // Fetch alarms for selection
  const fetchAlarms = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.alarms.list());
      const text = await res.text();
      const data = JSON.parse(text);
      setAlarms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching alarms:", error);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchAlarms();
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showReportModal) {
        setShowReportModal(false);
        return true;
      }
      if (showAlarmSelectModal) {
        setShowAlarmSelectModal(false);
        return true;
      }
      if (showDetailsModal) {
        setShowDetailsModal(false);
        return true;
      }
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [showReportModal, showAlarmSelectModal, showDetailsModal, router]);

  // Select alarm and fill form
  const handleSelectAlarm = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setFormData({
      alarm_id: alarm.id.toString(),
      report_date: new Date().toISOString().split("T")[0],
      report_number: "",
    });
    setShowAlarmSelectModal(false);
    setShowReportModal(true);
  };

  // Generate report number
  const generateReportNumber = () => {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `RAP-${today}-${random}`;
  };

  // Create report
  const handleCreateReport = async () => {
    if (!formData.alarm_id) {
      Alert.alert("Błąd", "Wybierz alarm");
      return;
    }

    try {
      const reportData = {
        ...formData,
        alarm_id: parseInt(formData.alarm_id),
        report_number: formData.report_number || generateReportNumber(),
        created_by: firefighterId ? parseInt(firefighterId) : null,
      };

      const res = await fetch(API_ENDPOINTS.reports.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Raport utworzony");
        setShowReportModal(false);
        setFormData({
          alarm_id: "",
          report_date: new Date().toISOString().split("T")[0],
          report_number: "",
        });
        setSelectedAlarm(null);
        fetchReports();
      }
    } catch (error) {
      console.error("Error creating report:", error);
      Alert.alert("Błąd", "Nie udało się utworzyć raportu");
    }
  };

  // Delete report
  const handleDeleteReport = async (id: number) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć raport?", [
      { text: "Anuluj" },
      {
        text: "Usuń",
        onPress: async () => {
          try {
            const res = await fetch(API_ENDPOINTS.reports.delete(id), {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Sukces", "Raport usunięty");
              setShowDetailsModal(false);
              fetchReports();
            }
          } catch (error) {
            console.error("Error deleting report:", error);
            Alert.alert("Błąd", "Nie udało się usunąć raportu");
          }
        },
      },
    ]);
  };

  // Format date time
  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("pl-PL");
  };

  // Render report item
  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => {
        setSelectedReport(item);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportNumber}>{item.report_number || "Brak numeru"}</Text>
        <Text style={styles.reportDate}>{formatDate(item.report_date)}</Text>
      </View>
      <Text style={styles.reportType}>{item.alarm_type || "Brak typu"}</Text>
      {item.location && <Text style={styles.reportLocation}>📍 {item.location}</Text>}
      <Text style={styles.reportCreatedBy}>
        Utworzył: {item.created_by_name} {item.created_by_surname}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Raporty</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setShowAlarmSelectModal(true);
          }}
        >
          <Text style={styles.addButtonText}>➕ Nowy</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.headerBackground}
          style={styles.loader}
        />
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak raportów</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Back button */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Powrót</Text>
        </TouchableOpacity>
      </View>

      {/* Select Alarm Modal */}
      <Modal
        visible={showAlarmSelectModal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowAlarmSelectModal(false)}
        onRequestClose={() => setShowAlarmSelectModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAlarmSelectModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Wybierz alarm</Text>
              <View style={{ width: 30 }} />
            </View>

            <FlatList
              data={alarms}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.alarmOption}
                  onPress={() => handleSelectAlarm(item)}
                >
                  <View>
                    <Text style={styles.alarmOptionType}>
                      {item.alarm_type || "Brak typu"}
                    </Text>
                    <Text style={styles.alarmOptionLocation}>
                      {item.location || "Brak lokalizacji"}
                    </Text>
                    <Text style={styles.alarmOptionTime}>
                      {formatDateTime(item.alarm_time)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Create Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowReportModal(false)}
        onRequestClose={() => setShowReportModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nowy raport</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardDismissMode="on-drag"
            >
              {selectedAlarm && (
                <>
                  {/* Alarm Information */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informacje z alarmu</Text>
                    
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Godzina alarmu:</Text>
                      <Text style={styles.infoValue}>{formatDateTime(selectedAlarm.alarm_time)}</Text>
                    </View>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Rodzaj alarmu:</Text>
                      <Text style={styles.infoValue}>{selectedAlarm.alarm_type || "Brak typu"}</Text>
                    </View>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Lokalizacja:</Text>
                      <Text style={styles.infoValue}>{selectedAlarm.location || "Brak lokalizacji"}</Text>
                    </View>
                  </View>

                  {/* Report Fields */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dane raportu</Text>
                    
                    <Text style={styles.inputLabel}>Data raportu</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      style={styles.input}
                      placeholderTextColor={colors.textMuted}
                      value={formatDate(formData.report_date)}
                      onChangeText={(text) =>
                        setFormData({ ...formData, report_date: text })
                      }
                    />

                    <Text style={styles.inputLabel}>Numer raportu (opcjonalnie)</Text>
                    <TextInput
                      placeholder="Pozostaw puste by wygenerować"
                      style={styles.input}
                      placeholderTextColor={colors.textMuted}
                      value={formData.report_number}
                      onChangeText={(text) =>
                        setFormData({ ...formData, report_number: text })
                      }
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateReport}
              >
                <Text style={styles.saveBtnText}>Utwórz raport</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Report Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowDetailsModal(false)}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Szczegóły raportu</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardDismissMode="on-drag"
            >
              {selectedReport && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informacje z alarmu</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Godzina alarmu:</Text>
                      <Text style={styles.detailValue}>
                        {formatDateTime(selectedReport.alarm_time)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rodzaj alarmu:</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.alarm_type || "Brak"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Lokalizacja:</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.location || "Brak"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dane raportu</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Numer raportu:</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.report_number || "Brak"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Data raportu:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedReport.report_date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Utworzył:</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.created_by_name} {selectedReport.created_by_surname}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => {
                  if (selectedReport) {
                    const pdfUrl = `${API_BASE}/reports/${selectedReport.id}/pdf`;
                    Linking.openURL(pdfUrl).catch(() => {
                      Alert.alert("Błąd", "Nie udało się otworzyć PDF");
                    });
                  }
                }}
              >
                <Text style={styles.downloadBtnText}>📥 Pobierz PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  selectedReport && handleDeleteReport(selectedReport.id)
                }
              >
                <Text style={styles.deleteBtnText}>🗑️ Usuń</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
