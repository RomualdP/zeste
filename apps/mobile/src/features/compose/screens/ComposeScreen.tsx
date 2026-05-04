import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bubble,
  Button,
  Chip,
  Header,
  InputBar,
  Slider,
  ToneCard,
} from '../../../shared/components';
import { color, space, tone, type, ToneId } from '../../../shared/theme';
import { useComposeFlow, ComposePhase } from '../hooks/useComposeFlow';

const TONE_ORDER: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];
const PHASE_TO_STEP: Record<ComposePhase, number> = {
  name: 1,
  sources: 2,
  tone: 3,
  duration: 4,
  ready: 4,
};

interface ComposeScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

export function ComposeScreen({ navigation }: ComposeScreenProps) {
  const flow = useComposeFlow();
  const [draftName, setDraftName] = useState('');
  const [draftSource, setDraftSource] = useState('');

  const onSubmitName = async () => {
    await flow.submitName(draftName);
    setDraftName('');
  };

  const onAddSource = async () => {
    if (draftSource.trim().length === 0) return;
    await flow.addSource({ type: 'url', value: draftSource.trim() });
    setDraftSource('');
  };

  const onLaunch = async () => {
    const result = await flow.submit();
    if (result) {
      navigation.navigate('Generating', { projectId: result.projectId });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        steps={{ total: 4, current: PHASE_TO_STEP[flow.phase] }}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Conversation flow={flow} />
        {flow.phase === 'tone' ? <TonePicker flow={flow} /> : null}
        {flow.phase === 'duration' ? <DurationPanel flow={flow} /> : null}
        {flow.error ? (
          <View testID="compose-error" style={styles.errorBox}>
            <Text style={styles.errorText}>{flow.error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <PhaseInput
        flow={flow}
        draftName={draftName}
        onChangeDraftName={setDraftName}
        onSubmitName={onSubmitName}
        draftSource={draftSource}
        onChangeDraftSource={setDraftSource}
        onAddSource={onAddSource}
        onContinueSources={flow.advanceToTone}
        onLaunch={onLaunch}
      />
    </KeyboardAvoidingView>
  );
}

function Conversation({ flow }: { flow: ReturnType<typeof useComposeFlow> }) {
  return (
    <View style={styles.conversation}>
      <Bubble from="app">Hello 👋 On commence par un nom pour cet épisode ?</Bubble>

      {flow.name ? <Bubble from="user">{flow.name}</Bubble> : null}

      {flow.phase !== 'name' ? (
        <Bubble from="app">
          Parfait. Maintenant colle tes sources. URL, PDF, ou texte.
        </Bubble>
      ) : null}

      {flow.sources.map((source) => (
        <Bubble key={source.id} from="user">
          <View style={styles.sourceBubbleRow}>
            <Chip label={source.type.toUpperCase()} />
            <Text style={styles.sourceValue} numberOfLines={1}>
              {truncate(source.value, 36)}
            </Text>
          </View>
        </Bubble>
      ))}

      {flow.phase === 'tone' || flow.phase === 'duration' || flow.phase === 'ready' ? (
        <Bubble from="app">
          <Text style={styles.bubbleText}>
            Quel <Text style={[styles.bubbleText, type.serif]}>ton</Text> veux-tu ?
          </Text>
        </Bubble>
      ) : null}

      {flow.tone ? <Bubble from="user">{tone[flow.tone].label}</Bubble> : null}

      {flow.phase === 'duration' || flow.phase === 'ready' ? (
        <Bubble from="app">Combien de temps ?</Bubble>
      ) : null}
    </View>
  );
}

function TonePicker({ flow }: { flow: ReturnType<typeof useComposeFlow> }) {
  return (
    <FlatList
      horizontal
      data={TONE_ORDER}
      keyExtractor={(id) => id}
      contentContainerStyle={styles.toneList}
      showsHorizontalScrollIndicator={false}
      snapToInterval={176}
      decelerationRate="fast"
      renderItem={({ item }) => (
        <View style={styles.toneCardWrap}>
          <ToneCard
            toneId={item}
            selected={flow.tone === item}
            onPress={() => flow.selectTone(item)}
            testID={`compose-tone-card-${item}`}
          />
        </View>
      )}
    />
  );
}

function DurationPanel({ flow }: { flow: ReturnType<typeof useComposeFlow> }) {
  const chaptered = flow.chapters !== null;
  return (
    <View style={styles.duration}>
      <View style={styles.durationHero}>
        <Text style={styles.durationNumber}>{flow.duration}</Text>
        <Text style={[styles.durationUnit, type.serif]}>min</Text>
      </View>

      <Slider
        min={5}
        max={60}
        step={1}
        value={flow.duration}
        onValueChange={flow.setDuration}
      />

      <Text style={styles.subQuestion}>Chapitré ?</Text>
      <View style={styles.chapterChoices}>
        <Chip
          label="Oui"
          active={chaptered}
          onPress={() => flow.setChapters(flow.chapters ?? defaultChapters(flow.duration))}
        />
        <Chip
          label="Non"
          active={!chaptered}
          onPress={() => flow.setChapters(null)}
        />
      </View>

      {chaptered ? (
        <Stepper
          value={flow.chapters ?? 1}
          min={2}
          max={maxChapters(flow.duration)}
          onChange={flow.setChapters}
        />
      ) : null}
    </View>
  );
}

interface PhaseInputProps {
  flow: ReturnType<typeof useComposeFlow>;
  draftName: string;
  onChangeDraftName: (v: string) => void;
  onSubmitName: () => void;
  draftSource: string;
  onChangeDraftSource: (v: string) => void;
  onAddSource: () => void;
  onContinueSources: () => void;
  onLaunch: () => void;
}

function PhaseInput({
  flow,
  draftName,
  onChangeDraftName,
  onSubmitName,
  draftSource,
  onChangeDraftSource,
  onAddSource,
  onContinueSources,
  onLaunch,
}: PhaseInputProps) {
  if (flow.phase === 'name') {
    return (
      <InputBar
        value={draftName}
        onChangeText={onChangeDraftName}
        onSubmit={onSubmitName}
        placeholder="Donne-lui un titre"
      />
    );
  }

  if (flow.phase === 'sources') {
    return (
      <View>
        {flow.sources.length > 0 ? (
          <View style={styles.continueWrap}>
            <Button
              variant="secondary"
              label="Continuer"
              icon={<Text style={styles.continueArrow}>→</Text>}
              onPress={onContinueSources}
              testID="compose-continue-sources"
            />
          </View>
        ) : null}
        <InputBar
          value={draftSource}
          onChangeText={onChangeDraftSource}
          onSubmit={onAddSource}
          placeholder="Coller une URL"
        />
      </View>
    );
  }

  if (flow.phase === 'duration') {
    return (
      <View style={styles.launchWrap}>
        <Button
          label="Lancer la génération"
          icon={<Text style={styles.continueArrow}>→</Text>}
          onPress={onLaunch}
          loading={flow.isLoading}
          testID="compose-launch"
        />
      </View>
    );
  }

  return null;
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepGlyph}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepGlyph}>+</Text>
      </Pressable>
    </View>
  );
}

function defaultChapters(duration: number) {
  return Math.max(2, Math.min(maxChapters(duration), Math.floor(duration / 6)));
}

function maxChapters(duration: number) {
  return Math.min(10, Math.max(2, Math.floor(duration / 5)));
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  scroll: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    flexGrow: 1,
  },
  conversation: {
    gap: 0,
  },
  bubbleText: {
    fontSize: type.body.fontSize,
    color: color.ink,
  },
  sourceBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sourceValue: {
    color: color.bg,
    fontSize: type.body.fontSize,
    flexShrink: 1,
  },
  toneList: {
    paddingVertical: space.sm,
    gap: space.sm,
  },
  toneCardWrap: {
    marginRight: space.sm,
  },
  duration: {
    paddingVertical: space.lg,
    gap: space.lg,
  },
  durationHero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: space.sm,
  },
  durationNumber: {
    fontSize: type.hero.fontSize,
    fontWeight: type.hero.fontWeight,
    letterSpacing: type.hero.letterSpacing,
    color: color.ink,
  },
  durationUnit: {
    fontSize: type.hero.fontSize,
    color: color.mute,
  },
  subQuestion: {
    fontSize: type.label.fontSize,
    color: color.ink,
    marginTop: space.lg,
  },
  chapterChoices: {
    flexDirection: 'row',
    gap: space.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.sm,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: {
    fontSize: 22,
    color: color.ink,
  },
  stepValue: {
    fontSize: type.title.fontSize,
    fontWeight: type.title.fontWeight,
    color: color.ink,
    minWidth: 30,
    textAlign: 'center',
  },
  continueWrap: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
  },
  continueArrow: {
    color: color.ink,
    fontSize: 18,
  },
  launchWrap: {
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  errorBox: {
    marginTop: space.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: color.danger,
    borderRadius: 18,
    backgroundColor: color.surface,
  },
  errorText: {
    color: color.danger,
    fontSize: type.body.fontSize,
  },
});
