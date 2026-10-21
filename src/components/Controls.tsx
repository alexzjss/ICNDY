import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../theme';
import { haptic, SPRING, usePressScale } from './Motion';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Texto pequeno depois do valor (ex. "min"). */
  unit?: string;
  /** Cor do valor e dos botões (padrão accent). */
  color?: string;
  /** Tamanho da fonte do valor (padrão 44). */
  valueSize?: number;
  style?: StyleProp<ViewStyle>;
};

type StepButtonProps = { icon: 'add' | 'remove'; disabled: boolean; color: string; onHold: (start: boolean) => void; label: string };

const StepButton = ({ icon, disabled, color, onHold, label }: StepButtonProps) => {
  const press = usePressScale(0.88);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={() => {
        press.onPressIn();
        onHold(true);
      }}
      onPressOut={() => {
        press.onPressOut();
        onHold(false);
      }}
      style={[styles.stepBtn, disabled && { opacity: 0.3 }, press.style]}
    >
      <Ionicons name={icon} size={26} color={color} />
    </AnimatedPressable>
  );
};

/** Controle +/− com long-press acelerando, valor animado (bump) e limites min/max. */
export const Stepper = ({ value, onChange, min = 0, max = 99, step = 1, unit, color = colors.accent, valueSize = 44, style }: StepperProps) => {
  const reduced = useReducedMotion();
  const valueRef = useRef(value);
  valueRef.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bump = useSharedValue(1);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (!reduced) bump.value = withSequence(withTiming(1.15, { duration: 70 }), withSpring(1, SPRING));
  }, [value, reduced, bump]);

  const apply = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, valueRef.current + dir * step));
    if (next === valueRef.current) return false;
    valueRef.current = next;
    onChange(next);
    haptic.select();
    return true;
  };

  const hold = (dir: 1 | -1) => (start: boolean) => {
    stop();
    if (!start) return;
    apply(dir);
    let delay = 380;
    const tick = () => {
      if (!apply(dir)) return stop();
      delay = Math.max(50, delay * 0.8);
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, delay);
  };

  const valueStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  return (
    <View style={[styles.stepper, style]}>
      <StepButton icon="remove" label="Diminuir" color={color} disabled={value <= min} onHold={hold(-1)} />
      <Animated.View style={[styles.stepValue, valueStyle]}>
        <Text style={{ fontFamily: fonts.displayBold, fontSize: valueSize, lineHeight: valueSize * 1.1, color: colors.text, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
        {unit ? <Text variant="label">{unit}</Text> : null}
      </Animated.View>
      <StepButton icon="add" label="Aumentar" color={color} disabled={value >= max} onHold={hold(1)} />
    </View>
  );
};

export type SegmentOption<T extends string | number> = { value: T; label: string };
export type SegmentedControlProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Cor do indicador (padrão accent). */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Controle segmentado com indicador deslizante (spring). */
export function SegmentedControl<T extends string | number>({ options, value, onChange, color = colors.accent, style }: SegmentedControlProps<T>) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width > 0 ? (width - 8) / options.length : 0;
  const x = useSharedValue(index * segment);

  useEffect(() => {
    x.value = reduced ? index * segment : withSpring(index * segment, { damping: 18, stiffness: 240 });
  }, [index, segment, reduced, x]);

  const indicator = useAnimatedStyle(() => ({ width: segment, transform: [{ translateX: x.value }] }));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={[styles.segmented, style]}>
      {width > 0 ? <Animated.View style={[styles.indicator, { backgroundColor: color }, indicator]} /> : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptic.select();
                onChange(option.value);
              }
            }}
            style={styles.segment}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: selected ? colors.onAccent : colors.muted }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  color?: string;
  accessibilityLabel?: string;
};

/** Interruptor animado (trilho colorido + thumb com spring). */
export const Toggle = ({ value, onValueChange, disabled, color = colors.accent, accessibilityLabel }: ToggleProps) => {
  const reduced = useReducedMotion();
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? (value ? 1 : 0) : withSpring(value ? 1 : 0, { damping: 16, stiffness: 260 });
  }, [value, reduced, p]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [colors.line, color]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 22 }] }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptic.select();
        onValueChange(!value);
      }}
      style={disabled ? { opacity: 0.4 } : undefined}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.thumb, thumb]} />
      </Animated.View>
    </Pressable>
  );
};

export type FieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
};

/** Campo de texto escuro (numérico opcional, multilinha opcional). */
export const Field = ({ value, onChangeText, placeholder, numeric, multiline, maxLength, style }: FieldProps) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.muted}
    keyboardType={numeric ? 'numeric' : 'default'}
    multiline={multiline}
    maxLength={maxLength}
    selectionColor={colors.accent}
    style={[styles.field, multiline && { minHeight: 96, textAlignVertical: 'top' }, style]}
  />
);

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { alignItems: 'center', minWidth: 80 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.line },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: radius.sm + 2 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  track: { width: 52, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  field: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
