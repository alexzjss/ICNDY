export type ThemeIntensity = 'discreet' | 'vibrant' | 'contrast';
export type ThemeColors = typeof colors;

export const colors = {
  ink: '#080B08',
  background: '#0B0F0B',
  surface: '#121812',
  surfaceRaised: '#1B231B',
  glass: 'rgba(18, 24, 18, 0.96)',
  lime: '#B8F23B',
  limeSoft: 'rgba(184, 242, 59, 0.12)',
  text: '#F3F5EE',
  muted: '#A0A89B',
  line: '#2B352A',
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
