import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GenerationPhase } from '@zeste/shared';
import { Button } from '../../../shared/components';
import { color, space, tone, type, ToneId } from '../../../shared/theme';
import { useGenerationStatus } from '../hooks/useGenerationStatus';
import { PulsingRing } from '../components/PulsingRing';

interface GeneratingScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VALID_TONES: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];

function safeTone(value: unknown): ToneId {
  if (typeof value === 'string' && (VALID_TONES as string[]).includes(value)) {
    return value as ToneId;
  }
  return 'pedagogue';
}

function initialFor(t: ToneId): string {
  return tone[t].label.charAt(0).toUpperCase();
}

export function GeneratingScreen({ navigation, route }: GeneratingScreenProps) {
  const projectId: string = route?.params?.projectId ?? '';
  const toneId = safeTone(route?.params?.tone);
  const palette = tone[toneId];

  const { status, retry } = useGenerationStatus(projectId);

  useEffect(() => {
    if (status.phase === GenerationPhase.Ready) {
      navigation.replace('Player', { projectId });
    }
  }, [status.phase, navigation, projectId]);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <View style={styles.heart}>
        <PulsingRing delayMs={0} toneInk={palette.ink} testID="generating-ring-1" />
        <PulsingRing delayMs={800} toneInk={palette.ink} testID="generating-ring-2" />
        <PulsingRing delayMs={1600} toneInk={palette.ink} testID="generating-ring-3" />
        <Text style={[styles.glyph, type.serif, { color: palette.ink }]}>
          {initialFor(toneId)}
        </Text>
      </View>

      <View style={styles.body}>
        {status.phase === GenerationPhase.Error ? (
          <ErrorBlock message={status.error} onRetry={retry} />
        ) : (
          <PhaseLabel phase={status.phase} ink={palette.ink} />
        )}
      </View>

      <View style={styles.footer}>
        <Button
          variant="secondary"
          label="Continuer en arrière-plan"
          onPress={() => navigation.navigate('Library')}
          testID="generating-background"
        />
      </View>
    </View>
  );
}

function PhaseLabel({ phase, ink }: { phase: GenerationPhase; ink: string }) {
  if (phase === GenerationPhase.Plan) {
    return (
      <Text style={[styles.label, { color: ink }]}>
        On structure le{' '}
        <Text style={[styles.label, type.serif, { color: ink }]}>plan</Text>…
      </Text>
    );
  }
  if (phase === GenerationPhase.Scenario) {
    return (
      <Text style={[styles.label, { color: ink }]}>
        On écrit le{' '}
        <Text style={[styles.label, type.serif, { color: ink }]}>dialogue</Text>…
      </Text>
    );
  }
  if (phase === GenerationPhase.Audio) {
    return (
      <Text style={[styles.label, { color: ink }]}>
        On enregistre les{' '}
        <Text style={[styles.label, type.serif, { color: ink }]}>voix</Text>…
      </Text>
    );
  }
  return <Text style={[styles.label, { color: ink }]}>On démarre…</Text>;
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => Promise<void>;
}) {
  const handleRetry = () => {
    onRetry().catch(() => {
      // useGenerationStatus.retry already routes apiPost rejections through fetchStatus catch.
    });
  };

  return (
    <View style={styles.errorBlock}>
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{message ?? 'Une erreur est survenue.'}</Text>
      </View>
      <Button label="Réessayer" onPress={handleRetry} testID="generating-retry" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.xl,
    paddingVertical: space['2xl'],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heart: {
    flex: 1,
    width: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 96,
    lineHeight: 110,
  },
  body: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    textAlign: 'center',
  },
  errorBlock: {
    width: '100%',
    gap: space.md,
    alignItems: 'center',
  },
  errorBox: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: color.danger,
    borderRadius: 18,
    backgroundColor: color.surface,
    maxWidth: '100%',
  },
  errorText: {
    color: color.danger,
    fontSize: type.body.fontSize,
    textAlign: 'center',
  },
  footer: {
    paddingTop: space.lg,
    width: '100%',
  },
});

