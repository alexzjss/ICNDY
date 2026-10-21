import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Label, Screen, Title } from '../../components/ui';
import { SessionCard } from '../../components/SessionCard';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme';

// Placeholder: a tela de detalhe/edição será construída na fase de UI.
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sessions } = useApp();
  const session = sessions.find((item) => item.id === id);
  return (
    <Screen>
      <Button secondary onPress={() => router.back()}>Voltar</Button>
      <Label>Detalhe do treino</Label>
      <Title>Treino</Title>
      {session ? <SessionCard session={session} /> : <Card><Text style={{ color: colors.muted }}>Treino não encontrado.</Text></Card>}
    </Screen>
  );
}
