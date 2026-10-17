import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { radii } from '../../src/theme';
import { useApp } from '../../src/context/AppContext';
export default function TabLayout() {
  const { settings, theme } = useApp();
  return <Tabs screenOptions={{ headerShown: false, animation: settings.reduceMotion ? 'none' : 'fade', tabBarActiveTintColor: theme.lime, tabBarInactiveTintColor: theme.muted, tabBarStyle: { position: 'absolute', left: 16, right: 16, bottom: 18, height: 68, borderRadius: radii.pill, backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.line, paddingTop: 8, paddingBottom: 8, elevation: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, tabBarItemStyle: { borderRadius: radii.pill }, tabBarLabelStyle: { fontWeight: '800', fontSize: 10 } }}>
    <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <Ionicons name="flash" size={20} color={color} /> }} />
    <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={20} color={color} /> }} />
    <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }) => <Ionicons name="time" size={20} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={20} color={color} /> }} />
  </Tabs>;
}
