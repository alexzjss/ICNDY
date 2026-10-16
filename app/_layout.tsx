import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppProvider, useApp } from "../src/context/AppContext";
import { Button } from "../src/components/ui";
import { colors } from "../src/theme";

function RootNavigator() {
  const { isInitialized, initializationError, retryInitialization } = useApp();

  if (!isInitialized) {
    return (
      <View style={styles.bootstrap}>
        <Text style={styles.wordmark}>ICNDY</Text>
        <ActivityIndicator color={colors.lime} />
        <Text style={styles.message}>Preparing your local training log…</Text>
      </View>
    );
  }

  if (initializationError) {
    return (
      <View style={styles.bootstrap}>
        <Text style={styles.wordmark}>ICNDY</Text>
        <Text style={styles.errorTitle}>Local data unavailable</Text>
        <Text style={styles.message}>
          ICNDY could not open its local training database. Your existing data
          was not replaced.
        </Text>
        <Button onPress={() => void retryInitialization()}>Try again</Button>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  wordmark: {
    color: colors.lime,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -3,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  message: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
