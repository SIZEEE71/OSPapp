import { StyleSheet } from "react-native";
import colors from "../theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: -27,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.textMuted,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDivider,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.headerBackground,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.headerBackground,
  },
  loader: {
    marginTop: 50,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  section: {
    marginBottom: 20,
  },
  totalCard: {
    backgroundColor: colors.headerBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "white",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.headerBackground,
  },
  statDetails: {
    marginTop: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statDetail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceDivider,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.headerBackground,
    borderRadius: 4,
  },
  actions: {
    padding: 12,
    gap: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceDivider,
  },
  backBtn: {
    flex: 1,
    backgroundColor: colors.headerBackground,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  backBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
export default styles;