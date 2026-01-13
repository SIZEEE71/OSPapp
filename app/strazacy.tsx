import { useRouter } from "expo-router";
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
import styles from "./styles/strazacy_styles";
import colors from "./theme";

type TabType = "list" | "add" | "trainings" | "finance" | "contributions";
type Firefighter = any;
type Rank = any;
type Group = any;
type Training = any;
type Language = any;
type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};


// Format date to YYYY-MM-DD (remove time)
function formatDate(dateString: string): string {
  if (!dateString) return "";
  return dateString.split('T')[0];
}

function getTodayLocalDate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
}

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

  // Finance state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "Paliwo",
    date: getTodayLocalDate(),
  });

  // Contributions state
  const [contributionsFilter, setContributionsFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [selectedFirefighterForContribution, setSelectedFirefighterForContribution] = useState<Firefighter | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionForm, setContributionForm] = useState({
    contributions_paid: false,
    contributions_paid_date: getTodayLocalDate(),
  });

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
    proficiency_level: "",
  });

  // Fetch firefighters
  const fetchFirefighters = async (groupId?: number) => {
    try {
      setLoading(true);
      let url = API_ENDPOINTS.firefighters.extendedList;
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
        fetch(API_ENDPOINTS.ranks.list),
        fetch(API_ENDPOINTS.groups.list),
        fetch(API_ENDPOINTS.trainings.list),
        fetch(API_ENDPOINTS.languages.list),
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
      if (showContributionModal) {
        setShowContributionModal(false);
        return true;
      }
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [showDetailsModal, showTrainingModal, showAddLanguageModal, showContributionModal, router]);

  // Add firefighter
  const handleAddFirefighter = async () => {
    if (!firefighterForm.name || !firefighterForm.surname) {
      Alert.alert("Błąd", "Imię i nazwisko są wymagane");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.firefighters.extendedList, {
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
            const res = await fetch(API_ENDPOINTS.firefighters.extendedGet(id), {
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
      const res = await fetch(API_ENDPOINTS.trainings.assign, {
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
      const res = await fetch(API_ENDPOINTS.languages.assign, {
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
        setLanguageForm({ language_id: "", proficiency_level: "" });
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

  // Add expense
  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) {
      Alert.alert("Błąd", "Opis i kwota są wymagane");
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseForm({
      description: "",
      amount: "",
      category: "Paliwo",
      date: getTodayLocalDate(),
    });
    Alert.alert("Sukces", "Wydatek dodany");
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    Alert.alert("Potwierdzenie", "Na pewno usunąć ten wydatek?", [
      { text: "Anuluj", onPress: () => {} },
      {
        text: "Usuń",
        onPress: () => {
          setExpenses(expenses.filter(e => e.id !== id));
          Alert.alert("Sukces", "Wydatek usunięty");
        },
      },
    ]);
  };

  // Calculate totals by category
  const expensesByCategory = expenses.reduce((acc: any, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Update contribution status
  const handleUpdateContribution = async () => {
    if (!selectedFirefighterForContribution) return;

    try {
      const res = await fetch(API_ENDPOINTS.firefighters.extendedGet(selectedFirefighterForContribution.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributions_paid: contributionForm.contributions_paid ? 1 : 0,
          contributions_paid_date: contributionForm.contributions_paid ? contributionForm.contributions_paid_date : null,
        }),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Status składek zaktualizowany");
        setShowContributionModal(false);
        setSelectedFirefighterForContribution(null);
        setContributionForm({
          contributions_paid: false,
          contributions_paid_date: getTodayLocalDate(),
        });
        fetchFirefighters(selectedGroup || undefined);
      } else {
        Alert.alert("Błąd", "Nie udało się zaktualizować statusu");
      }
    } catch (error) {
      console.error("Error updating contribution:", error);
      Alert.alert("Błąd", "Nie udało się zaktualizować statusu");
    }
  };

  // Filter firefighters by contribution status
  const getFilteredFirefightersByContribution = () => {
    const baseFiltered = selectedGroup
      ? firefighters.filter(f => f.group_id === selectedGroup)
      : firefighters;

    if (contributionsFilter === "unpaid") {
      return baseFiltered.filter(f => !f.contributions_paid);
    } else if (contributionsFilter === "paid") {
      return baseFiltered.filter(f => f.contributions_paid);
    }
    return baseFiltered;
  };

  const filteredFirefighters = selectedGroup
    ? firefighters.filter(f => f.group_id === selectedGroup)
    : firefighters;

  return (
    <SafeAreaView style={styles.container}>
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
        <TouchableOpacity
          style={[styles.tab, activeTab === "contributions" && styles.tabActive]}
          onPress={() => setActiveTab("contributions")}
        >
          <Text style={[styles.tabText, activeTab === "contributions" && styles.tabTextActive]}>
            💳 Składki
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "finance" && styles.tabActive]}
          onPress={() => setActiveTab("finance")}
        >
          <Text style={[styles.tabText, activeTab === "finance" && styles.tabTextActive]}>
            💰 Finanse
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {(activeTab === "list" || activeTab === "add") && (
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
                        Badania: {formatDate(firefighter.periodic_exam_until)}
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

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddFirefighter}>
              <Text style={styles.saveBtnText}>Dodaj strażaka</Text>
            </TouchableOpacity>

            <View style={{ height: insets.bottom + 20 }} />
          </View>
        )}
        </ScrollView>
      )}

      {activeTab === "contributions" && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardDismissMode="on-drag"
        >
          <View style={styles.formContainer}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, contributionsFilter === "all" && styles.filterButtonActive]}
                onPress={() => setContributionsFilter("all")}
              >
                <Text style={[styles.filterButtonText, contributionsFilter === "all" && styles.filterButtonTextActive]}>
                  Wszyscy ({firefighters.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, contributionsFilter === "unpaid" && styles.filterButtonActive]}
                onPress={() => setContributionsFilter("unpaid")}
              >
                <Text style={[styles.filterButtonText, contributionsFilter === "unpaid" && styles.filterButtonTextActive]}>
                  Nieopłacone ({firefighters.filter(f => !f.contributions_paid).length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, contributionsFilter === "paid" && styles.filterButtonActive]}
                onPress={() => setContributionsFilter("paid")}
              >
                <Text style={[styles.filterButtonText, contributionsFilter === "paid" && styles.filterButtonTextActive]}>
                  Opłacone ({firefighters.filter(f => f.contributions_paid).length})
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.headerBackground} style={styles.loader} />
            ) : getFilteredFirefightersByContribution().length === 0 ? (
              <Text style={styles.emptyText}>Brak strażaków</Text>
            ) : (
              getFilteredFirefightersByContribution().map((firefighter) => (
                <TouchableOpacity
                  key={firefighter.id}
                  style={[
                    styles.contributionItem,
                    firefighter.contributions_paid ? styles.contributionItemPaid : styles.contributionItemUnpaid,
                  ]}
                  onPress={() => {
                    setSelectedFirefighterForContribution(firefighter);
                    setContributionForm({
                      contributions_paid: firefighter.contributions_paid || false,
                      contributions_paid_date: firefighter.contributions_paid_date || getTodayLocalDate(),
                    });
                    setShowContributionModal(true);
                  }}
                >
                  <View style={styles.contributionContent}>
                    <Text style={styles.contributionName}>
                      {firefighter.surname} {firefighter.name}
                    </Text>
                    <Text style={styles.contributionStatus}>
                      {firefighter.contributions_paid ? (
                        <>
                          ✓ Opłacone: {formatDate(firefighter.contributions_paid_date) || "Brak daty"}
                        </>
                      ) : (
                        "⚠ Nieopłacone"
                      )}
                    </Text>
                  </View>
                  <Text style={styles.listItemArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

      )}

      {activeTab === "finance" && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardDismissMode="on-drag"
        >
          <View style={styles.formContainer}>
            <Text style={styles.formSection}>💰 System Finansowy</Text>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Razem wydatków</Text>
                <Text style={styles.summaryAmount}>{totalExpenses.toFixed(2)} zł</Text>
              </View>
              <View style={[styles.summaryCard, styles.summaryCardBudget]}>
                <Text style={styles.summaryLabel}>Budżet</Text>
                <Text style={styles.summaryAmount}>{totalBudget.toFixed(2)} zł</Text>
              </View>
            </View>

            {/* Remaining Budget */}
            <View style={styles.remainingContainer}>
              <Text style={styles.remainingLabel}>
                Pozostało: <Text style={styles.remainingAmount}>{(totalBudget - totalExpenses).toFixed(2)} zł</Text>
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((totalExpenses / totalBudget) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>

            <Text style={styles.formSection}>Dodaj wydatek</Text>

            <TextInput
              style={styles.input}
              placeholder="Opis wydatku"
              placeholderTextColor={colors.textMuted}
              value={expenseForm.description}
              onChangeText={(text) => setExpenseForm({ ...expenseForm, description: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Kwota (zł)"
              placeholderTextColor={colors.textMuted}
              value={expenseForm.amount}
              onChangeText={(text) => setExpenseForm({ ...expenseForm, amount: text })}
              keyboardType="decimal-pad"
            />

            <SelectField
              label="Kategoria"
              value={expenseForm.category}
              options={[
                { label: "Paliwo", value: "Paliwo" },
                { label: "Konserwacja", value: "Konserwacja" },
                { label: "Części zamienne", value: "Części zamienne" },
                { label: "Ubezpieczenie", value: "Ubezpieczenie" },
                { label: "Wyposażenie", value: "Wyposażenie" },
                { label: "Szkolenia", value: "Szkolenia" },
                { label: "Inne", value: "Inne" },
              ]}
              onChange={(value: string) => setExpenseForm({ ...expenseForm, category: value })}
            />

            <TextInput
              style={styles.input}
              placeholder="Data (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={expenseForm.date}
              onChangeText={(text) => setExpenseForm({ ...expenseForm, date: text })}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense}>
              <Text style={styles.saveBtnText}>Dodaj wydatek</Text>
            </TouchableOpacity>

            {/* Budget Input */}
            <Text style={styles.formSection}>Ustaw budżet</Text>
            <TextInput
              style={styles.input}
              placeholder="Roczny budżet (zł)"
              placeholderTextColor={colors.textMuted}
              value={totalBudget.toString()}
              onChangeText={(text) => setTotalBudget(parseFloat(text) || 0)}
              keyboardType="decimal-pad"
            />

            {/* Expenses by Category */}
            <Text style={styles.formSection}>Wydatki wg kategorii</Text>
            {Object.keys(expensesByCategory).length > 0 ? (
              Object.entries(expensesByCategory).map(([category, amount]: [string, any]) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>{category}</Text>
                  <Text style={styles.categoryAmount}>{amount.toFixed(2)} zł</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyValue}>Brak wydatków</Text>
            )}

            {/* All Expenses */}
            <Text style={styles.formSection}>Wszystkie wydatki</Text>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseDate}>{expense.date} • {expense.category}</Text>
                  </View>
                  <View style={styles.expenseActions}>
                    <Text style={styles.expenseAmount}>{expense.amount.toFixed(2)} zł</Text>
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => handleDeleteExpense(expense.id)}
                    >
                      <Text style={styles.deleteIconText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyValue}>Brak wydatków</Text>
            )}
          </View>
        </ScrollView>
      )}

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
                  <Text style={styles.detailsValue}>{formatDate(selectedFirefighter.date_of_birth) || "Brak"}</Text>
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
                  <Text style={styles.detailsValue}>{selectedFirefighter.periodic_exam_until ? formatDate(selectedFirefighter.periodic_exam_until) : "Brak"}</Text>
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

  
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.cancelBtnText}>Zamknij</Text>
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

          <View style={[styles.modalActions]}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddTraining}>
              <Text style={styles.saveBtnText}>Dodaj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTrainingModal(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
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
                { label: "Podstawowy", value: "Podstawowy" },
                { label: "Średniozaawansowany", value: "Średniozaawansowany" },
                { label: "Zaawansowany", value: "Zaawansowany" },
                { label: "Płynny", value: "Płynny" },
              ]}
              onChange={(value: string) => setLanguageForm({ ...languageForm, proficiency_level: value })}
            />
          </ScrollView>

          <View style={[styles.modalActions]}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddLanguage}>
              <Text style={styles.saveBtnText}>Dodaj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddLanguageModal(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Contribution Modal */}
      <Modal visible={showContributionModal} animationType="slide" onRequestClose={() => setShowContributionModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowContributionModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Status składek</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 100 }} keyboardDismissMode="on-drag">
            {selectedFirefighterForContribution && (
              <>
                <Text style={styles.detailsTitle}>
                  {selectedFirefighterForContribution.surname} {selectedFirefighterForContribution.name}
                </Text>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setContributionForm({ ...contributionForm, contributions_paid: !contributionForm.contributions_paid })}
                >
                  <View style={[styles.checkboxBox, contributionForm.contributions_paid && styles.checkboxBoxChecked]}>
                    {contributionForm.contributions_paid && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Składki opłacone</Text>
                </TouchableOpacity>

                {contributionForm.contributions_paid && (
                  <>
                    <Text style={styles.formSection}>Data opłacenia</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Data (YYYY-MM-DD)"
                      placeholderTextColor={colors.textMuted}
                      value={contributionForm.contributions_paid_date}
                      onChangeText={(text) => setContributionForm({ ...contributionForm, contributions_paid_date: text })}
                    />
                  </>
                )}

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <Text style={[styles.detailsValue, contributionForm.contributions_paid ? styles.statusPaid : styles.statusUnpaid]}>
                    {contributionForm.contributions_paid ? "✓ Opłacone" : "⚠ Nieopłacone"}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateContribution}>
              <Text style={styles.saveBtnText}>Zapisz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowContributionModal(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

