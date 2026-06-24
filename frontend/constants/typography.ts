import type { TextStyle } from 'react-native';

export const Font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  hero:       { fontFamily: Font.extrabold, fontSize: 40, lineHeight: 48, letterSpacing: -1 } satisfies TextStyle,
  screenTitle:{ fontFamily: Font.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6 } satisfies TextStyle,
  cardTitle:  { fontFamily: Font.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.2 } satisfies TextStyle,
  section:    { fontFamily: Font.semibold, fontSize: 14, lineHeight: 20, letterSpacing: 0.4, textTransform: 'uppercase' as const } satisfies TextStyle,
  body:       { fontFamily: Font.regular, fontSize: 15, lineHeight: 23 } satisfies TextStyle,
  bodyMuted:  { fontFamily: Font.regular, fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  caption:    { fontFamily: Font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, textTransform: 'uppercase' as const } satisfies TextStyle,
  metric:     { fontFamily: Font.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 } satisfies TextStyle,
  metricMd:   { fontFamily: Font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 } satisfies TextStyle,
} as const;
