import { StyleSheet } from "react-native";
import colors from "../theme";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  hintRow: { position: "absolute", top: 50, left: 12, right: 12, alignItems: "center", zIndex: 1000 },
  hintText: { backgroundColor: colors.surface, padding: 8, borderRadius: 8, color: colors.text, opacity: 0.9 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "92%", backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceDivider },
  modalTitle: { fontWeight: "700", fontSize: 18, marginBottom: 8, color: colors.text },
  modalLabel: { color: colors.textMuted, marginTop: 8 },
  modalCoord: { marginTop: 4, color: colors.text },
  input: { marginTop: 8, borderWidth: 1, borderColor: colors.surfaceDivider, borderRadius: 8, padding: 8, backgroundColor: colors.background },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  btnPrimary: { backgroundColor: colors.headerBackground },
  btnSecondary: { backgroundColor: colors.surfaceBorder },
});
export default styles;