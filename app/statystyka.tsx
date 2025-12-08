import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "./config/api";
import styles from "./styles/statystyka_styles";
import colors from "./theme";

interface AlarmStatByType {
  type: string;
  count: number;
}

interface AlarmStats {
  total: number;
  byType: AlarmStatByType[];
}

interface FirefighterStat {
  id: number;
  name: string;
  surname: string;
  crew_count: number;
}

export default function Statystyka() {
  const router = useRouter();
  const [alarmStats, setAlarmStats] = useState<AlarmStats>({ total: 0, byType: [] });
  const [firefighterStats, setFirefighterStats] = useState<FirefighterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"types" | "firefighters">("types");

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const [typeRes, firefighterRes] = await Promise.all([
        fetch(API_ENDPOINTS.alarms.statsByType),
        fetch(API_ENDPOINTS.alarms.statsFirefighters),
      ]);

      const typeData = await typeRes.json();
      const firefighterData = await firefighterRes.json();

      setAlarmStats(typeData || { total: 0, byType: [] });
      setFirefighterStats(Array.isArray(firefighterData) ? firefighterData : []);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      Alert.alert("Błąd", "Nie udało się pobrać statystyk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Statystyka</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "types" && styles.tabActive]}
          onPress={() => setActiveTab("types")}
        >
          <Text style={[styles.tabText, activeTab === "types" && styles.tabTextActive]}>
            📍 Po typach
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "firefighters" && styles.tabActive]}
          onPress={() => setActiveTab("firefighters")}
        >
          <Text style={[styles.tabText, activeTab === "firefighters" && styles.tabTextActive]}>
            👥 Strażacy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.headerBackground}
          style={styles.loader}
        />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {activeTab === "types" ? (
            // Alarms by type
            <View style={styles.section}>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Razem wyjazdów:</Text>
                <Text style={styles.totalValue}>{alarmStats.total}</Text>
              </View>

              <Text style={styles.sectionTitle}>Podział wg typów alarmów</Text>
              {alarmStats.byType.length === 0 ? (
                <Text style={styles.emptyText}>Brak danych</Text>
              ) : (
                alarmStats.byType.map((stat, index) => (
                  <View key={index} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statLabel}>{stat.type}</Text>
                      <Text style={styles.statValue}>{stat.count} wyjazdów</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              (stat.count / Math.max(...alarmStats.byType.map((s) => s.count))) * 100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            // Firefighters in crew
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Załoga wpisana w alarmy</Text>
              {firefighterStats.length === 0 ? (
                <Text style={styles.emptyText}>Brak danych</Text>
              ) : (
                firefighterStats.map((stat) => (
                  <View key={stat.id} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statLabel}>
                        {stat.name} {stat.surname}
                      </Text>
                      <Text style={styles.statValue}>{stat.crew_count}x</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              (stat.crew_count / Math.max(...firefighterStats.map((s) => s.crew_count))) * 100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Back button */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Powrót</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
