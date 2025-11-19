import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "./theme";

export default function Index() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fighters, setFighters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchFighters() {
      try {
        setLoading(true);
        const res = await fetch('http://qubis.pl:4000/api/firefighters');
        const data = await res.json();
        console.log('GET /api/firefighters response:', data);
        if (!mounted) return;
        // data expected to be array of { id, name, created_at }
        setFighters(Array.isArray(data) ? data.map((d: any) => d.name) : []);
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

  async function onEnter() {
    if (!selected) return;
    try {
      const res = await fetch('http://qubis.pl:4000/api/firefighters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected }),
      });
      const data = await res.json();
      console.log('POST /api/firefighters response:', data);
    } catch (err) {
      console.log('POST API error:', err);
    }

    router.push({ pathname: ("/home" as any), params: { firefighter: selected } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Firefighter</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel="Open firefighter list"
      >
        <Text>{selected ?? (loading ? 'Loading...' : 'Choose...')}</Text>
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
              key={f}
              style={styles.item}
              onPress={() => {
                setSelected(f);
                setOpen(false);
              }}
            >
              <Text>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.enter, !selected && styles.enterDisabled]}
        onPress={onEnter}
        disabled={!selected}
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
});
