import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles/ustawienia_styles";
import colors from "./theme";

interface Settings {
  notificationsEnabled: boolean;
  locationTrackingEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: boolean;
  autoRefresh: boolean;
}

export default function Ustawienia() {
  const router = useRouter();
  const { firefighterId } = useLocalSearchParams() as { firefighterId?: string };
  const [settings, setSettings] = useState<Settings>({
    notificationsEnabled: true,
    locationTrackingEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: false,
    autoRefresh: true,
  });

  // Załaduj ustawienia przy starcie
  useEffect(() => {
    loadSettings();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      // Ustaw domyślny kanał powiadomień
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#d32f2f",
      });

      // Ustaw handler dla przychodzących powiadomień
      const subscription = Notifications.addNotificationResponseClearedListener(
        () => {
          console.log("Notification cleared");
        }
      );

      return () => subscription.remove();
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("appSettings");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem("appSettings", JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Requestuj permisję do powiadomień
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7F",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  // Requestuj permisję do lokalizacji
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  // Obsłuż zmianę powiadomień
  const handleNotificationsToggle = async () => {
    const newValue = !settings.notificationsEnabled;
    if (newValue) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert("Błąd", "Nie udało się uzyskać permisji do powiadomień");
        return;
      }
    }
    const newSettings = { ...settings, notificationsEnabled: newValue };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Obsłuż zmianę lokalizacji
  const handleLocationToggle = async () => {
    const newValue = !settings.locationTrackingEnabled;
    if (newValue) {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert("Błąd", "Nie udało się uzyskać permisji do lokalizacji");
        return;
      }
    }
    const newSettings = { ...settings, locationTrackingEnabled: newValue };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Obsłuż zmianę dźwięku
  const handleSoundToggle = () => {
    const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Obsłuż zmianę wibracji
  const handleVibrationToggle = () => {
    const newValue = !settings.vibrationEnabled;
    if (newValue) {
      Vibration.vibrate(100);
    }
    const newSettings = { ...settings, vibrationEnabled: newValue };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Obsłuż zmianę auto-odświeżania
  const handleAutoRefreshToggle = () => {
    const newSettings = { ...settings, autoRefresh: !settings.autoRefresh };
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, [router]);

  const handleReset = () => {
    Alert.alert(
      "Resetuj ustawienia",
      "Przywrócić ustawienia domyślne?",
      [
        { text: "Anuluj" },
        {
          text: "Resetuj",
          onPress: () => {
            const defaultSettings = {
              notificationsEnabled: true,
              locationTrackingEnabled: true,
              soundEnabled: true,
              vibrationEnabled: true,
              darkMode: false,
              autoRefresh: true,
            };
            setSettings(defaultSettings);
            saveSettings(defaultSettings);
            Alert.alert("Sukces", "Ustawienia zostały zresetowane");
          },
        },
      ]
    );
  };

  const SettingItem = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string;
    description: string;
    value: boolean;
    onChange: () => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.disabled, true: colors.primary }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: -27 }}>
      <View style={[styles.header]}>
        <Text style={styles.headerTitle}>⚙️ Ustawienia</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Powiadomienia</Text>
          <SettingItem
            label="Powiadomienia push"
            description="Otrzymuj alerty o nowych alarmach"
            value={settings.notificationsEnabled}
            onChange={handleNotificationsToggle}
          />
          <SettingItem
            label="Dźwięk"
            description="Odtwarzaj dźwięk przy powiadomieniach"
            value={settings.soundEnabled}
            onChange={handleSoundToggle}
          />
          <SettingItem
            label="Wibracja"
            description="Wibruj przy powiadomieniach"
            value={settings.vibrationEnabled}
            onChange={handleVibrationToggle}
          />
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Lokalizacja</Text>
          <SettingItem
            label="Śledzenie lokalizacji"
            description="Dziel swoją lokalizację z zespołem"
            value={settings.locationTrackingEnabled}
            onChange={handleLocationToggle}
          />
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Wygląd</Text>
          <SettingItem
            label="Tryb ciemny"
            description="Używaj ciemnego motywu (niedostępny)"
            value={settings.darkMode}
            onChange={() => Alert.alert("Info", "Tryb ciemny będzie dostępny wkrótce")}
          />
        </View>

        {/* Performance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Wydajność</Text>
          <SettingItem
            label="Auto-odświeżanie"
            description="Automatycznie odświeżaj dane"
            value={settings.autoRefresh}
            onChange={handleAutoRefreshToggle}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informacje</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Wersja aplikacji</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Twoja drużyna</Text>
            <Text style={styles.infoValue}>Ochotnicza Straż Pożarna</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>🔄 Resetuj ustawienia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                "Wyloguj się",
                "Na pewno chcesz się wylogować?",
                [
                  { text: "Anuluj" },
                  {
                    text: "Wyloguj",
                    onPress: () => {
                      router.replace("/");
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.logoutButtonText}>🚪 Wyloguj się</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Back Button */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Powrót</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
