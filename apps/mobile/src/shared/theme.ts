export const color = {
  bg: '#F2EDE4',
  surface: '#FFFFFF',
  ink: '#0F0F0E',
  mute: 'rgba(15,15,14,0.55)',
  mute2: 'rgba(15,15,14,0.30)',
  line: 'rgba(15,15,14,0.08)',
  warm: '#E85D2C',
  danger: '#C73E1D',
} as const;

export const tone = {
  pedagogue: {
    bg: '#D9E4ED',
    ink: '#1F3B55',
    label: 'Pédagogue',
    desc: 'Comme un prof qui adore son sujet',
  },
  debate: {
    bg: '#F3D7CB',
    ink: '#6B2418',
    label: 'Débat',
    desc: "Deux visions qui s'accrochent",
  },
  vulgarization: {
    bg: '#F1E4B3',
    ink: '#5A4210',
    label: 'Vulgarisation',
    desc: 'Tout le monde suit, personne ne décroche',
  },
  interview: {
    bg: '#D5E6D8',
    ink: '#234A2E',
    label: 'Interview',
    desc: 'Questions directes, réponses franches',
  },
} as const;

export type ToneId = keyof typeof tone;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  '2xl': 32,
  '3xl': 56,
} as const;

export const radius = {
  sm: 8,
  chip: 14,
  md: 18,
  card: 22,
  pill: 28,
} as const;

export const type = {
  hero: { fontSize: 44, fontWeight: '500', letterSpacing: -1.8, lineHeight: 45 },
  title: { fontSize: 28, fontWeight: '500', letterSpacing: -0.6, lineHeight: 31 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 17, fontWeight: '500', letterSpacing: -0.2 },
  meta: { fontSize: 13, fontWeight: '400' },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.64,
    textTransform: 'uppercase' as const,
  },
  serif: { fontFamily: 'Georgia', fontStyle: 'italic' as const, fontWeight: '400' as const },
} as const;

export const motion = {
  easing: {
    standard: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  duration: { quick: 200, normal: 400, slow: 700 },
} as const;

export const shadow = {
  none: {},
  sm: {
    shadowColor: '#0F0F0E',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F0F0E',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 8,
  },
} as const;
