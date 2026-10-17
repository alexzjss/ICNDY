export type ThemeIntensity = 'discreet' | 'vibrant' | 'contrast';
export type ThemeColors = typeof colors;

export const colors = {
  ink: '#080A09',
  background: '#0D100E',
  surface: '#151A16',
  surfaceRaised: '#202720',
  glass: 'rgba(28, 34, 29, 0.92)',
  lime: '#D8FF38',
  limeSoft: 'rgba(216, 255, 56, 0.14)',
  text: '#F3F4EB',
  muted: '#9B9F98',
  line: '#2C352D',
  danger: '#FF765F',
  white: '#FFFFFF',
};
const themeVariants: Record<ThemeIntensity, Partial<ThemeColors>> = {
  discreet: { lime: '#B8D84A', limeSoft: 'rgba(184, 216, 74, 0.10)', muted: '#A7AAA3' },
  vibrant: {},
  contrast: { lime: '#E5FF63', text: '#FFFFFF', muted: '#C4C8C0', line: '#465348' },
};
export const getThemeColors = (intensity: ThemeIntensity): ThemeColors => ({ ...colors, ...themeVariants[intensity] });
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 };
export const radii = { sm: 10, md: 16, lg: 24, pill: 999 };
