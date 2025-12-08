import { StyleSheet } from "react-native";
import colors from "../theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  content: {
    flex: 1,
    padding: 12,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 30,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  itemHeader: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: "600",
    color: colors.text,
    fontSize: 16,
  },
  itemSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  addBtn: {
    flex: 1,
    backgroundColor: colors.headerBackground,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: {
    color: "white",
    fontWeight: "600",
  },
  backBtn: {
    flex: 1,
    backgroundColor: colors.surfaceBorder,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  backBtnText: {
    color: colors.text,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "space-between",
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    paddingBottom: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 5,
    padding: 20,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceDivider,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.headerBackground,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "600",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceBorder,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: colors.text,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceDivider,
  },
  detailLabel: {
    fontWeight: "600",
    color: colors.textMuted,
  },
  detailValue: {
    color: colors.text,
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  deleteBtnText: {
    color: "white",
    fontWeight: "600",
  },
  closeBtn: {
    flex: 1,
    backgroundColor: colors.surfaceBorder,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  closeBtnText: {
    color: colors.text,
    fontWeight: "600",
  },
});
export default styles;