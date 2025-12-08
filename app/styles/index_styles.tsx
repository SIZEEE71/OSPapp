import { StyleSheet } from "react-native";
import colors from "../theme";

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

export default styles;