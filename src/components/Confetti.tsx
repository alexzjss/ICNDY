import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, movementColors } from '../theme';

type Spec = { id: number; vx: number; vy: number; spin: number; w: number; h: number; color: string; delay: number; round: boolean };

const PALETTE = [movementColors.pull, movementColors.push, movementColors.squat, colors.success, colors.white];

const Piece = ({ spec, x0, y0, gravity, duration }: { spec: Spec; x0: number; y0: number; gravity: number; duration: number }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(spec.delay, withTiming(1, { duration, easing: Easing.linear }));
  }, [p, spec.delay, duration]);
  const style = useAnimatedStyle(() => {
    const t = (p.value * duration) / 1000;
    return {
      opacity: p.value === 0 ? 0 : p.value > 0.75 ? (1 - p.value) / 0.25 : 1,
      transform: [
        { translateX: x0 + spec.vx * t },
        { translateY: y0 + spec.vy * t + 0.5 * gravity * t * t },
        { rotate: `${spec.spin * t}deg` },
        { rotateX: `${spec.spin * t * 0.6}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width: spec.w, height: spec.h, backgroundColor: spec.color, borderRadius: spec.round ? spec.w / 2 : 2 },
        style,
      ]}
    />
  );
};

export type ConfettiProps = {
  /** Muda (incrementa) ou vira true para disparar uma explosão. */
  trigger: number | boolean;
  /** Número de partículas (padrão 80). */
  count?: number;
  /** Origem como fração da tela (padrão x 0.5, y 0.35). */
  origin?: { x: number; y: number };
  colorsList?: string[];
  /** Duração em ms (padrão 2800). */
  duration?: number;
};

/** Overlay de confete (pointerEvents none) disparado pela mudança de `trigger`. */
export const Confetti = ({ trigger, count = 80, origin = { x: 0.5, y: 0.35 }, colorsList = PALETTE, duration = 2800 }: ConfettiProps) => {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [burst, setBurst] = useState<{ key: number; specs: Spec[] }>();

  useEffect(() => {
    if (!trigger || reduced) return;
    const key = Date.now();
    const specs: Spec[] = Array.from({ length: count }, (_, id) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 380 + Math.random() * 520;
      return {
        id,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        spin: (Math.random() - 0.5) * 1400,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: colorsList[Math.floor(Math.random() * colorsList.length)],
        delay: Math.random() * 120,
        round: Math.random() < 0.25,
      };
    });
    setBurst({ key, specs });
    const t = setTimeout(() => setBurst(undefined), duration + 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (!burst) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {burst.specs.map((spec) => (
        <Piece key={`${burst.key}-${spec.id}`} spec={spec} x0={width * origin.x} y0={height * origin.y} gravity={1400} duration={duration} />
      ))}
    </View>
  );
};
