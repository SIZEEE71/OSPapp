import { StyleSheet } from "react-native";
import colors from "../theme";

export const commonButtonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: colors.textWhite,
    fontWeight: "600",
    fontSize: 14,
  },

  secondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  danger: {
    backgroundColor: colors.danger,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerText: {
    color: colors.textWhite,
    fontWeight: "600",
    fontSize: 14,
  },

  success: {
    backgroundColor: colors.success,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    color: colors.textWhite,
    fontWeight: "600",
    fontSize: 14,
  },

  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallText: {
    fontSize: 12,
  },

  large: {
    flex: 1,
  },
});

export const commonModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "space-between",
  },

  content: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    paddingBottom: 0,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceDivider,
  },

  actionsVertical: {
    flexDirection: "column",
    gap: 8,
    padding: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceDivider,
  },
});

export const commonFormStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 14,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
});
