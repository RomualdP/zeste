import { color, tone, space, radius, type, motion, shadow } from './theme';
import type { ToneId } from './theme';

describe('theme', () => {
  describe('color', () => {
    it('uses cream background, never pure white', () => {
      expect(color.bg).toBe('#F2EDE4');
      expect(color.surface).toBe('#FFFFFF');
    });

    it('uses warm black for ink, never #000', () => {
      expect(color.ink).toBe('#0F0F0E');
    });

    it('exposes mute scale based on ink alpha', () => {
      expect(color.mute).toBe('rgba(15,15,14,0.55)');
      expect(color.mute2).toBe('rgba(15,15,14,0.30)');
      expect(color.line).toBe('rgba(15,15,14,0.08)');
    });

    it('exposes warm accent and danger tokens', () => {
      expect(color.warm).toBe('#E85D2C');
      expect(color.danger).toBe('#C73E1D');
    });
  });

  describe('tone palettes', () => {
    it('defines the 4 podcast tones with bg + ink + label + desc', () => {
      expect(tone.pedagogue).toEqual({
        bg: '#D9E4ED',
        ink: '#1F3B55',
        label: 'Pédagogue',
        desc: 'Comme un prof qui adore son sujet',
      });
      expect(tone.debate.bg).toBe('#F3D7CB');
      expect(tone.debate.ink).toBe('#6B2418');
      expect(tone.vulgarization.bg).toBe('#F1E4B3');
      expect(tone.vulgarization.ink).toBe('#5A4210');
      expect(tone.interview.bg).toBe('#D5E6D8');
      expect(tone.interview.ink).toBe('#234A2E');
    });

    it('exposes ToneId as the union of tone keys', () => {
      const ids: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];
      expect(ids.every((id) => id in tone)).toBe(true);
    });
  });

  describe('space scale', () => {
    it('follows multiples of 4 with named gutter and topbar', () => {
      expect(space.xs).toBe(4);
      expect(space.sm).toBe(8);
      expect(space.md).toBe(12);
      expect(space.lg).toBe(16);
      expect(space.xl).toBe(22);
      expect(space['2xl']).toBe(32);
      expect(space['3xl']).toBe(56);
    });
  });

  describe('radius scale', () => {
    it('uses pill 28 for primary CTAs and card 22 for cards/bubbles', () => {
      expect(radius.sm).toBe(8);
      expect(radius.chip).toBe(14);
      expect(radius.md).toBe(18);
      expect(radius.card).toBe(22);
      expect(radius.pill).toBe(28);
    });
  });

  describe('typography', () => {
    it('exposes hero/title/body/label/meta/eyebrow with correct sizes', () => {
      expect(type.hero.fontSize).toBe(44);
      expect(type.hero.letterSpacing).toBe(-1.8);
      expect(type.title.fontSize).toBe(28);
      expect(type.body.fontSize).toBe(16);
      expect(type.body.lineHeight).toBe(24);
      expect(type.label.fontSize).toBe(17);
      expect(type.meta.fontSize).toBe(13);
      expect(type.eyebrow.textTransform).toBe('uppercase');
    });

    it('serif modifier targets Georgia italic', () => {
      expect(type.serif.fontFamily).toBe('Georgia');
      expect(type.serif.fontStyle).toBe('italic');
    });
  });

  describe('motion', () => {
    it('exposes durations matching design spec', () => {
      expect(motion.duration.quick).toBe(200);
      expect(motion.duration.normal).toBe(400);
      expect(motion.duration.slow).toBe(700);
    });

    it('exposes named easings', () => {
      expect(motion.easing.standard).toBe('cubic-bezier(0.2, 0.9, 0.3, 1)');
      expect(motion.easing.emphasized).toBe('cubic-bezier(0.2, 0, 0, 1)');
      expect(motion.easing.easeOut).toBe('cubic-bezier(0, 0, 0.2, 1)');
    });
  });

  describe('shadow', () => {
    it('provides sm and lg shadows on warm ink', () => {
      expect(shadow.sm.shadowColor).toBe('#0F0F0E');
      expect(shadow.sm.shadowOpacity).toBeCloseTo(0.06);
      expect(shadow.lg.shadowOpacity).toBeCloseTo(0.12);
    });
  });
});
