import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { haptic } from './Motion';
import { Text } from './Text';

export type ToastOptions = {
  message: string;
  /** Rótulo da ação (ex. "Desfazer"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Duração em ms (padrão 4000). */
  duration?: number;
  variant?: 'default' | 'success' | 'danger';
  /** 'bottom' (padrão) ou 'top'. */
  position?: 'top' | 'bottom';
  /** Distância da borda além da safe area (padrão 16; use ~90 sobre a tab bar). */
  offset?: number;
};

type ToastApi = { show: (options: ToastOptions) => void; hide: () => void };
type Current = ToastOptions & { id: number };

const ToastContext = createContext<ToastApi | undefined>(undefined);

/** Provider do Toast; monte uma vez no root layout. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [toast, setToast] = useState<Current>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    setToast(undefined);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      const id = Date.now() + Math.random();
      setToast({ ...options, id });
      if (options.variant === 'danger') haptic.warning();
      timer.current = setTimeout(() => setToast((current) => (current?.id === id ? undefined : current)), options.duration ?? 4000);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const api = useMemo(() => ({ show, hide }), [show, hide]);
  const top = toast?.position === 'top';
  const icon = toast?.variant === 'success' ? 'checkmark-circle' : toast?.variant === 'danger' ? 'alert-circle' : 'information-circle';
  const tint = toast?.variant === 'success' ? colors.success : toast?.variant === 'danger' ? colors.danger : colors.accent;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={reduced ? undefined : FadeInDown.springify().damping(16)}
            exiting={reduced ? undefined : FadeOutDown.duration(200)}
            style={[
              styles.toast,
              top
                ? { top: insets.top + (toast.offset ?? spacing.md) }
                : { bottom: insets.bottom + (toast.offset ?? spacing.md) },
            ]}
          >
            <Ionicons name={icon} size={22} color={tint} />
            <Text variant="body" style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  haptic.light();
                  const action = toast.onAction;
                  hide();
                  action?.();
                }}
              >
                <Text variant="label" color={colors.accent} style={styles.action}>
                  {toast.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
};

/** Hook: `const toast = useToast(); toast.show({ message, actionLabel, onAction })`. */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  message: { flex: 1, fontFamily: 'Inter_500Medium' },
  action: { fontSize: 13 },
});
