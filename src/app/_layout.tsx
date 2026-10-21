import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_900Black,
} from "@expo-google-fonts/barlow-condensed";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { AppProvider, useApp } from "../context/AppContext";
import { Button, ToastProvider } from "../components";
import { colors } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { isInitialized, initializationError, retryInitialization, settings } =
    useApp();
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    BarlowCondensed_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const ready = isInitialized && (fontsLoaded || Boolean(fontError));
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  const onboarded = settings.onboardingComplete;

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="workout/setup" />
          <Stack.Screen
            name="workout/active"
            options={{ gestureEnabled: false, animation: "fade" }}
          />
          <Stack.Screen
            name="workout/summary"
            options={{ gestureEnabled: false }}
          />
        </Stack.Protected>
      </Stack>
      {isInitialized && initializationError ? (
        <View style={[StyleSheet.absoluteFill, styles.bootstrap]}>
          <Text style={styles.wordmark}>ICNDY</Text>
          <Text style={styles.errorTitle}>Dados locais indisponíveis</Text>
          <Text style={styles.message}>
            O ICNDY não conseguiu abrir o banco de dados local. Seus dados
            existentes não foram substituídos.
          </Text>
          <Button onPress={() => void retryInitialization()}>
            Tentar novamente
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <StatusBar style="light" />
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bootstrap: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  wordmark: {
    color: colors.accent,
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
