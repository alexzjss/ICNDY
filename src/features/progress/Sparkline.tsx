import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme';
import { buildPoints, linePath, polylineLength } from './chartMath';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = { values: number[]; height?: number; color?: string; delay?: number };

/** Mini gráfico de linha que se desenha ao aparecer. */
export const Sparkline = ({ values, height = 44, color = colors.accent, delay = 300 }: Props) => {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(reduced ? 1 : 0);
  const pad = { left: 4, right: 6, top: 6, bottom: 6 };
  const signature = values.join(',');
  const points = buildPoints(values, width, height, pad);
  const length = Math.max(1, polylineLength(points));

  useEffect(() => {
    if (reduced || width === 0) return;
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [width, signature, reduced, delay, progress]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));
  const dotProps = useAnimatedProps(() => ({ opacity: progress.value >= 0.98 ? 1 : 0 }));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const last = points[points.length - 1];

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && points.length > 0 ? (
        <Svg width={width} height={height}>
          {points.length > 1 ? (
            <AnimatedPath
              d={linePath(points)}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={length}
              animatedProps={lineProps}
            />
          ) : null}
          <AnimatedCircle cx={last.x} cy={last.y} r={4} fill={color} animatedProps={dotProps} />
        </Svg>
      ) : null}
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
