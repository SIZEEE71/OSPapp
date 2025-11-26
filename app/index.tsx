import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSimPhoneNumber } from "./hooks/useSimPhoneNumber";
import colors from "./theme";

export default function Index() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [fighters, setFighters] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { phoneNumber, firefighterId: simFirefighterId, loading: simLoading, error: simError } = useSimPhoneNumber();

  useEffect(() => {
    let mounted = true;
    async function fetchFighters() {
      try {
        setLoading(true);
        const res = await fetch('http://qubis.pl:4000/api/firefighters');
        const data = await res.json();
        if (!mounted) return;
        setFighters(Array.isArray(data) ? data.map((d: any) => ({ id: d.id, name: d.name })) : []);
        setError(null);
      } catch (err: any) {
        console.log('GET API error:', err);
        if (!mounted) return;
        setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFighters();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-login when SIM firefighter is found
  useEffect(() => {
    if (simFirefighterId && !simLoading) {
      setSelected(simFirefighterId);
      // Auto enter after 500ms
      setTimeout(() => {
        router.push({ pathname: ("/home" as any), params: { firefighterId: String(simFirefighterId) } });
      }, 500);
    }
  }, [simFirefighterId, simLoading]);

  async function onEnter() {
    if (!selected) return;
    router.push({ pathname: ("/home" as any), params: { firefighterId: String(selected) } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Firefighter</Text>

      {simLoading && <Text style={styles.simStatus}>Checking SIM...</Text>}
      {phoneNumber && !simFirefighterId && <Text style={styles.simStatus}>Phone: {phoneNumber}</Text>}
      {simError && <Text style={styles.simError}>SIM Error: {simError}</Text>}
      {simFirefighterId && <Text style={styles.simSuccess}>Auto-logging...</Text>}

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel="Open firefighter list"
        disabled={simLoading || !!simFirefighterId}
      >
        <Text>{selected ? (fighters.find((f) => f.id === selected)?.name ?? 'Selected') : (loading ? 'Loading...' : 'Choose...')}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.list}>
          {loading && <Text style={{ padding: 12, color: colors.text }}>Loading...</Text>}
          {error && <Text style={{ padding: 12, color: colors.textMuted }}>Error: {error}</Text>}
          {!loading && !error && fighters.length === 0 && (
            <Text style={{ padding: 12, color: colors.text }}>No firefighters found</Text>
          )}
          {!loading && !error && fighters.map((f) => (
            <TouchableOpacity
              key={String(f.id)}
              style={styles.item}
              onPress={() => {
                setSelected(f.id);
                setOpen(false);
              }}
            >
              <Text>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.enter, !selected && styles.enterDisabled]}
        onPress={onEnter}
        disabled={!selected || simLoading || !!simFirefighterId}
      >
        <Text style={styles.enterText}>ENTER</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  label: { fontSize: 18, marginBottom: 8, color: colors.text },
  selector: {
    width: "100%",
    maxWidth: 360,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: "flex-start",
  },
  list: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 6,
    marginTop: 8,
    backgroundColor: colors.surface,
  },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider },
  enter: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  enterDisabled: { backgroundColor: colors.disabled },
  enterText: { color: colors.text, fontWeight: "600" },
  simStatus: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  simError: { fontSize: 12, color: '#dc3545', marginBottom: 8 },
  simSuccess: { fontSize: 12, color: '#28a745', marginBottom: 8, fontWeight: '600' },
});

