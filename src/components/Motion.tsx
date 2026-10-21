import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

let hapticsOn = true;
/** Liga/desliga todos os haptics do app (preferência `hapticsEnabled`). */
export const setHapticsEnabled = (flag: boolean) => {
  hapticsOn = flag;
};
/** Sincroniza o módulo de haptics com as configurações carregadas. Chame uma vez no provider/layout raiz. */
export const useSyncHaptics = (settings: { hapticsEnabled?: boolean } | undefined) => {
  const flag = settings?.hapticsEnabled ?? true;
  setHapticsEnabled(flag);
  useEffect(() => {
    setHapticsEnabled(flag);
  }, [flag]);
};
const fire = (run: () => Promise<unknown>) => () => {
  if (hapticsOn) void run().catch(() => undefined);
};

/** Haptic seguro (ignora falhas/plataformas sem suporte e respeita a preferência). */
export const haptic = {
  light: fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  select: fire(() => Haptics.selectionAsync()),
  success: fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

/** Spring amortecido (sem overshoot visível). */
export const SPRING = { damping: 22, stiffness: 260, mass: 0.7 } as const;

/** Máximo de itens escalonados; os demais entram juntos com o último. */
export const STAGGER_MAX = 6;

/** Entrada curta: fade + desloca 8px, 30ms por item (teto de 6), sem spring. */
export const staggerEntering = (index = 0, step = 30) =>
  FadeInDown.delay(Math.min(index, STAGGER_MAX) * step)
    .duration(220)
    .easing(Easing.out(Easing.quad))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });

/** Hook de escala por pressão: devolve estilo animado e handlers para Pressable. */
export const usePressScale = (to = 0.98) => {
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
  /** Posição na cascata (atraso = index * 30ms, máx. 6). */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Envolve o conteúdo com entrada em cascata (fade + sobe pouco). */
export const StaggerIn = ({ index = 0, style, children }: StaggerInProps) => {
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={reduced ? undefined : staggerEntering(index)} style={style}>
      {children}
    </Animated.View>
  );
};
