import { ReactNode } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors, fonts } from '../theme';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'number';

const variants: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 64, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40, color: colors.text, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 24, lineHeight: 28, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  label: { fontFamily: fonts.bodySemibold, fontSize: 12, lineHeight: 16, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  number: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.text, fontVariant: ['tabular-nums'] },
};

export type TextProps = RNTextProps & {
  /** Estilo tipográfico (padrão: body). */
  variant?: TextVariant;
  /** Sobrescreve a cor da variante. */
  color?: string;
  align?: TextStyle['textAlign'];
  children?: ReactNode;
};

/** Texto tipado com variantes do tema. */
export const Text = ({ variant = 'body', color, align, style, ...rest }: TextProps) => (
  <RNText {...rest} style={[variants[variant], color ? { color } : null, align ? { textAlign: align } : null, style]} />
);

/** Atalho: rótulo em caixa alta (variante label). */
export const Label = (props: Omit<TextProps, 'variant'>) => <Text {...props} variant="label" />;
