import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "./theme";

type TabType = "list" | "add" | "trainings";
type Firefighter = any;
type Rank = any;
type Group = any;
type Training = any;
type Language = any;

const API_BASE = "http://qubis.pl:4000/api";

// Simple Select Component
interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const [showModal, setShowModal] = useState(false);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "Wybierz...";

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.selectButtonText}>{selectedLabel}</Text>
        <Text style={styles.selectButtonArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.selectOverlay}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.selectModalContent}>
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    value === option.value && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    setShowModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      value === option.value && styles.selectOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function Strazacy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  const [selectedFirefighter, setSelectedFirefighter] = useState<Firefighter | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);

  // Form states
  const [firefighterForm, setFirefighterForm] = useState({
    name: "",
    surname: "",
    rank_id: "",
    group_id: "",
    blood_type: "",
    date_of_birth: "",
    birth_place: "",
    father_name: "",
    pesel: "",
    member_since: "",
    description: "",
    receives_equivalent: false,
    email: "",
    locality: "",
    street: "",
    house_number: "",
    phone: "",
    periodic_exam_until: "",
    data_processing_consent: false,
  });

  const [trainingForm, setTrainingForm] = useState({
    training_id: "",
    completion_date: "",
  });

  const [languageForm, setLanguageForm] = useState({
    language_id: "",
    proficiency_level: "basic",
  });

  // Fetch firefighters
  const fetchFirefighters = async (groupId?: number) => {
    try {
      setLoading(true);
      let url = `${API_BASE}/firefighters-extended`;
      if (groupId) {
        url += `?group_id=${groupId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setFirefighters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching firefighters:", error);
      Alert.alert("Błąd", "Nie udało się pobrać strażaków");
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [ranksRes, groupsRes, trainingsRes, languagesRes] = await Promise.all([
        fetch(`${API_BASE}/ranks`),
        fetch(`${API_BASE}/groups`),
        fetch(`${API_BASE}/trainings`),
        fetch(`${API_BASE}/languages`),
      ]);

      const [ranksData, groupsData, trainingsData, languagesData] = await Promise.all([
        ranksRes.json(),
        groupsRes.json(),
        trainingsRes.json(),
        languagesRes.json(),
      ]);

      setRanks(Array.isArray(ranksData) ? ranksData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setTrainings(Array.isArray(trainingsData) ? trainingsData : []);
      setLanguages(Array.isArray(languagesData) ? languagesData : []);
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  useEffect(() => {
    fetchFirefighters();
    fetchReferenceData();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showDetailsModal) {
        setShowDetailsModal(false);
        return true;
      }
      if (showTrainingModal) {
        setShowTrainingModal(false);
        return true;
      }
      if (showAddLanguageModal) {
        setShowAddLanguageModal(false);
        return true;
      }
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [showDetailsModal, showTrainingModal, showAddLanguageModal, router]);

  // Add firefighter
  const handleAddFirefighter = async () => {
    if (!firefighterForm.name || !firefighterForm.surname) {
      Alert.alert("Błąd", "Imię i nazwisko są wymagane");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/firefighters-extended`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...firefighterForm,
          rank_id: firefighterForm.rank_id ? parseInt(firefighterForm.rank_id) : null,
          group_id: firefighterForm.group_id ? parseInt(firefighterForm.group_id) : null,
          receives_equivalent: firefighterForm.receives_equivalent ? 1 : 0,
          data_processing_consent: firefighterForm.data_processing_consent ? 1 : 0,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Strażak dodany");
        setActiveTab("list");
        setFirefighterForm({
          name: "",
          surname: "",
          rank_id: "",
          group_id: "",
          blood_type: "",
          date_of_birth: "",
          birth_place: "",
          father_name: "",
          pesel: "",
          member_since: "",
          description: "",
          receives_equivalent: false,
          email: "",
          locality: "",
          street: "",
          house_number: "",
          phone: "",
          periodic_exam_until: "",
          data_processing_consent: false,
        });
        fetchFirefighters();
      } else {
        Alert.alert("Błąd", "Nie udało się dodać strażaka");
      }
    } catch (error) {
      console.error("Error adding firefighter:", error);
      Alert.alert("Błąd", "Nie udało się dodać strażaka");
    }
  };

  // Delete firefighter
  const handleDeleteFirefighter = async (id: number) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć strażaka?", [
      { text: "Anuluj" },
      {
        text: "Usuń",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/firefighters-extended/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              Alert.alert("Sukces", "Strażak usunięty");
              setShowDetailsModal(false);
              fetchFirefighters();
            }
          } catch (error) {
            Alert.alert("Błąd", "Nie udało się usunąć strażaka");
          }
        },
      },
    ]);
  };

  // Add training
  const handleAddTraining = async () => {
    if (!trainingForm.training_id || !selectedFirefighter) {
      Alert.alert("Błąd", "Szkolenie i data są wymagane");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/trainings/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firefighter_id: selectedFirefighter.id,
          training_id: parseInt(trainingForm.training_id),
          completion_date: trainingForm.completion_date || null,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Szkolenie przypisane");
        setShowTrainingModal(false);
        setTrainingForm({ training_id: "", completion_date: "" });
        setShowDetailsModal(false);
        setSelectedFirefighter(null);
        fetchFirefighters();
      } else {
        Alert.alert("Błąd", "Nie udało się przypisać szkolenia");
      }
    } catch (error) {
      console.error("Error adding training:", error);
      Alert.alert("Błąd", "Nie udało się przypisać szkolenia");
    }
  };

  // Add language
  const handleAddLanguage = async () => {
    if (!languageForm.language_id || !selectedFirefighter) {
      Alert.alert("Błąd", "Język jest wymagany");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/languages/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firefighter_id: selectedFirefighter.id,
          language_id: parseInt(languageForm.language_id),
          proficiency_level: languageForm.proficiency_level,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Język przypisany");
        setShowAddLanguageModal(false);
        setLanguageForm({ language_id: "", proficiency_level: "basic" });
        setShowDetailsModal(false);
        setSelectedFirefighter(null);
        fetchFirefighters();
      } else {
        Alert.alert("Błąd", "Nie udało się przypisać języka");
      }
    } catch (error) {
      console.error("Error adding language:", error);
      Alert.alert("Błąd", "Nie udało się przypisać języka");
    }
  };

  // Filter firefighters by group
  const handleGroupFilter = (groupId: number | null) => {
    setSelectedGroup(groupId);
    fetchFirefighters(groupId || undefined);
  };

  const filteredFirefighters = selectedGroup
    ? firefighters.filter(f => f.group_id === selectedGroup)
    : firefighters;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "list" && styles.tabActive]}
          onPress={() => setActiveTab("list")}
        >
          <Text style={[styles.tabText, activeTab === "list" && styles.tabTextActive]}>
            📋 Lista
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "add" && styles.tabActive]}
          onPress={() => setActiveTab("add")}
        >
          <Text style={[styles.tabText, activeTab === "add" && styles.tabTextActive]}>
            ➕ Dodaj
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} keyboardDismissMode="on-drag">
        {activeTab === "list" && (
          <>
            {/* Group Filter */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, !selectedGroup && styles.filterButtonActive]}
                onPress={() => handleGroupFilter(null)}
              >
                <Text style={[styles.filterButtonText, !selectedGroup && styles.filterButtonTextActive]}>
                  Wszyscy
                </Text>
              </TouchableOpacity>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.filterButton, selectedGroup === group.id && styles.filterButtonActive]}
                  onPress={() => handleGroupFilter(group.id)}
                >
                  <Text style={[styles.filterButtonText, selectedGroup === group.id && styles.filterButtonTextActive]}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.headerBackground} style={styles.loader} />
            ) : filteredFirefighters.length === 0 ? (
              <Text style={styles.emptyText}>Brak strażaków</Text>
            ) : (
              filteredFirefighters.map((firefighter) => (
                <TouchableOpacity
                  key={firefighter.id}
                  style={styles.listItem}
                  onPress={() => {
                    setSelectedFirefighter(firefighter);
                    setShowDetailsModal(true);
                  }}
                >
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>
                      {firefighter.surname} {firefighter.name}
                    </Text>
                    <Text style={styles.listItemSubtitle}>
                      {firefighter.rank_name || "Brak stopnia"}
                    </Text>
                    {firefighter.periodic_exam_until && (
                      <Text style={styles.listItemDate}>
                        Badania: {firefighter.periodic_exam_until}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.listItemArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === "add" && (
          <View style={styles.formContainer}>
            <Text style={styles.formSection}>Dane podstawowe</Text>

            <TextInput
              style={styles.input}
              placeholder="Imię"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.name}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Nazwisko"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.surname}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, surname: text })}
            />

            <SelectField
              label="Stopień"
              value={firefighterForm.rank_id}
              options={[
                { label: "Brak", value: "" },
                ...ranks.map((rank: any) => ({ label: rank.name, value: rank.id.toString() })),
              ]}
              onChange={(value: string) => setFirefighterForm({ ...firefighterForm, rank_id: value })}
            />

            <SelectField
              label="Grupa"
              value={firefighterForm.group_id}
              options={[
                { label: "Brak", value: "" },
                ...groups.map((group: any) => ({ label: group.name, value: group.id.toString() })),
              ]}
              onChange={(value: string) => setFirefighterForm({ ...firefighterForm, group_id: value })}
            />

            <TextInput
              style={styles.input}
              placeholder="Grupa krwi"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.blood_type}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, blood_type: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Data urodzenia (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.date_of_birth}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, date_of_birth: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Miejsce urodzenia"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.birth_place}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, birth_place: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Imię ojca"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.father_name}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, father_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="PESEL"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.pesel}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, pesel: text })}
            />

            <Text style={styles.formSection}>Dodatkowe informacje</Text>

            <TextInput
              style={styles.input}
              placeholder="Od kiedy członek (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.member_since}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, member_since: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Opis"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.description}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, description: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFirefighterForm({ ...firefighterForm, receives_equivalent: !firefighterForm.receives_equivalent })}
            >
              <View style={[styles.checkboxBox, firefighterForm.receives_equivalent && styles.checkboxBoxChecked]}>
                {firefighterForm.receives_equivalent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Pobiera ekwiwalent</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.email}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, email: text })}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Telefon"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.phone}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.formSection}>Adres</Text>

            <TextInput
              style={styles.input}
              placeholder="Miejscowość"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.locality}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, locality: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Ulica"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.street}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, street: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Nr domu"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.house_number}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, house_number: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Badania okresowe do (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={firefighterForm.periodic_exam_until}
              onChangeText={(text) => setFirefighterForm({ ...firefighterForm, periodic_exam_until: text })}
            />

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFirefighterForm({ ...firefighterForm, data_processing_consent: !firefighterForm.data_processing_consent })}
            >
              <View style={[styles.checkboxBox, firefighterForm.data_processing_consent && styles.checkboxBoxChecked]}>
                {firefighterForm.data_processing_consent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Zgoda na przetwarzanie danych</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddFirefighter}>
              <Text style={styles.submitButtonText}>Dodaj strażaka</Text>
            </TouchableOpacity>

            <View style={{ height: insets.bottom + 20 }} />
          </View>
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" onRequestClose={() => setShowDetailsModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Szczegóły</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 100 }} keyboardDismissMode="on-drag">
            {selectedFirefighter && (
              <>
                <Text style={styles.detailsTitle}>
                  {selectedFirefighter.surname} {selectedFirefighter.name}
                </Text>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Stopień:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.rank_name || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Grupa:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.group_name || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Grupa krwi:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.blood_type || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Data urodzenia:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.date_of_birth || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Email:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.email || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Telefon:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.phone || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Badania okresowe do:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.periodic_exam_until || "Brak"}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Opis:</Text>
                  <Text style={styles.detailsValue}>{selectedFirefighter.description || "Brak"}</Text>
                </View>

                <Text style={styles.sectionTitle}>Szkolenia</Text>
                {selectedFirefighter.trainings ? (
                  selectedFirefighter.trainings.split(';').filter((t: string) => t).length > 0 ? (
                    selectedFirefighter.trainings.split(';').filter((t: string) => t).map((training: string, idx: number) => (
                      <Text key={idx} style={styles.listValue}>• {training}</Text>
                    ))
                  ) : (
                    <Text style={styles.emptyValue}>Brak szkoleń</Text>
                  )
                ) : (
                  <Text style={styles.emptyValue}>Brak szkoleń</Text>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowTrainingModal(true)}
                >
                  <Text style={styles.actionButtonText}>Dodaj szkolenie</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Języki</Text>
                {selectedFirefighter.languages ? (
                  selectedFirefighter.languages.split(';').filter((l: string) => l).length > 0 ? (
                    selectedFirefighter.languages.split(';').filter((l: string) => l).map((language: string, idx: number) => (
                      <Text key={idx} style={styles.listValue}>• {language}</Text>
                    ))
                  ) : (
                    <Text style={styles.emptyValue}>Brak języków</Text>
                  )
                ) : (
                  <Text style={styles.emptyValue}>Brak języków</Text>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowAddLanguageModal(true)}
                >
                  <Text style={styles.actionButtonText}>Dodaj język</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteFirefighter(selectedFirefighter.id)}
                >
                  <Text style={styles.deleteButtonText}>Usuń strażaka</Text>
                </TouchableOpacity>

                <View style={{ height: insets.bottom + 20 }} />
              </>
            )}
          </ScrollView>

          <View style={[styles.modalActions, { paddingBottom: insets.bottom + 15 }]}>
            <TouchableOpacity style={styles.modalCloseButtonLarge} onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalCloseButtonLargeText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Training Modal */}
      <Modal visible={showTrainingModal} animationType="slide" onRequestClose={() => setShowTrainingModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTrainingModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dodaj szkolenie</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 100 }} keyboardDismissMode="on-drag">
            <SelectField
              label="Szkolenie"
              value={trainingForm.training_id}
              options={[
                { label: "Wybierz szkolenie", value: "" },
                ...trainings.map((training: any) => ({ label: training.name, value: training.id.toString() })),
              ]}
              onChange={(value: string) => setTrainingForm({ ...trainingForm, training_id: value })}
            />

            <TextInput
              style={styles.input}
              placeholder="Data ukończenia (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={trainingForm.completion_date}
              onChangeText={(text) => setTrainingForm({ ...trainingForm, completion_date: text })}
            />
          </ScrollView>

          <View style={[styles.modalActions, { paddingBottom: insets.bottom + 15 }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTrainingModal(false)}>
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleAddTraining}>
              <Text style={styles.submitButtonText}>Dodaj</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showAddLanguageModal} animationType="slide" onRequestClose={() => setShowAddLanguageModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddLanguageModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dodaj język</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 100 }} keyboardDismissMode="on-drag">
            <SelectField
              label="Język"
              value={languageForm.language_id}
              options={[
                { label: "Wybierz język", value: "" },
                ...languages.map((language: any) => ({ label: language.name, value: language.id.toString() })),
              ]}
              onChange={(value: string) => setLanguageForm({ ...languageForm, language_id: value })}
            />

            <SelectField
              label="Poziom zaawansowania"
              value={languageForm.proficiency_level}
              options={[
                { label: "Podstawowy", value: "basic" },
                { label: "Średniozaawansowany", value: "intermediate" },
                { label: "Zaawansowany", value: "advanced" },
                { label: "Płynny", value: "fluent" },
              ]}
              onChange={(value: string) => setLanguageForm({ ...languageForm, proficiency_level: value })}
            />
          </ScrollView>

          <View style={[styles.modalActions, { paddingBottom: insets.bottom + 15 }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddLanguageModal(false)}>
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleAddLanguage}>
              <Text style={styles.submitButtonText}>Dodaj</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.headerBackground,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  loader: {
    marginVertical: 50,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    marginVertical: 30,
    fontSize: 16,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  listItemArrow: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: 10,
  },
  formContainer: {
    padding: 10,
  },
  formSection: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 4,
  },
  picker: {
    backgroundColor: colors.headerBackground,
    borderRadius: 6,
    color: colors.text,
  },
  selectButton: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  selectButtonArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  selectModalContent: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 8,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  selectOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDivider,
  },
  selectOptionActive: {
    backgroundColor: colors.primary,
  },
  selectOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.textMuted,
  },
  modalCloseButton: {
    fontSize: 24,
    color: colors.text,
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 15,
  },
  detailsSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBackground,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  detailsValue: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  listValue: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    marginLeft: 10,
  },
  emptyValue: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    marginTop: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: colors.headerBackground,
    borderTopWidth: 1,
    borderTopColor: colors.textMuted,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.textMuted,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalCloseButtonLarge: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseButtonLargeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
