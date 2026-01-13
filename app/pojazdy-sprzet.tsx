import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "./config/api";
import styles from "./styles/pojazdy-sprzet_styles";
import colors from "./theme";

type TabType = "vehicles" | "equipment" | "medical_bag";
type Vehicle = any;
type Equipment = any;
type MedicalItem = any;

export default function VehiclesAndEquipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { firefighterId, stationId } = useLocalSearchParams() as {
    firefighterId?: string;
    stationId?: string;
  };

  const [activeTab, setActiveTab] = useState<TabType>("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [medicalItems, setMedicalItems] = useState<MedicalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedMedicalItem, setSelectedMedicalItem] = useState<MedicalItem | null>(null);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState<"vehicle" | "equipment" | "medical_item" | null>(null);

  // Form states for vehicle
  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    operational_number: "",
    inspection_until: "",
    insurance_until: "",
    max_people: "",
    fire_extinguishing_agents: "",
    water_capacity: "",
    pump_description: "",
    total_mass: "",
    engine_power: "",
    drive_type: "",
    chassis_producer: "",
    body_production_year: "",
    description: "",
  });

  // Form states for equipment
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    category_slug: "",
    quantity: "1",
    location: "",
    equipment_type: "",
    production_year: "",
    description: "",
  });

  // Form states for medical items
  const [medicalForm, setMedicalForm] = useState({
    name: "",
    quantity: "1",
    expiry_date: "",
    description: "",
  });

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.vehicles.list());
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      Alert.alert("Błąd", "Nie udało się pobrać pojazdów");
    } finally {
      setLoading(false);
    }
  };

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.stationEquipment.list());
      const data = await res.json();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      Alert.alert("Błąd", "Nie udało się pobrać sprzętu");
    } finally {
      setLoading(false);
    }
  };

  // Fetch medical items
  const fetchMedicalItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.medicalItems.list());
      const data = await res.json();
      setMedicalItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching medical items:", error);
      Alert.alert("Błąd", "Nie udało się pobrać wyposażenia torby medycznej");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchEquipment();
    fetchMedicalItems();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Close whichever modal is open
      if (showVehicleModal) {
        setShowVehicleModal(false);
        return true;
      }
      if (showEquipmentModal) {
        setShowEquipmentModal(false);
        return true;
      }
      if (showMedicalModal) {
        setShowMedicalModal(false);
        return true;
      }
      if (showDetailsModal) {
        setShowDetailsModal(false);
        return true;
      }
      // No modal open, go back
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [showVehicleModal, showEquipmentModal, showMedicalModal, showDetailsModal, router]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "vehicles") {
      await fetchVehicles();
    } else {
      await fetchEquipment();
    }
    setRefreshing(false);
  };

  // Add vehicle
  const handleAddVehicle = async () => {
    if (!vehicleForm.name || !vehicleForm.operational_number) {
      Alert.alert("Błąd", "Nazwa i numer operacyjny są wymagane");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.vehicles.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleForm,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Pojazd dodany");
        setShowVehicleModal(false);
        setVehicleForm({
          name: "",
          operational_number: "",
          inspection_until: "",
          insurance_until: "",
          max_people: "",
          fire_extinguishing_agents: "",
          water_capacity: "",
          pump_description: "",
          total_mass: "",
          engine_power: "",
          drive_type: "",
          chassis_producer: "",
          body_production_year: "",
          description: "",
        });
        fetchVehicles();
      } else {
        Alert.alert("Błąd", "Nie udało się dodać pojazdu");
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      Alert.alert("Błąd", "Nie udało się dodać pojazdu");
    }
  };

  // Add equipment
  const handleAddEquipment = async () => {
    if (!equipmentForm.name || !equipmentForm.category_slug) {
      Alert.alert("Błąd", "Nazwa i kategoria są wymagane");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.stationEquipment.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...equipmentForm,
          quantity: parseInt(equipmentForm.quantity, 10),
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Sprzęt dodany");
        setShowEquipmentModal(false);
        setEquipmentForm({
          name: "",
          category_slug: "",
          quantity: "1",
          location: "",
          equipment_type: "",
          production_year: "",
          description: "",
        });
        fetchEquipment();
      } else {
        Alert.alert("Błąd", "Nie udało się dodać sprzętu");
      }
    } catch (error) {
      console.error("Error adding equipment:", error);
      Alert.alert("Błąd", "Nie udało się dodać sprzętu");
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (id: number) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć pojazd?", [
      { text: "Anuluj" },
      {
        text: "Usuń",
        onPress: async () => {
          try {
            const res = await fetch(API_ENDPOINTS.vehicles.delete(id), {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Sukces", "Pojazd usunięty");
              setShowDetailsModal(false);
              fetchVehicles();
            }
          } catch (error) {
            Alert.alert("Błąd", "Nie udało się usunąć pojazdu");
          }
        },
      },
    ]);
  };

  // Delete equipment
  const handleDeleteEquipment = async (id: number) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć sprzęt?", [
      { text: "Anuluj" },
      {
        text: "Usuń",
        onPress: async () => {
          try {
            const res = await fetch(API_ENDPOINTS.stationEquipment.delete(id), {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Sukces", "Sprzęt usunięty");
              setShowDetailsModal(false);
              fetchEquipment();
            }
          } catch (error) {
            Alert.alert("Błąd", "Nie udało się usunąć sprzętu");
          }
        },
      },
    ]);
  };

  // Save medical item (add or update)
  const handleSaveMedicalItem = async () => {
    if (!medicalForm.name || !medicalForm.quantity) {
      Alert.alert("Błąd", "Nazwa i ilość są wymagane");
      return;
    }

    try {
      const url = selectedMedicalItem 
        ? API_ENDPOINTS.medicalItems.update(selectedMedicalItem.id)
        : API_ENDPOINTS.medicalItems.create;

      const method = selectedMedicalItem ? "PUT" : "POST";

      // Ensure expiry_date is in YYYY-MM-DD format
      let expiryDate = medicalForm.expiry_date;
      if (expiryDate && expiryDate.includes('T')) {
        // Extract just the date part if it's a full ISO string
        expiryDate = expiryDate.split('T')[0];
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: medicalForm.name,
          quantity: parseInt(medicalForm.quantity, 10),
          expiry_date: expiryDate || null,
          description: medicalForm.description,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", selectedMedicalItem ? "Wyposażenie zaktualizowane" : "Wyposażenie dodane");
        setShowMedicalModal(false);
        setSelectedMedicalItem(null);
        setMedicalForm({ name: "", quantity: "1", expiry_date: "", description: "" });
        fetchMedicalItems();
      } else {
        Alert.alert("Błąd", "Nie udało się zapisać wyposażenia");
      }
    } catch (error) {
      console.error("Error saving medical item:", error);
      Alert.alert("Błąd", "Nie udało się zapisać wyposażenia");
    }
  };

  // Delete medical item
  const handleDeleteMedicalItem = async (id: number) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć wyposażenie?", [
      { text: "Anuluj" },
      {
        text: "Usuń",
        onPress: async () => {
          try {
            const res = await fetch(API_ENDPOINTS.medicalItems.delete(id), {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Sukces", "Wyposażenie usunięte");
              setShowDetailsModal(false);
              fetchMedicalItems();
            }
          } catch (error) {
            Alert.alert("Błąd", "Nie udało się usunąć wyposażenia");
          }
        },
      },
    ]);
  };

  function formatDate(dateString: string): string {
  if (!dateString) return "";
  return dateString.split('T')[0];
}

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "vehicles" && styles.tabActive]}
          onPress={() => setActiveTab("vehicles")}
        >
          <Text style={[styles.tabText, activeTab === "vehicles" && styles.tabTextActive]}>
            🚗 Pojazdy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "equipment" && styles.tabActive]}
          onPress={() => setActiveTab("equipment")}
        >
          <Text style={[styles.tabText, activeTab === "equipment" && styles.tabTextActive]}>
            🧰 Sprzęt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "medical_bag" && styles.tabActive]}
          onPress={() => setActiveTab("medical_bag")}
        >
          <Text style={[styles.tabText, activeTab === "medical_bag" && styles.tabTextActive]}>
            🏥 Torba R1
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} refreshControl={undefined}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.headerBackground} style={styles.loader} />
        ) : activeTab === "vehicles" ? (
          <View>
            {vehicles.length === 0 ? (
              <Text style={styles.emptyText}>Brak pojazdów</Text>
            ) : (
              vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={styles.item}
                  onPress={() => {
                    setSelectedVehicle(vehicle);
                    setDetailsType("vehicle");
                    setShowDetailsModal(true);
                  }}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{vehicle.name}</Text>
                    <Text style={styles.itemSubtitle}>#{vehicle.operational_number}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : activeTab === "equipment" ? (
          <View>
            {equipment.length === 0 ? (
              <Text style={styles.emptyText}>Brak sprzętu</Text>
            ) : (
              equipment.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.item}
                  onPress={() => {
                    setSelectedEquipment(item);
                    setDetailsType("equipment");
                    setShowDetailsModal(true);
                  }}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      Ilość: {item.quantity} | {item.category_slug}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View>
            {medicalItems.length === 0 ? (
              <Text style={styles.emptyText}>Brak wyposażenia w torbie medycznej</Text>
            ) : (
              medicalItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.item}
                  onPress={() => {
                    setSelectedMedicalItem(item);
                    setMedicalForm({
                      name: item.name,
                      quantity: String(item.quantity),
                      expiry_date: item.expiry_date || "",
                      description: item.description || "",
                    });
                    setDetailsType("medical_item");
                    setShowMedicalModal(true);
                  }}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      Ilość: {item.quantity} | Ważna do: {formatDate(item.expiry_date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === "vehicles") {
              setShowVehicleModal(true);
            } else if (activeTab === "equipment") {
              setShowEquipmentModal(true);
            } else {
              setMedicalForm({ name: "", quantity: "1", expiry_date: "", description: "" });
              setSelectedMedicalItem(null);
              setShowMedicalModal(true);
            }
          }}
        >
          <Text style={styles.addBtnText}>➕ Dodaj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Powrót</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Modal */}
      <Modal 
        visible={showVehicleModal} 
        animationType="slide" 
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowVehicleModal(false)}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView 
              style={styles.modalContent} 
              scrollEnabled={true} 
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={styles.modalTitle}>Dodaj sprzęt</Text>

            <TextInput
              placeholder="Nazwa"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={vehicleForm.name}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, name: text })}
            />
            <TextInput
              placeholder="Numer operacyjny"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={vehicleForm.operational_number}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, operational_number: text })
              }
            />
            <TextInput
              placeholder="Przegląd do (YYYY-MM-DD)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={formatDate(vehicleForm.inspection_until)}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, inspection_until: text })
              }
            />
            <TextInput
              placeholder="Ubezpieczenie do (YYYY-MM-DD)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={formatDate(vehicleForm.insurance_until)}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, insurance_until: text })
              }
            />
            <TextInput
              placeholder="Max osób"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={vehicleForm.max_people}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, max_people: text })}
            />
            <TextInput
              placeholder="Ilość środków gaśniczych"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={vehicleForm.fire_extinguishing_agents}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, fire_extinguishing_agents: text })
              }
            />
            <TextInput
              placeholder="Pojemność wody (litry)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={vehicleForm.water_capacity}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, water_capacity: text })
              }
            />
            <TextInput
              placeholder="Opis autopompy"
              style={[styles.input, styles.textArea]}
              placeholderTextColor={colors.textMuted}
              multiline
              value={vehicleForm.pump_description}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, pump_description: text })
              }
            />
            <TextInput
              placeholder="Masa całkowita (kg)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={vehicleForm.total_mass}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, total_mass: text })}
            />
            <TextInput
              placeholder="Moc silnika (kW)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={vehicleForm.engine_power}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, engine_power: text })}
            />
            <TextInput
              placeholder="Rodzaj napędu (diesel/benzyna/hybrid)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={vehicleForm.drive_type}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, drive_type: text })}
            />
            <TextInput
              placeholder="Producent podwozia"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={vehicleForm.chassis_producer}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, chassis_producer: text })
              }
            />
            <TextInput
              placeholder="Rok produkcji"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={vehicleForm.body_production_year}
              onChangeText={(text) =>
                setVehicleForm({ ...vehicleForm, body_production_year: text })
              }
            />
            <TextInput
              placeholder="Opis"
              style={[styles.input, styles.textArea]}
              placeholderTextColor={colors.textMuted}
              multiline
              value={vehicleForm.description}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, description: text })}
            />
            </ScrollView>
            <View style={[styles.modalActions]}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddVehicle}>
                <Text style={styles.saveBtnText}>Zapisz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowVehicleModal(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Equipment Modal */}
      <Modal 
        visible={showEquipmentModal} 
        animationType="slide" 
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowEquipmentModal(false)}
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView 
              style={styles.modalContent} 
              scrollEnabled={true} 
              keyboardDismissMode="on-drag"
            >   
              <Text style={styles.modalTitle}>Dodaj sprzęt</Text>

            <TextInput
              placeholder="Nazwa"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={equipmentForm.name}
              onChangeText={(text) => setEquipmentForm({ ...equipmentForm, name: text })}
            />
            <TextInput
              placeholder="Kategoria (np. pompa, agregat)"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={equipmentForm.category_slug}
              onChangeText={(text) =>
                setEquipmentForm({ ...equipmentForm, category_slug: text })
              }
            />
            <TextInput
              placeholder="Ilość"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={equipmentForm.quantity}
              onChangeText={(text) => setEquipmentForm({ ...equipmentForm, quantity: text })}
            />
            <TextInput
              placeholder="Gdzie się znajduje"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={equipmentForm.location}
              onChangeText={(text) => setEquipmentForm({ ...equipmentForm, location: text })}
            />
            <TextInput
              placeholder="Typ sprzętu"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={equipmentForm.equipment_type}
              onChangeText={(text) =>
                setEquipmentForm({ ...equipmentForm, equipment_type: text })
              }
            />
            <TextInput
              placeholder="Rok produkcji"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={equipmentForm.production_year}
              onChangeText={(text) =>
                setEquipmentForm({ ...equipmentForm, production_year: text })
              }
            />
            <TextInput
              placeholder="Opis"
              style={[styles.input, styles.textArea]}
              placeholderTextColor={colors.textMuted}
              multiline
              value={equipmentForm.description}
              onChangeText={(text) => setEquipmentForm({ ...equipmentForm, description: text })}
            />
            </ScrollView>
            <View style={[styles.modalActions]}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddEquipment}>
                <Text style={styles.saveBtnText}>Zapisz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEquipmentModal(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent onDismiss={() => setShowDetailsModal(false)} onRequestClose={() => setShowDetailsModal(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView 
              style={styles.modalContent} 
              scrollEnabled={true} 
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 100 }}
            > 
            {detailsType === "vehicle" && selectedVehicle && (
              <>
                <Text style={styles.modalTitle}>{selectedVehicle.name}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Numer operacyjny:</Text>
                  <Text style={styles.detailValue}>{selectedVehicle.operational_number}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Przegląd do:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedVehicle.inspection_until) || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ubezpieczenie do:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedVehicle.insurance_until) || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Max osób:</Text>
                  <Text style={styles.detailValue}>{selectedVehicle.max_people || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pojemność wody:</Text>
                  <Text style={styles.detailValue}>
                    {selectedVehicle.water_capacity ? `${selectedVehicle.water_capacity}L` : "—"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Moc silnika:</Text>
                  <Text style={styles.detailValue}>
                    {selectedVehicle.engine_power ? `${selectedVehicle.engine_power}kW` : "—"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rodzaj napędu:</Text>
                  <Text style={styles.detailValue}>{selectedVehicle.drive_type || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rok produkcji:</Text>
                  <Text style={styles.detailValue}>{selectedVehicle.body_production_year || "—"}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteVehicle(selectedVehicle.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Usuń pojazd</Text>
                </TouchableOpacity>
              </>
            )}

            {detailsType === "equipment" && selectedEquipment && (
              <>
                <Text style={styles.modalTitle}>{selectedEquipment.name}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kategoria:</Text>
                  <Text style={styles.detailValue}>{selectedEquipment.category_slug}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ilość:</Text>
                  <Text style={styles.detailValue}>{selectedEquipment.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lokalizacja:</Text>
                  <Text style={styles.detailValue}>{selectedEquipment.location || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Typ:</Text>
                  <Text style={styles.detailValue}>{selectedEquipment.equipment_type || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rok produkcji:</Text>
                  <Text style={styles.detailValue}>{selectedEquipment.production_year || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Opis:</Text>
                  <Text style={styles.detailValue}>{selectedEquipment.description || "—"}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteEquipment(selectedEquipment.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Usuń sprzęt</Text>
                </TouchableOpacity>
              </>
            )}

            {detailsType === "medical_item" && selectedMedicalItem && (
              <>
                <Text style={styles.modalTitle}>{selectedMedicalItem.name}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ilość:</Text>
                  <Text style={styles.detailValue}>{selectedMedicalItem.quantity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ważna do:</Text>
                  <Text style={styles.detailValue}>{selectedMedicalItem.expiry_date || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Opis:</Text>
                  <Text style={styles.detailValue}>{selectedMedicalItem.description || "—"}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteMedicalItem(selectedMedicalItem.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Usuń wyposażenie</Text>
                </TouchableOpacity>
              </>
            )}
            </ScrollView>
            <View style={[styles.modalActions]}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.closeBtnText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Medical Item Modal */}
      <Modal 
        visible={showMedicalModal} 
        animationType="slide" 
        transparent
        presentationStyle="overFullScreen"
        onDismiss={() => setShowMedicalModal(false)}
        onRequestClose={() => setShowMedicalModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView 
              style={styles.modalContent} 
              scrollEnabled={true} 
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={styles.modalTitle}>
                {selectedMedicalItem ? "Edytuj wyposażenie" : "Dodaj wyposażenie do torby R1"}
              </Text>

              <TextInput
                placeholder="Nazwa wyposażenia"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={medicalForm.name}
                onChangeText={(text) => setMedicalForm({ ...medicalForm, name: text })}
              />
              <TextInput
                placeholder="Ilość"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={medicalForm.quantity}
                keyboardType="numeric"
                onChangeText={(text) => setMedicalForm({ ...medicalForm, quantity: text })}
              />
              <TextInput
                placeholder="Ważna do (YYYY-MM-DD)"
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                value={formatDate(medicalForm.expiry_date)}
                onChangeText={(text) => setMedicalForm({ ...medicalForm, expiry_date: text })}
              />
              <TextInput
                placeholder="Opis (opcjonalnie)"
                style={[styles.input, { height: 80 }]}
                placeholderTextColor={colors.textMuted}
                value={medicalForm.description}
                onChangeText={(text) => setMedicalForm({ ...medicalForm, description: text })}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => handleSaveMedicalItem()}
              >
                <Text style={styles.submitBtnText}>
                  {selectedMedicalItem ? "✏️ Zaktualizuj" : "➕ Dodaj"}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setShowMedicalModal(false);
                  setSelectedMedicalItem(null);
                  setMedicalForm({ name: "", quantity: "1", expiry_date: "", description: "" });
                }}
              >
                <Text style={styles.closeBtnText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

