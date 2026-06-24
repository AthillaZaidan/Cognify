export const Colors = {
  background: '#F5F8FF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3FC',
  card: '#FFFFFF',

  accent: '#3B5DE7',
  accentDark: '#2A47C7',
  accentLight: 'rgba(59,93,231,0.08)',
  accentSoft: '#EBF0FE',

  text: '#0F1B2E',
  textMuted: '#6B7A99',
  textSubtle: '#9BA8C0',

  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.08)',
  successSoft: '#E8FBF0',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.08)',
  warningSoft: '#FEF6E7',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  dangerSoft: '#FEF0F0',

  border: '#E2E8F5',
  borderLight: '#EDF2FA',

  onAccent: '#FFFFFF',
  onAccentMuted: 'rgba(255,255,255,0.75)',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: 'rgba(255,255,255,0.72)',

  headerNavy: '#0F1B2E',

  interventionFocus: '#F59E0B',
  interventionSleep: '#7C6FBC',
  interventionDeep: '#3B5DE7',
  interventionScreen: '#06B6D4',
  interventionRoutine: '#22C55E',

  riskStable: '#22C55E',
  riskMild: '#F59E0B',
  riskSevere: '#EF4444',

  illustrationBlue: '#5B82F0',
  illustrationBlueLight: '#A3C0FA',
  illustrationBlueDark: '#2A47C7',
  illustrationGold: '#F0C060',
  illustrationTeal: '#5BD4D0',
  illustrationCoral: '#F08A7A',
  illustrationLavender: '#B8A0F0',
  illustrationWhite: '#FFFFFF',

  secondary: '#3B5DE7',
  primary: '#3B5DE7',
  base: '#F5F8FF',
  glass: 'rgba(255,255,255,0.9)',
  glassBorder: 'rgba(59,93,231,0.08)',
} as const;

export function headerColors(_risk: string): readonly [string, string] {
  return [Colors.headerNavy, '#1E2940'] as const;
}