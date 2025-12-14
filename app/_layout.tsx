import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlarmProvider } from "./context/AlarmContext";
import colors from "./theme";

const APP_NAME = "OSP Mobilny";

function LayoutHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{APP_NAME}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AlarmProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LayoutHeader />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </SafeAreaView>
    </AlarmProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: colors.headerBackground,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
});
