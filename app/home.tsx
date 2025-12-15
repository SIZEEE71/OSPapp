import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlarmContext } from "./context/AlarmContext";
import { useLocationTracking } from "./hooks/useLocationTracking";
import styles from "./styles/home_styles";
import colors from "./theme";

export default function Home() {
  const router = useRouter();
  const { firefighterId } = useLocalSearchParams() as { firefighterId?: string };
  const [firefighterName, setFirefighterName] = useState<string | null>(null);
  const [firefighterSurname, setFirefighterSurname] = useState<string | null>(null);
  const { shouldShareLocation } = useAlarmContext();

  // Track location for this firefighter
  useLocationTracking({
    firefighterId: firefighterId ? parseInt(firefighterId, 10) : 0,
    enabled: !!firefighterId && shouldShareLocation,
  });

  // Save firefighterId to AsyncStorage when user logs in
  useEffect(() => {
    if (firefighterId) {
      AsyncStorage.setItem('activeFirefighterId', firefighterId).catch(err =>
        console.warn('Failed to save firefighterId:', err)
      );
    }
  }, [firefighterId]);


  useEffect(() => {
    let mounted = true;
    async function loadName() {
      if (!firefighterId) {
        setFirefighterName(null);
        return;
      }
      try {
        const res = await fetch('http://qubis.pl:4000/api/firefighters-extended');
        const list = await res.json();
        if (!mounted) return;
        if (Array.isArray(list)) {
          const f = list.find((x: any) => String(x.id) === String(firefighterId));
          setFirefighterName(f ? f.name : null);
          setFirefighterSurname(f ? f.surname : null);
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
        <Text style={styles.subtitle}>
          {firefighterName && firefighterSurname ? `${firefighterName} ${firefighterSurname}` : firefighterId ?? "Brak wybranego strażaka"}
        </Text>
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

