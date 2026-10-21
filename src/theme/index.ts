import type { MovementKey } from '../domain/models';

export const colors = {
  bg: '#0B0B0D',
  surface: '#16161A',
  surfaceRaised: '#202026',
  line: '#2C2C34',
  text: '#F5F5F7',
  muted: '#8E8E98',
  danger: '#FF4D4D',
  success: '#3DDC84',
  accent: '#FF7A1A',
  accentAlt: '#FF4FA3',
  onAccent: '#0B0B0D',
  white: '#FFFFFF',
  // Aliases temporários para as telas ainda não redesenhadas.
  ink: '#0B0B0D',
  lime: '#FF7A1A',
};

export const movementColors: Record<MovementKey, string> = {
  pull: '#FF7A1A',
  push: '#2E8BFF',
  squat: '#FF4FA3',
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
