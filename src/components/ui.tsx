import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { useApp } from '../context/AppContext';

export const Screen = ({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) => {
  const { theme } = useApp();
  const content = <View style={[styles.screen, { backgroundColor: theme.background }]}>{children}</View>;
  return scroll ? <ScrollView style={[styles.root, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{content}</ScrollView> : <View style={[styles.root, { backgroundColor: theme.background }]}>{content}</View>;
};
export const Label = ({ children }: { children: ReactNode }) => { const { theme } = useApp(); return <Text style={[styles.label, { color: theme.muted }]}>{children}</Text>; };
export const Title = ({ children, size = 32 }: { children: ReactNode; size?: number }) => { const { theme } = useApp(); return <Text style={[styles.title, { color: theme.text, fontSize: size }]}>{children}</Text>; };
export const Card = ({ children, accent = false }: { children: ReactNode; accent?: boolean }) => { const { theme } = useApp(); return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }, accent && { borderColor: theme.lime, backgroundColor: theme.limeSoft }]}>{children}</View>; };
export const Button = ({ children, onPress, secondary = false, danger = false }: { children: ReactNode; onPress: () => void; secondary?: boolean; danger?: boolean }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={typeof children === 'string' ? children : undefined} hitSlop={6} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, danger && styles.danger, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{children}</Text>
  </Pressable>
);
export const Field = ({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) => (
  <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.field} />
);
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  screen: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120, gap: spacing.md },
  title: { color: colors.text, fontWeight: '900', letterSpacing: -1.2 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.line },
  accentCard: { borderColor: colors.lime, backgroundColor: colors.limeSoft },
  button: { backgroundColor: colors.lime, minHeight: 56, paddingHorizontal: spacing.lg, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  secondaryText: { color: colors.text },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.7 },
  field: { backgroundColor: colors.surfaceRaised, color: colors.text, borderRadius: radii.md, padding: 14, fontSize: 20, fontWeight: '800' },
});
