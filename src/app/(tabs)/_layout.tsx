import { Tabs } from 'expo-router';
import { TabBar } from '../../components';
import { colors } from '../../theme';

// Apenas duas rotas reais (Início, Progresso). O botão central TREINAR é desenhado pelo TabBar custom.
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progresso' }} />
    </Tabs>
  );
}
