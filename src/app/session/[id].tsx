import { useLocalSearchParams } from 'expo-router';
import { Card, Header, Screen, SessionCard, Text } from '../../components';
import { useApp } from '../../context/AppContext';

// Placeholder: a tela de detalhe/edição será construída na fase de UI.
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useApp();
  const session = sessions.find((item) => item.id === id);
  return (
    <Screen>
      <Header back eyebrow="Detalhe do treino" title="Treino" />
      {session ? <SessionCard session={session} onPress={() => undefined} /> : <Card><Text variant="caption">Treino não encontrado.</Text></Card>}
    </Screen>
  );
}
