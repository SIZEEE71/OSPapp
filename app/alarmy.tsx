import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import SelectField from "./components/SelectField";
import styles from "./styles/alarmy_styles";
import colors from "./theme";

const API_BASE = "http://qubis.pl:4000/api";

interface Alarm {
  id: number;
  alarm_time: string;
  end_time: string | null;
  alarm_type: string | null;
  location: string | null;
  description: string | null;
  vehicle_id: number | null;
  firefighter_ids: string | null;
  created_at: string;
}

interface Vehicle {
  id: number;
  name: string;
  operational_number: string;
  max_people: number;
}

interface Firefighter {
  id: number;
  name: string;
  surname: string;
}

interface CrewMember {
  id: number;
  position: string;
  firefighter_id: number;
  name: string;
  surname: string;
}

export default function Alarmy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedCrewFirefighter, setSelectedCrewFirefighter] = useState<string>("");

  // Form state for adding/editing alarm
  const [formData, setFormData] = useState({
    alarm_time: "",
    end_time: "",
    alarm_type: "",
    location: "",
    description: "",
    vehicle_id: "",
  });

  // Format date to MySQL format (YYYY-MM-DD HH:MM:SS)
  const formatDateToMySQL = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Format date to YYYY-MM-DD (remove time)
function formatDate(dateString: string): string {
  if (!dateString) return "";
  return dateString.split('T')[0];
}

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/vehicles`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  // Fetch firefighters
  const fetchFirefighters = async () => {
    try {
      const res = await fetch(`${API_BASE}/firefighters-extended`);
      const data = await res.json();
      setFirefighters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching firefighters:", error);
    }
  };

  // Fetch crew for alarm
  const fetchCrew = async (alarmId: number) => {
    try {
      const res = await fetch(`${API_BASE}/alarms/${alarmId}/crew`);
      const data = await res.json();
      setCrewMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching crew:", error);
    }
  };

  // Assign crew member to position
  const handleAssignCrew = async () => {
    if (!selectedAlarm || !selectedPosition || !selectedCrewFirefighter) {
      Alert.alert("Błąd", "Wybierz pozycję i strażaka");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/alarms/${selectedAlarm.id}/crew`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firefighter_id: parseInt(selectedCrewFirefighter),
            position: selectedPosition,
          }),
        }
      );

      if (res.ok) {
        await fetchCrew(selectedAlarm.id);
        setSelectedPosition("");
        setSelectedCrewFirefighter("");
        Alert.alert("Sukces", "Załoga przypisana");
      }
    } catch (error) {
      console.error("Error assigning crew:", error);
      Alert.alert("Błąd", "Nie udało się przypisać załogi");
    }
  };

  // Remove crew member from position
  const handleRemoveCrew = async (position: string) => {
    if (!selectedAlarm) return;

    try {
      const res = await fetch(
        `${API_BASE}/alarms/${selectedAlarm.id}/crew/${position}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        await fetchCrew(selectedAlarm.id);
        Alert.alert("Sukces", "Załoga usunięta");
      }
    } catch (error) {
      console.error("Error removing crew:", error);
      Alert.alert("Błąd", "Nie udało się usunąć załogi");
    }
  };

  // Fetch alarms
  const fetchAlarms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/alarms`);
      const text = await res.text();
      const data = JSON.parse(text);
      setAlarms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching alarms:", error);
      Alert.alert("Błąd", "Nie udało się pobrać alarmów");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
    fetchVehicles();
    fetchFirefighters();
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showDetailsModal) {
        setShowDetailsModal(false);
        return true;
      }
      if (showAddModal) {
        setShowAddModal(false);
        return true;
      }
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [showDetailsModal, showAddModal, router]);

  // Add new alarm
  const handleAddAlarm = async () => {
    if (!formData.alarm_time) {
      Alert.alert("Błąd", "Czas alarmu jest wymagany");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/alarms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alarm_time: formData.alarm_time,
          end_time: formData.end_time ? formatDateToMySQL(formData.end_time) : null,
          alarm_type: formData.alarm_type || null,
          location: formData.location || null,
          description: formData.description || null,
          vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Alarm dodany");
        setShowAddModal(false);
        setFormData({ alarm_time: "", end_time: "", alarm_type: "", location: "", description: "", vehicle_id: "" });
        fetchAlarms();
      } else {
        Alert.alert("Błąd", "Nie udało się dodać alarmu");
      }
    } catch (error) {
      console.error("Error adding alarm:", error);
      Alert.alert("Błąd", "Nie udało się dodać alarmu");
    }
  };

  // Update alarm
  const handleUpdateAlarm = async () => {
    if (!selectedAlarm) return;

    try {
      const res = await fetch(`${API_BASE}/alarms/${selectedAlarm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alarm_type: formData.alarm_type || null,
          location: formData.location || null,
          description: formData.description || null,
          vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
          end_time: formData.end_time ? formatDateToMySQL(formData.end_time) : null,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Alarm zaktualizowany");
        setShowDetailsModal(false);
        setSelectedAlarm(null);
        fetchAlarms();
      } else {
        Alert.alert("Błąd", "Nie udało się zaktualizować alarmu");
      }
    } catch (error) {
      console.error("Error updating alarm:", error);
      Alert.alert("Błąd", "Nie udało się zaktualizować alarmu");
    }
  };

  // Delete alarm
  const handleDeleteAlarm = async (id: number) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć alarm?", [
      { text: "Anuluj" },
      {
        text: "Usuń",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/alarms/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Sukces", "Alarm usunięty");
              setShowDetailsModal(false);
              fetchAlarms();
            } else {
              Alert.alert("Błąd", "Nie udało się usunąć alarmu");
            }
          } catch (error) {
            console.error("Error deleting alarm:", error);
            Alert.alert("Błąd", "Nie udało się usunąć alarmu");
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

  // Open alarm details
  const openAlarmDetails = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setFormData({
      alarm_time: alarm.alarm_time || "",
      end_time: alarm.end_time || "",
      alarm_type: alarm.alarm_type || "",
      location: alarm.location || "",
      description: alarm.description || "",
      vehicle_id: alarm.vehicle_id?.toString() || "",
    });
    fetchCrew(alarm.id);
    setShowDetailsModal(true);
  };

  // Render alarm item
  const renderAlarmItem = ({ item }: { item: Alarm }) => (
    <TouchableOpacity
      style={styles.alarmItem}
      onPress={() => openAlarmDetails(item)}
    >
      <View style={styles.alarmHeader}>
        <Text style={styles.alarmTime}>{formatDateTime(item.alarm_time)}</Text>
        {item.alarm_type && <Text style={styles.alarmType}>{item.alarm_type}</Text>}
      </View>
      {item.location && (
        <Text style={styles.alarmLocation}>📍 {item.location}</Text>
      )}
      {item.description && (
        <Text style={styles.alarmDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Alarmy</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.statButton}
            onPress={() => router.push("/statystyka")}
          >
            <Text style={styles.statButtonText}>📊 Statystyka</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setFormData({ alarm_time: "", end_time: "", alarm_type: "", location: "", description: "", vehicle_id: "" });
              setShowAddModal(true);
            }}
          >
            <Text style={styles.addButtonText}>➕ Nowy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.headerBackground}
          style={styles.loader}
        />
      ) : alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak alarmów</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAlarmItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Back button */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Powrót</Text>
        </TouchableOpacity>
      </View>

      {/* Add Alarm Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowAddModal(false)}
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nowy alarm</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardDismissMode="on-drag"
            >
              <Text style={styles.inputLabel}>Czas alarmu (YYYY-MM-DD HH:MM:SS) *</Text>
              <TextInput
                placeholder="2024-12-08 14:30:00"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={formData.alarm_time}
                onChangeText={(text) =>
                  setFormData({ ...formData, alarm_time: text })
                }
              />

              <Text style={styles.inputLabel}>Czas zakończenia (YYYY-MM-DD HH:MM:SS)</Text>
              <TextInput
                placeholder="2024-12-08 16:00:00"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={formatDate(formData.end_time)}
                onChangeText={(text) =>
                  setFormData({ ...formData, end_time: text })
                }
              />

              <Text style={styles.inputLabel}>Rodzaj alarmu</Text>
              <TextInput
                placeholder="np. pożar, wypadek, alarm fałszywy"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={formData.alarm_type}
                onChangeText={(text) =>
                  setFormData({ ...formData, alarm_type: text })
                }
              />

              <Text style={styles.inputLabel}>Miejsce zdarzenia</Text>
              <TextInput
                placeholder="Adres lub opis lokalizacji"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
              />

              <Text style={styles.inputLabel}>Opis</Text>
              <TextInput
                placeholder="Dodatkowe informacje"
                style={[styles.input, styles.textArea]}
                placeholderTextColor={colors.textMuted}
                multiline
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
              />

              <SelectField
                label="Pojazd (opcjonalnie)"
                value={formData.vehicle_id}
                options={[
                  { label: "Brak pojazdu", value: "" },
                  ...vehicles.map((vehicle: Vehicle) => ({ 
                    label: `${vehicle.name} (${vehicle.operational_number})`, 
                    value: vehicle.id.toString() 
                  })),
                ]}
                onChange={(value: string) => setFormData({ ...formData, vehicle_id: value })}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddAlarm}
              >
                <Text style={styles.saveBtnText}>Dodaj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
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
              <Text style={styles.modalTitle}>Szczegóły alarmu</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardDismissMode="on-drag"
            >
              {selectedAlarm && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Czas alarmu:</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(selectedAlarm.alarm_time)}
                    </Text>
                  </View>

                  {selectedAlarm.end_time && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Czas zakończenia:</Text>
                      <Text style={styles.detailValue}>
                        {formatDateTime(selectedAlarm.end_time)}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>Rodzaj alarmu</Text>
                  <TextInput
                    placeholder="np. pożar, wypadek"
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                    value={formData.alarm_type}
                    onChangeText={(text) =>
                      setFormData({ ...formData, alarm_type: text })
                    }
                  />

                  <Text style={styles.inputLabel}>Miejsce zdarzenia</Text>
                  <TextInput
                    placeholder="Adres lub opis lokalizacji"
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                    value={formData.location}
                    onChangeText={(text) =>
                      setFormData({ ...formData, location: text })
                    }
                  />

                  <Text style={styles.inputLabel}>Opis</Text>
                  <TextInput
                    placeholder="Dodatkowe informacje"
                    style={[styles.input, styles.textArea]}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                  />

                  <SelectField
                    label="Pojazd (opcjonalnie)"
                    value={formData.vehicle_id}
                    options={[
                      { label: "Brak pojazdu", value: "" },
                      ...vehicles.map((vehicle: Vehicle) => ({ 
                        label: `${vehicle.name} (${vehicle.operational_number})`, 
                        value: vehicle.id.toString() 
                      })),
                    ]}
                    onChange={(value: string) => setFormData({ ...formData, vehicle_id: value })}
                  />

                  {/* Crew Section */}
                  <View style={styles.crewSection}>
                    <View style={styles.crewHeader}>
                      <Text style={styles.crewTitle}>👥 Załoga samochodu</Text>
                      <TouchableOpacity 
                        style={styles.addCrewBtn}
                        onPress={() => {
                          setSelectedPosition("");
                          setSelectedCrewFirefighter("");
                          setShowCrewModal(true);
                        }}
                      >
                        <Text style={styles.addCrewText}>➕</Text>
                      </TouchableOpacity>
                    </View>

                    {crewMembers.length === 0 ? (
                      <Text style={styles.noCrewText}>Brak przypisanej załogi</Text>
                    ) : (
                      crewMembers.map((member) => (
                        <View key={member.id} style={styles.crewItem}>
                          <View style={styles.crewItemContent}>
                            <Text style={styles.crewPosition}>{member.position}</Text>
                            <Text style={styles.crewName}>
                              {member.name} {member.surname}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveCrew(member.position)}
                          >
                            <Text style={styles.crewRemove}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateAlarm}
              >
                <Text style={styles.saveBtnText}>Zapisz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  selectedAlarm && handleDeleteAlarm(selectedAlarm.id)
                }
              >
                <Text style={styles.deleteBtnText}>🗑️ Usuń</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Crew Assignment Modal */}
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
              <Text style={styles.modalTitle}>Przypisz załogę</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardDismissMode="on-drag"
            >
              {selectedAlarm && formData.vehicle_id && (
                <>
                  <Text style={styles.inputLabel}>Pozycja w załodze</Text>
                  <View style={styles.positionGrid}>
                    {(() => {
                      const vehicle = vehicles.find(v => v.id.toString() === formData.vehicle_id);
                      const maxPeople = vehicle?.max_people || 0;
                      const positions = ["Kierowca", "Dowódca"];
                      
                      // Add "Strażak" positions based on max_people
                      for (let i = 0; i < Math.max(0, maxPeople - 2); i++) {
                        positions.push(`Strażak ${i + 1}`);
                      }

                      return positions.map((position) => {
                        const isAssigned = crewMembers.some(c => c.position === position);
                        return (
                          <TouchableOpacity
                            key={position}
                            style={[
                              styles.positionBtn,
                              selectedPosition === position && styles.positionBtnActive,
                              isAssigned && styles.positionBtnAssigned,
                            ]}
                            onPress={() => setSelectedPosition(position)}
                            disabled={isAssigned && selectedPosition !== position}
                          >
                            <Text style={[
                              styles.positionBtnText,
                              selectedPosition === position && styles.positionBtnTextActive,
                            ]}>
                              {position}
                              {isAssigned && " ✓"}
                            </Text>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>

                  <Text style={styles.inputLabel}>Wybierz strażaka</Text>
                  <SelectField
                    label=""
                    value={selectedCrewFirefighter}
                    options={firefighters.map((ff: Firefighter) => ({
                      label: `${ff.name} ${ff.surname}`,
                      value: ff.id.toString(),
                    }))}
                    onChange={(value: string) => setSelectedCrewFirefighter(value)}
                  />
                </>
              )}
              {!formData.vehicle_id && (
                <Text style={styles.emptyText}>Najpierw wybierz pojazd</Text>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAssignCrew}
              >
                <Text style={styles.saveBtnText}>Przypisz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCrewModal(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

