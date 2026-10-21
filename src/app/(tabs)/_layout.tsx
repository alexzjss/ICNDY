import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bodySemibold },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="flash" size={20} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progresso', tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={20} color={color} /> }} />
    </Tabs>
  );
}
