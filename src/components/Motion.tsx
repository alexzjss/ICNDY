import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/** Haptic seguro (ignora falhas/plataformas sem suporte). */
export const haptic = {
  light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  medium: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined),
  heavy: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined),
  select: () => void Haptics.selectionAsync().catch(() => undefined),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
};

export const SPRING = { damping: 14, stiffness: 220, mass: 0.7 } as const;

/** Animação de entrada em cascata (FadeInDown.delay(index*60).springify()). */
export const staggerEntering = (index = 0, step = 60) =>
  FadeInDown.delay(index * step).springify().damping(18);

/** Hook de escala por pressão: devolve estilo animado e handlers para Pressable. */
export const usePressScale = (to = 0.96) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => {
      scale.value = reduced ? 1 : withSpring(to, SPRING);
    },
    onPressOut: () => {
      scale.value = reduced ? 1 : withSpring(1, SPRING);
    },
  };
};

export type StaggerInProps = {
  /** Posição na cascata (atraso = index * 60ms). */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Envolve o conteúdo com entrada em cascata (fade + sobe com spring). */
export const StaggerIn = ({ index = 0, style, children }: StaggerInProps) => {
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={reduced ? undefined : staggerEntering(index)} style={style}>
      {children}
    </Animated.View>
  );
};
