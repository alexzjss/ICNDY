import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '../theme';

export const Screen = ({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) => {
  const content = <View style={styles.screen}>{children}</View>;
  return scroll ? <ScrollView style={styles.root} contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView> : content;
};
export const Label = ({ children }: { children: ReactNode }) => <Text style={styles.label}>{children}</Text>;
export const Title = ({ children, size = 32 }: { children: ReactNode; size?: number }) => <Text style={[styles.title, { fontSize: size }]}>{children}</Text>;
export const Card = ({ children }: { children: ReactNode }) => <View style={styles.card}>{children}</View>;
export const Button = ({ children, onPress, secondary = false, danger = false }: { children: ReactNode; onPress: () => void; secondary?: boolean; danger?: boolean }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, danger && styles.danger, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{children}</Text>
  </Pressable>
);
export const Field = ({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) => (
  <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.field} />
);
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  screen: { padding: spacing.lg, paddingBottom: 48, gap: spacing.md },
  title: { color: colors.text, fontWeight: '900', letterSpacing: -1.2 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.line },
  button: { backgroundColor: colors.lime, minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line },
  secondaryText: { color: colors.text },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.7 },
  field: { backgroundColor: colors.surfaceRaised, color: colors.text, borderRadius: 12, padding: 14, fontSize: 20, fontWeight: '800' },
});
