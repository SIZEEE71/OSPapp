import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    BackHandler,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, [router]);

  const toggleSetting = (key: keyof Settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    Alert.alert(
      "Resetuj ustawienia",
      "Przywrócić ustawienia domyślne?",
      [
        { text: "Anuluj" },
        {
          text: "Resetuj",
          onPress: () => {
            setSettings({
              notificationsEnabled: true,
              locationTrackingEnabled: true,
              soundEnabled: true,
              vibrationEnabled: true,
              darkMode: false,
              autoRefresh: true,
            });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
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
            onChange={() => toggleSetting("notificationsEnabled")}
          />
          <SettingItem
            label="Dźwięk"
            description="Odtwarzaj dźwięk przy powiadomieniach"
            value={settings.soundEnabled}
            onChange={() => toggleSetting("soundEnabled")}
          />
          <SettingItem
            label="Wibracja"
            description="Wibruj przy powiadomieniach"
            value={settings.vibrationEnabled}
            onChange={() => toggleSetting("vibrationEnabled")}
          />
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Lokalizacja</Text>
          <SettingItem
            label="Śledzenie lokalizacji"
            description="Dziel swoją lokalizację z zespołem"
            value={settings.locationTrackingEnabled}
            onChange={() => toggleSetting("locationTrackingEnabled")}
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
            onChange={() => toggleSetting("autoRefresh")}
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
