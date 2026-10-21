import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, fonts, gradients } from '../theme';
import { haptic, usePressScale } from './Motion';
import { TAB_BAR_HEIGHT } from './Screen';
import { Text } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;
const TAB_META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Início', icon: 'home-outline', iconActive: 'home' },
  progress: { label: 'Progresso', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TabItem = ({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) => {
  const meta = TAB_META[name] ?? { label: name, icon: 'ellipse-outline' as IconName, iconActive: 'ellipse' as IconName };
  const reduced = useReducedMotion();
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? (focused ? 1 : 0) : withTiming(focused ? 1 : 0, { duration: 150 });
  }, [focused, reduced, p]);
  const on = useAnimatedStyle(() => ({ opacity: p.value }));
  const off = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  const dot = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scaleX: p.value }] }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={meta.label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={styles.tab}
    >
      <Animated.View style={styles.iconBox}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, off]}>
          <Ionicons name={meta.icon} size={24} color={colors.muted} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, on]}>
          <Ionicons name={meta.iconActive} size={24} color={colors.accent} />
        </Animated.View>
      </Animated.View>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, lineHeight: 14, color: focused ? colors.accent : colors.muted }}>
        {meta.label}
      </Text>
      <Animated.View style={[styles.dot, dot]} />
    </Pressable>
  );
};

const CenterButton = () => {
  const router = useRouter();
  const { active } = useApp();
  const press = usePressScale(0.96);
  const resume = Boolean(active);
  return (
    <View style={styles.centerSlot} pointerEvents="box-none">
      <View pointerEvents="none" style={styles.glow} />
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={resume ? 'Retomar treino' : 'Treinar'}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={() => {
          haptic.medium();
          router.push(resume ? '/workout/active' : '/workout/setup');
        }}
        style={[styles.centerPress, press.style]}
      >
        <View style={styles.centerBody}>
          <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.centerGradient}>
            <Ionicons name={resume ? 'play' : 'flash'} size={26} color={colors.onAccent} />
            <Text style={styles.centerLabel}>{resume ? 'RETOMAR' : 'TREINAR'}</Text>
          </LinearGradient>
        </View>
      </AnimatedPressable>
    </View>
  );
};

/**
 * Tab bar custom: Início · [botão central] · Progresso.
 * O botão central NÃO é uma rota: é renderizado entre as duas abas reais (state.routes) e navega
 * com router.push para /workout/setup (ou /workout/active se houver treino ativo). Sem rota dummy.
 */
export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const items = state.routes.map((route, index) => {
    const focused = state.index === index;
    return (
      <TabItem
        key={route.key}
        name={route.name}
        focused={focused}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptic.select();
            navigation.navigate(route.name, route.params);
          }
        }}
      />
    );
  });
  const mid = Math.ceil(items.length / 2);
  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {items.slice(0, mid)}
      <View style={styles.centerSpacer} />
      {items.slice(mid)}
      <CenterButton />
    </View>
  );
};

const SIZE = 78;
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    overflow: 'visible',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 28, height: 28 },
  dot: { width: 16, height: 3, borderRadius: 2, backgroundColor: colors.accent, position: 'absolute', top: 0 },
  centerSpacer: { width: SIZE + 16 },
  centerSlot: { position: 'absolute', left: 0, right: 0, top: -SIZE / 2 + 6, alignItems: 'center' },
  glow: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.accent, opacity: 0.18 },
  centerPress: { width: SIZE, height: SIZE },
  centerBody: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 4,
    borderColor: colors.bg,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  centerGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  centerLabel: { fontFamily: fonts.displayBold, fontSize: 13, lineHeight: 14, color: colors.onAccent, letterSpacing: 0.6 },
});
