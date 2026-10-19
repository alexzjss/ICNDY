import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { radii } from '../../src/theme';
import { useApp } from '../../src/context/AppContext';
export default function TabLayout() {
  const { settings, theme } = useApp();
  return <Tabs screenOptions={{ headerShown: false, animation: settings.reduceMotion ? 'none' : 'fade', tabBarActiveTintColor: theme.lime, tabBarInactiveTintColor: theme.muted, tabBarStyle: { position: 'absolute', left: 20, right: 20, bottom: 18, height: 62, borderRadius: radii.pill, backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.line, paddingTop: 6, paddingBottom: 6, elevation: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, tabBarItemStyle: { borderRadius: radii.pill }, tabBarLabelStyle: { fontWeight: '900', fontSize: 10 } }}>
    <Tabs.Screen name="index" options={{ title: 'Treinar', tabBarIcon: ({ color }) => <Ionicons name="barbell" size={20} color={color} /> }} />
    <Tabs.Screen name="progress" options={{ title: 'Evolução', tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={20} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarIcon: ({ color }) => <Ionicons name="options" size={20} color={color} /> }} />
  </Tabs>;
}
