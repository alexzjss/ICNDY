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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Card, SPRING, staggerEntering, Text } from '../../components';
import { Achievement } from '../../domain/achievements';
import { colors, gradients, withAlpha } from '../../theme';

const Item = ({ item, index }: { item: Achievement; index: number }) => {
  const reduced = useReducedMotion();
  const pop = useSharedValue(1);
  const bar = useSharedValue(reduced ? item.progress / item.target : 0);
  const shine = useSharedValue(0);

  useEffect(() => {
    const ratio = item.progress / item.target;
    if (reduced) {
      bar.value = ratio;
      return;
    }
    bar.value = withDelay(400 + index * 60, withTiming(ratio, { duration: 800, easing: Easing.out(Easing.cubic) }));
    if (item.earned) {
      pop.value = 0.6;
      pop.value = withDelay(400 + index * 80, withSequence(withSpring(1.18, { damping: 6, stiffness: 240 }), withSpring(1, SPRING)));
      shine.value = withDelay(1200 + index * 80, withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1));
    }
  }, [item.earned, item.progress, item.target, index, reduced, bar, pop, shine]);

  const icon = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const glow = useAnimatedStyle(() => ({ opacity: shine.value * 0.5 }));
  const fill = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  return (
    <Card entering={staggerEntering(index)} accent={item.earned ? colors.accent : undefined} style={item.earned ? undefined : styles.locked}>
      <View style={styles.row}>
        <Animated.View style={[styles.iconWrap, icon]}>
          {item.earned ? (
            <>
              <Animated.View style={[styles.glow, glow]} />
              <LinearGradient colors={gradients.accent} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.onAccent} />
              </LinearGradient>
            </>
          ) : (
            <View style={[styles.icon, { backgroundColor: colors.surfaceRaised }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.muted} />
            </View>
          )}
        </Animated.View>
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
  glow: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: withAlpha(colors.accent, 0.6) },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 20, lineHeight: 24 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  count: { minWidth: 32, textAlign: 'right' },
});
