import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Card, staggerEntering, Text } from '../../components';
import { Achievement } from '../../domain/achievements';
import { colors, gradients, withAlpha } from '../../theme';

const Item = ({ item, index }: { item: Achievement; index: number }) => {
  const reduced = useReducedMotion();
  const bar = useSharedValue(reduced ? item.progress / item.target : 0);

  useEffect(() => {
    const ratio = item.progress / item.target;
    if (reduced) {
      bar.value = ratio;
      return;
    }
    bar.value = withDelay(Math.min(index, 6) * 30, withTiming(ratio, { duration: 450, easing: Easing.out(Easing.cubic) }));
  }, [item.progress, item.target, index, reduced, bar]);

  const fill = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  return (
    <Card entering={staggerEntering(index)} accent={item.earned ? colors.accent : undefined} style={item.earned ? undefined : styles.locked}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          {item.earned ? (
            <>
              <View style={styles.glow} />
              <LinearGradient colors={gradients.accent} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.onAccent} />
              </LinearGradient>
            </>
          ) : (
            <View style={[styles.icon, { backgroundColor: colors.surfaceRaised }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.muted} />
            </View>
          )}
        </View>
        <View style={styles.text}>
          <Text variant="heading" color={item.earned ? colors.text : colors.muted} style={styles.title}>{item.label}</Text>
          <Text variant="caption">{item.detail}</Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { backgroundColor: item.earned ? colors.success : colors.accent }, fill]} />
            </View>
            <Text variant="caption" color={item.earned ? colors.success : colors.muted} style={styles.count}>
              {item.progress}/{item.target}
            </Text>
          </View>
        </View>
        {item.earned ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
      </View>
    </Card>
  );
};

/** Lista de conquistas com ícone, progresso e animação ao estarem conquistadas. */
export const AchievementList = ({ items }: { items: Achievement[] }) => (
  <View style={styles.list}>
    {items.map((item, index) => (
      <Item key={item.id} item={item} index={index} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: { gap: 10 },
  locked: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: withAlpha(colors.accent, 0.22) },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 20, lineHeight: 24 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  count: { minWidth: 32, textAlign: 'right' },
});
