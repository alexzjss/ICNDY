import type { MovementKey } from '../domain/models';

export const colors = {
  bg: '#000000',
  surface: '#0B0B0B',
  surfaceRaised: '#141414',
  line: '#232323',
  text: '#FFFFFF',
  muted: '#8C8C8C',
  danger: '#FF3B30',
  success: '#00E05A',
  accent: '#C6FF00',
  accentAlt: '#00E05A',
  onAccent: '#000000',
  white: '#FFFFFF',
  glow: '#C6FF00',
};

export const movementColors: Record<MovementKey, string> = {
  pull: '#C6FF00',
  push: '#00E05A',
  squat: '#7CFFB2',
};

const MOVEMENT_ORDER: MovementKey[] = ['pull', 'push', 'squat'];

/** Cor do round (0-based): cicla pull -> push -> squat. */
export const roundColor = (roundIndex: number) =>
  movementColors[MOVEMENT_ORDER[((Math.trunc(roundIndex) % 3) + 3) % 3]];

export const fonts = {
  display: 'BarlowCondensed_800ExtraBold',
  displayBold: 'BarlowCondensed_900Black',
  displaySemi: 'BarlowCondensed_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

/** Gradiente de destaque (limão tóxico -> verde). */
export const gradients = {
  accent: ['#C6FF00', '#00E05A'] as const,
};

/** Adiciona alpha (0-1) a uma cor #RRGGBB. */
export const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0')}`;
