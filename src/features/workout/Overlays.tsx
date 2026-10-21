import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Text as AppText } from '../../components';
import { colors, fonts, roundColor, withAlpha } from '../../theme';

/** Número do countdown 3-2-1 / "VAI!" com escala em spring. */
export const CountdownView = memo(({ value }: { value: number | 'go' }) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    scale.value = 2.1;
    scale.value = withSpring(1, { damping: 9, stiffness: 150 });
  }, [value, reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: Math.min(1, scale.value > 1 ? 2.1 - scale.value + 0.4 : 1) }));
  const color = value === 'go' ? colors.success : roundColor(3 - value);
  return (
    <Animated.View exiting={FadeOut.duration(250)} style={styles.full} pointerEvents="none">
      <Animated.View style={style}>
        <Text style={[styles.count, { color, fontSize: value === 'go' ? 150 : 260, lineHeight: value === 'go' ? 160 : 270 }]}>{value === 'go' ? 'VAI!' : value}</Text>
      </Animated.View>
      <Text style={styles.hint}>Prepare-se</Text>
    </Animated.View>
  );
});
CountdownView.displayName = 'CountdownView';

/** Animação "TEMPO!" ao fim do cronômetro. */
export const TimeUp = () => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 0.4);
  useEffect(() => {
    if (!reduced) scale.value = withSequence(withSpring(1.15, { damping: 7 }), withTiming(1, { duration: 200 }));
  }, [reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeIn.duration(150)} style={[styles.full, { backgroundColor: withAlpha(colors.bg, 0.78) }]} pointerEvents="auto">
      <Animated.View style={style}>
        <Text style={styles.timeUp}>TEMPO!</Text>
      </Animated.View>
    </Animated.View>
  );
};

/** Overlay escurecido de pausa. */
export const PauseOverlay = ({ onResume, remaining }: { onResume: () => void; remaining: string }) => (
  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[styles.full, { backgroundColor: withAlpha(colors.bg, 0.92) }]}>
    <Text style={styles.paused}>PAUSADO</Text>
    <AppText variant="body" color={colors.muted} align="center">{`Restam ${remaining}`}</AppText>
    <View style={styles.resume}>
      <Button size="lg" icon="play" onPress={onResume}>Retomar</Button>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  full: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8 },
  count: { fontFamily: fonts.displayBold, textAlign: 'center', fontVariant: ['tabular-nums'], includeFontPadding: false },
  hint: { fontFamily: fonts.displaySemi, fontSize: 22, letterSpacing: 4, color: colors.muted, textTransform: 'uppercase' },
  timeUp: { fontFamily: fonts.displayBold, fontSize: 120, lineHeight: 128, color: colors.text, includeFontPadding: false },
  paused: { fontFamily: fonts.displayBold, fontSize: 84, lineHeight: 90, color: colors.text, letterSpacing: 4 },
  resume: { alignSelf: 'stretch', paddingHorizontal: 32, marginTop: 24 },
});
