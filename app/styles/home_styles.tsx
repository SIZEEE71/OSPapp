import { StyleSheet } from "react-native";
import colors from "../theme";

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
export default styles;