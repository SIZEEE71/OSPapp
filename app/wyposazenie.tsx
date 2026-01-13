import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_ENDPOINTS } from "./config/api";
import colors from "./theme";

type Condition = "Nowy" | "Dobry" | "Zuzyty";

// Categories and items are dynamic and come from the server via
// GET /api/equipment/categories and GET /api/equipment/items (or
// GET /api/firefighters/:id/equipment which includes category_slug).
// We keep the Condition type locally for UI consistency.

export default function Wyposazenie() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paramFirefighterId = params.firefighterId ? Number(params.firefighterId) : null;

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<{ cat: string; idx: number } | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [firefighterId, setFirefighterId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // fetch categories and items (catalog) in parallel
        const [catsRes, itemsRes] = await Promise.all([
          fetch(API_ENDPOINTS.equipment.categories),
          fetch(API_ENDPOINTS.equipment.items),
        ]);

        const catsBody = await catsRes.json().catch(() => []);
        const itemsBody = await itemsRes.json().catch(() => []);

        const cats = Array.isArray(catsBody) ? catsBody : [];
        if (mounted) setCategories(cats);
        if (!selectedCategory && cats.length > 0) setSelectedCategory(cats[0].slug);

        // build map of category_id -> slug (if server provides ids)
        const catIdToSlug: Record<string | number, string> = {};
        for (const c of cats) {
          if (c.id !== undefined && c.slug) catIdToSlug[c.id] = c.slug;
        }

        // build base catalog grouped by category slug
        const base: Record<string, any[]> = {};
        for (const it of Array.isArray(itemsBody) ? itemsBody : []) {
          const slug = it.category_slug ?? (it.category_id !== undefined ? catIdToSlug[it.category_id] : undefined) ?? 'uncategorized';
          if (!base[slug]) base[slug] = [];
          base[slug].push({ key: it.item_key, label: it.label, selected: false, quantity: 1, condition: 'Dobry', notes: '' });
        }

        // ensure all category slugs exist
        for (const c of cats) if (!base[c.slug]) base[c.slug] = [];

        // if firefighterId param provided, fetch its assignments and merge
        if (paramFirefighterId) {
          const ffId = paramFirefighterId;
          if (!mounted) return;
          setFirefighterId(ffId);
          const resAssigned = await fetch(API_ENDPOINTS.firefighters.equipment(ffId));
          const assignedBody = await resAssigned.json().catch(() => ({ items: [] }));
          const rows = assignedBody.items || [];
          for (const r of rows) {
            const slug = r.category_slug ?? (r.category_id !== undefined ? catIdToSlug[r.category_id] : undefined) ?? 'uncategorized';
            if (!base[slug]) base[slug] = [];
            // find item in base by item_key
            const existing = base[slug].find((x: any) => x.key === r.item_key);
            if (existing) {
              existing.selected = !!r.selected;
              existing.quantity = r.quantity ?? existing.quantity ?? 1;
              existing.condition = r.condition ?? existing.condition ?? 'Dobry';
              existing.notes = r.notes ?? existing.notes ?? '';
            } else {
                // fallback: push item from assignment
                base[slug].push({ key: r.item_key, label: r.item_label, selected: !!r.selected, quantity: r.quantity ?? 1, condition: r.condition ?? 'Dobry', notes: r.notes ?? '' });
            }
          }
        }

        if (!selectedCategory) {
          const first = Object.keys(base)[0];
          if (first) setSelectedCategory(first);
        }

        if (mounted) setItemsByCategory(base);
      } catch (err) {
        console.warn('Load equipment error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [paramFirefighterId]);

  function toggleSelect(cat: string, index: number) {
    setItemsByCategory((prev) => {
      const next = { ...prev };
      next[cat] = [...next[cat]];
      next[cat][index] = { ...next[cat][index], selected: !next[cat][index].selected };
      return next;
    });
  }

  function openEditor(cat: string, index: number) {
    setTempNotes(itemsByCategory[cat][index].notes ?? "");
    setEditing({ cat, idx: index });
  }

  function saveEditor() {
    if (!editing) return;
    setItemsByCategory((prev) => {
      const next = { ...prev };
      next[editing.cat] = [...next[editing.cat]];
      next[editing.cat][editing.idx] = { ...next[editing.cat][editing.idx], notes: tempNotes };
      return next;
    });
    setEditing(null);
  }

  function changeQuantity(cat: string, index: number, delta: number) {
    setItemsByCategory((prev) => {
      const next = { ...prev };
      next[cat] = [...next[cat]];
      const cur = next[cat][index];
      next[cat][index] = { ...cur, quantity: Math.max(0, (cur.quantity || 0) + delta) };
      return next;
    });
  }

  function setCondition(cat: string, index: number, cond: Condition) {
    setItemsByCategory((prev) => {
      const next = { ...prev };
      next[cat] = [...next[cat]];
      next[cat][index] = { ...next[cat][index], condition: cond };
      return next;
    });
  }

  const items = itemsByCategory[selectedCategory] || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Wyposażenie</Text>
      <Text style={styles.subtitle}>Wybierz kategorię i edytuj elementy</Text>

      <View style={styles.catRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.catBtn, selectedCategory === cat.slug && styles.catBtnActive]}
            onPress={() => setSelectedCategory(cat.slug)}
          >
            <Text style={selectedCategory === cat.slug ? styles.catBtnTextActive : styles.catBtnText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.headerBackground} />
        ) : (
          items.map((it, idx) => (
            <View key={it.key} style={[styles.itemRow, it.selected && styles.itemRowSelected]}>
              <View style={styles.itemLeft}>
                <View style={{ marginLeft: 0 }}>
                  <Text style={styles.itemLabel}>{it.label}</Text>
                  <Text style={styles.itemMeta}>{it.selected ? `Ilość: ${it.quantity} • ${it.condition}` : "Nie zaznaczone"}</Text>
                </View>
              </View>

              <View style={styles.itemActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSelect(selectedCategory, idx)}>
                  <Text style={{ color: it.selected ? colors.surface : colors.text }}>{it.selected ? "✓" : "+"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditor(selectedCategory, idx)}>
                  <Text style={{ color: colors.text }}>Edytuj</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={async () => {
            try {
              setLoading(true);

              // ensure we have firefighterId (use param or resolved state)
              const ffId = firefighterId ?? paramFirefighterId;
              if (!ffId) return Alert.alert('Brak strażaka', 'Wybierz strażaka na ekranie startowym i spróbuj ponownie.');

              const payloadItems: any[] = [];
              for (const cat of Object.keys(itemsByCategory)) {
                for (const it of itemsByCategory[cat]) {
                  payloadItems.push({ item_key: it.key, selected: it.selected ? 1 : 0, quantity: it.quantity ?? 0, condition: it.condition ?? 'Dobry', notes: it.notes ?? '' });
                }
              }

              const res = await fetch(API_ENDPOINTS.firefighters.equipment(ffId), {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: payloadItems })
              });

              if (!res.ok) {
                const txt = await res.text().catch(() => 'Brak treści');
                return Alert.alert('Błąd zapisu', `Serwer zwrócił ${res.status}: ${txt}`);
              }

              await res.json().catch(() => null);
              setFirefighterId(ffId);
              Alert.alert('Zapisano', 'Wyposażenie zostało zapisane na serwerze.');
            } catch (err) {
              Alert.alert('Błąd', String(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.saveText}>Zapisz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.saveText}>Powrót</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editing !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editing !== null && (
              <>
                <Text style={styles.modalTitle}>{itemsByCategory[editing.cat][editing.idx].label}</Text>

                <View style={styles.rowCenter}>
                  <Text style={{ marginRight: 8 }}>Ilość:</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => changeQuantity(editing.cat, editing.idx, -1)}>
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text style={{ marginHorizontal: 12 }}>{itemsByCategory[editing.cat][editing.idx].quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => changeQuantity(editing.cat, editing.idx, 1)}>
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={{ marginBottom: 6 }}>Stan:</Text>
                  <View style={styles.conditionRow}>
                    {(["Nowy", "Dobry", "Zuzyty"] as Condition[]).map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.condBtn,
                          itemsByCategory[editing.cat][editing.idx].condition === c && styles.condBtnActive,
                        ]}
                        onPress={() => setCondition(editing.cat, editing.idx, c)}
                      >
                        <Text style={{ color: itemsByCategory[editing.cat][editing.idx].condition === c ? colors.surface : colors.text }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={{ marginBottom: 6 }}>Notatka:</Text>
                  <TextInput
                    value={tempNotes}
                    onChangeText={setTempNotes}
                    placeholder="np. rozmiar, uwagi"
                    style={styles.textInput}
                    multiline
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => setEditing(null)}>
                    <Text>Anuluj</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.headerBackground } as any]}
                    onPress={saveEditor}
                  >
                    <Text style={{ color: colors.surface }}>Zapisz</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 6 },
  subtitle: { color: colors.textMuted, marginBottom: 12 },
  catRow: { flexDirection: "row", marginBottom: 12 },
  catBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, marginRight: 8, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.surfaceDivider },
  catBtnActive: { backgroundColor: colors.headerBackground, borderColor: colors.headerBackground },
  catBtnText: { color: colors.text, fontWeight: "600" },
  catBtnTextActive: { color: colors.surface, fontWeight: "600" },
  list: { marginTop: 8 },
  itemRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemRowSelected: { borderColor: colors.headerBackground, shadowColor: colors.headerBackground, shadowOpacity: 0.12 },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  itemLabel: { fontWeight: "600", color: colors.text },
  itemMeta: { color: colors.textMuted, fontSize: 12 },
  itemActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.disabled, alignItems: "center", justifyContent: "center", marginRight: 8 },
  editBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.surfaceDivider },
  quickRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  saveBtn: { flex: 1, marginRight: 8, padding: 12, backgroundColor: colors.headerBackground, borderRadius: 8, alignItems: "center" },
  backBtn: { flex: 1, marginLeft: 8, padding: 12, backgroundColor: colors.headerBackground, borderRadius: 8, alignItems: "center" },
  saveText: { color: colors.surface, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "92%", backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceBorder },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  stepBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.disabled },
  conditionRow: { flexDirection: "row", gap: 8 },
  condBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceDivider, marginRight: 8 },
  condBtnActive: { backgroundColor: colors.headerBackground, borderColor: colors.headerBackground },
  textInput: { minHeight: 60, borderWidth: 1, borderColor: colors.surfaceDivider, borderRadius: 8, padding: 8, backgroundColor: colors.surface },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  modalBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8, backgroundColor: colors.surfaceBorder },
});
