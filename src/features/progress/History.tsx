import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, SessionCard, staggerEntering, Text } from '../../components';
import { WorkoutSession } from '../../domain/models';
import { groupByMonth } from './data';

const PAGE = 8;

/** Histórico agrupado por mês, com "Ver mais". */
export const History = ({ sessions }: { sessions: WorkoutSession[] }) => {
  const [visible, setVisible] = useState(PAGE);
  const groups = useMemo(() => groupByMonth(sessions), [sessions]);
  const total = groups.reduce((sum, g) => sum + g.sessions.length, 0);
  let remaining = visible;
  let shown = 0;

  return (
    <View style={styles.root}>
      {groups.map((group) => {
        if (remaining <= 0) return null;
        const slice = group.sessions.slice(0, remaining);
        remaining -= slice.length;
        return (
          <View key={group.key} style={styles.group}>
            <Text variant="label">{group.label}</Text>
            {slice.map((session) => (
              <SessionCard key={session.id} session={session} entering={staggerEntering(Math.min(shown++, 6))} />
            ))}
          </View>
        );
      })}
      {total > visible ? (
        <Button variant="secondary" size="sm" icon="chevron-down" onPress={() => setVisible((v) => v + PAGE)}>
          {`Ver mais (${total - visible})`}
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 18 },
  group: { gap: 10 },
});
