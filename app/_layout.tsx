import { Stack } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import colors from "./theme";

const APP_NAME = "OSP Mobilny";
const STATUS_BAR_PADDING = Platform.OS === "ios" ? 12 : 8;
const HEADER_HEIGHT = 56 + STATUS_BAR_PADDING;

function LayoutHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{APP_NAME}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <LayoutHeader />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    height: HEADER_HEIGHT,
    paddingTop: STATUS_BAR_PADDING,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: colors.headerBackground,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
});
