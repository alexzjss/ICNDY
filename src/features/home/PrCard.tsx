import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedNumber, Card, Text } from '../../components';
import { WorkoutSession } from '../../domain/models';
import { sessionTitle } from '../../domain/presets';
import { formatDayMonth } from '../../domain/dates';
import { colors, fonts } from '../../theme';
import { Sparkline } from '../progress/Sparkline';

type Props = { pr: WorkoutSession; results: number[]; entering?: React.ComponentProps<typeof Card>['entering'] };

/** Recorde pessoal da configuração em foco, com sparkline dos últimos resultados. */
export const PrCard = ({ pr, results, entering }: Props) => {
  const router = useRouter();
  return (
    <Card entering={entering} onPress={() => router.push({ pathname: '/session/[id]', params: { id: pr.id } })} accessibilityLabel={`Seu recorde em ${sessionTitle(pr)}: ${pr.totalReps} repetições`}>
      <View style={styles.head}>
        <View style={styles.trophy}>
          <Ionicons name="trophy" size={16} color={colors.accent} />
        </View>
        <Text variant="label" color={colors.accent}>Seu PR · {sessionTitle(pr)}</Text>
      </View>
      <View style={styles.row}>
        <View>
          <View style={styles.score}>
            <AnimatedNumber value={pr.totalReps} fontSize={56} duration={1100} />
            <Text variant="caption"> reps</Text>
          </View>
          <Text variant="caption">
            {pr.completedRounds} rounds + {pr.additionalReps} · {formatDayMonth(pr.localDate)}
          </Text>
        </View>
        <View style={styles.spark}>
          {results.length > 1 ? (
            <Sparkline values={results} />
          ) : (
            <Text variant="caption" align="right" style={{ fontFamily: fonts.body }}>
              Treine de novo para ver sua evolução
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trophy: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  score: { flexDirection: 'row', alignItems: 'baseline' },
  spark: { flex: 1, justifyContent: 'center' },
});
