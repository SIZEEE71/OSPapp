import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlarmProvider } from "./context/AlarmContext";
import colors from "./theme";

const APP_NAME = "OSP Mobilny";

// Set notification handler - SILENT
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function LayoutHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{APP_NAME}</Text>
    </View>
  );
}

export default function RootLayout() {
  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permissions:', status);
    })();
  }, []);

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
