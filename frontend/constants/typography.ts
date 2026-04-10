import type { TextStyle } from 'react-native';

export const Font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  titleLogin: { fontFamily: Font.extrabold, fontSize: 34, letterSpacing: -0.6 } satisfies TextStyle,
  screenTitle: { fontFamily: Font.bold, fontSize: 24, letterSpacing: -0.3 } satisfies TextStyle,
  section: { fontFamily: Font.semibold, fontSize: 15, letterSpacing: 0.1 } satisfies TextStyle,
  body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22 } satisfies TextStyle,
  bodyMuted: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20 } satisfies TextStyle,
  caption: { fontFamily: Font.medium, fontSize: 12, letterSpacing: 0.1 } satisfies TextStyle,
  metric: { fontFamily: Font.bold, fontSize: 22, letterSpacing: -0.3 } satisfies TextStyle,
} as const;
