import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../theme';
import { IconButton } from './Button';
import { staggerEntering } from './Motion';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Text } from './Text';

/** Altura útil da tab bar (sem a safe area). */
export const TAB_BAR_HEIGHT = 64;

export type ScreenProps = {
  children?: ReactNode;
  /** Usa ScrollView (padrão true). */
  scroll?: boolean;
  /** Tela dentro das abas: não aplica safe area inferior (a tab bar já cuida) e dá folga ao botão central. */
  tabs?: boolean;
  /** Remove o padding horizontal/vertical padrão. */
  bare?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Container de tela: SafeAreaView escuro, scroll opcional, padding e gap padrão. */
export const Screen = ({ children, scroll = true, tabs = false, bare = false, edges, style, contentContainerStyle }: ScreenProps) => {
  const safeEdges: Edge[] = edges ?? (tabs ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']);
  const pad = bare ? null : { padding: spacing.lg, paddingBottom: spacing.xl + (tabs ? 28 : 0), gap: spacing.md };
  return (
    <SafeAreaView edges={safeEdges} style={[styles.root, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[{ flexGrow: 1 }, pad, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

export type HeaderProps = {
  /** Texto pequeno acima do título. */
  eyebrow?: string;
  title: string;
  /** Elemento à direita (ex. IconButton). */
  right?: ReactNode;
  /** Mostra botão voltar (router.back por padrão). */
  back?: boolean;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Cabeçalho de tela: eyebrow + título grande Barlow, voltar e ação à direita opcionais. */
export const Header = ({ eyebrow, title, right, back, onBack, style }: HeaderProps) => {
  const router = useRouter();
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={reduced ? undefined : staggerEntering(0)} style={[styles.header, style]}>
      {back || onBack ? (
        <IconButton
          icon="chevron-back"
          variant="solid"
          accessibilityLabel="Voltar"
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          style={styles.back}
        />
      ) : null}
      <View style={styles.headerText}>
        {eyebrow ? <Text variant="label" color={colors.accent}>{eyebrow}</Text> : null}
        <Text variant="title" numberOfLines={2}>{title}</Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  back: { marginRight: 2 },
  right: { alignItems: 'flex-end' },
});
