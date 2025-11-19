import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "./theme";

export default function Home() {
  const router = useRouter();
  const { firefighter } = useLocalSearchParams() as { firefighter?: string };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Page</Text>
      <Text style={styles.subtitle}>Selected: {firefighter ?? "None"}</Text>

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8, color: colors.text },
  subtitle: { fontSize: 18, marginBottom: 20, color: colors.textMuted },
  back: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.primary },
  backText: { color: colors.text, fontWeight: "600" },
});
