import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocationTracking } from "./hooks/useLocationTracking";
import colors from "./theme";

export default function Home() {
  const router = useRouter();
  const { firefighterId } = useLocalSearchParams() as { firefighterId?: string };
  const [firefighterName, setFirefighterName] = useState<string | null>(null);

  // Track location for this firefighter
  useLocationTracking({
    firefighterId: firefighterId ? parseInt(firefighterId, 10) : 0,
    enabled: !!firefighterId,
  });

  useEffect(() => {
    let mounted = true;
    async function loadName() {
      if (!firefighterId) {
        setFirefighterName(null);
        return;
      }
      try {
        const res = await fetch('http://qubis.pl:4000/api/firefighters');
        const list = await res.json();
        if (!mounted) return;
        if (Array.isArray(list)) {
          const f = list.find((x: any) => String(x.id) === String(firefighterId));
          setFirefighterName(f ? f.name : null);
        }
      } catch (err) {
        console.warn('Could not load firefighter names', err);
      }
    }
    loadName();
    return () => { mounted = false; };
  }, [firefighterId]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>Selected: {firefighterName ?? firefighterId ?? "None"}</Text>
      <View style={styles.grid}>
        {[
          { key: "wyposazenie", label: "Wyposażenie", icon: "🧰" },
          { key: "mapa", label: "Mapa", icon: "🗺️" },
          { key: "alarmy", label: "Alarmy", icon: "🚨" },
          { key: "raporty", label: "Raporty", icon: "📄" },
          { key: "powiadomienia", label: "Powiadomienia", icon: "🔔" },
          { key: "ustawienia", label: "Ustawienia", icon: "⚙️" },
          { key: "pojazdy-sprzet", label: "Pojazdy i sprzęt", icon: "🚒" },
          { key: "strazacy", label: "Strażacy", icon: "👩‍🚒" },
        ].map((tile) => (
          <TouchableOpacity
            key={tile.key}
            style={styles.tile}
            onPress={() => router.push({ pathname: (`/${tile.key}` as unknown) as any, params: firefighterId ? { firefighterId } : {} })}
          >
            <Text style={styles.tileIcon}>{tile.icon}</Text>
            <Text style={styles.tileLabel}>{tile.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8, color: colors.text },
  subtitle: { fontSize: 18, marginBottom: 12, color: colors.textMuted },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  tile: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tileIcon: { fontSize: 34, marginBottom: 8 },
  tileLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  back: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.primary },
  backText: { color: colors.text, fontWeight: "600" },
});
