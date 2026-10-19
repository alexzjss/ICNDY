import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppProvider, useApp } from "../src/context/AppContext";
import { Button } from "../src/components/ui";
import { colors } from "../src/theme";

function RootNavigator() {
  const { isInitialized, initializationError, retryInitialization, settings, theme } = useApp();

  if (!isInitialized) {
    return (
      <View style={styles.bootstrap}>
        <Text style={styles.wordmark}>ICNDY</Text>
        <ActivityIndicator color={theme.lime} />
        <Text style={styles.message}>Preparando seus treinos no dispositivo…</Text>
      </View>
    );
  }

  if (initializationError) {
    return (
      <View style={styles.bootstrap}>
        <Text style={styles.wordmark}>ICNDY</Text>
        <Text style={styles.errorTitle}>Seus dados estão indisponíveis</Text>
        <Text style={styles.message}>
          O ICNDY não conseguiu abrir o banco de treinos local. Seus dados não foram substituídos.
        </Text>
        <Button onPress={() => void retryInitialization()}>Tentar novamente</Button>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: settings.reduceMotion ? "none" : "default",
        contentStyle: { backgroundColor: theme.background },
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
