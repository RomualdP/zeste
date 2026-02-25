import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, PanResponder, LayoutChangeEvent } from 'react-native';
import { apiGet, apiPatch } from '../../../shared/services/api';
import { Tone, AUDIO, defaultChapters, maxChaptersForDuration } from '@zeste/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'Configure'>;

const TONES = [
  { value: Tone.Pedagogue, label: 'Pedagogue' },
  { value: Tone.Debate, label: 'Debat' },
  { value: Tone.Vulgarization, label: 'Vulgarisation' },
  { value: Tone.Interview, label: 'Interview' },
];

function DurationSlider({ value, min, max, onValueChange }: { value: number; min: number; max: number; onValueChange: (v: number) => void }) {
  const trackWidth = useRef(0);
  const trackX = useRef(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v)));
  const fraction = (value - min) / (max - min);

  const valueFromX = useCallback((x: number) => {
    if (trackWidth.current === 0) return value;
    const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
    return clamp(min + ratio * (max - min));
  }, [min, max, value]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        onValueChange(valueFromX(x));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.pageX - trackX.current;
        onValueChange(valueFromX(x));
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
    trackX.current = e.nativeEvent.layout.x;
  };

  const onLayoutTrack = (e: LayoutChangeEvent) => {
    e.target.measure((_x: number, _y: number, _w: number, _h: number, pageX: number) => {
      trackX.current = pageX;
      trackWidth.current = e.nativeEvent.layout.width;
    });
  };

  return (
    <View
      style={sliderStyles.container}
      onLayout={onLayoutTrack}
      {...panResponder.panHandlers}
    >
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.trackFilled, { width: `${fraction * 100}%` }]} />
      </View>
      <View style={[sliderStyles.thumb, { left: `${fraction * 100}%` }]} />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { height: 40, justifyContent: 'center', marginVertical: 8 },
  track: { height: 4, backgroundColor: '#ddd', borderRadius: 2, overflow: 'hidden' },
  trackFilled: { height: 4, backgroundColor: '#FF6B35', borderRadius: 2 },
  thumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF6B35', marginLeft: -12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
});

export function ConfigureScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [tone, setTone] = useState<string>(Tone.Pedagogue);
  const [duration, setDuration] = useState<number>(15);
  const [chapters, setChapters] = useState<number>(defaultChapters(15));
  const [noChapters, setNoChapters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load current project configuration
  useEffect(() => {
    apiGet<Project>(`/api/projects/${projectId}`)
      .then((project) => {
        setTone(project.tone);
        setDuration(project.targetDuration);
        const isNoChapters = project.chapterCount === 1;
        setNoChapters(isNoChapters);
        setChapters(isNoChapters ? 1 : project.chapterCount);
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => setInitialLoading(false));
  }, [projectId]);

  const maxChapters = maxChaptersForDuration(duration);

  const handleDurationChange = (d: number) => {
    setDuration(d);
    if (!noChapters) {
      const def = defaultChapters(d);
      setChapters(Math.min(def, maxChaptersForDuration(d)));
    }
  };

  const handleToggleNoChapters = () => {
    if (noChapters) {
      // Re-enable chapters: set to default for current duration
      setNoChapters(false);
      setChapters(defaultChapters(duration));
    } else {
      setNoChapters(true);
      setChapters(1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const chapterCount = noChapters ? 1 : chapters;
    const payload = { tone, targetDuration: duration, chapterCount };
    console.log('[CONFIGURE] Submitting:', payload, '\u2192', `/api/projects/${projectId}/configure`);
    try {
      const result = await apiPatch<Project>(`/api/projects/${projectId}/configure`, payload);
      console.log('[CONFIGURE] Success:', result);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Ton</Text>
      <View style={styles.options}>
        {TONES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.option, tone === t.value && styles.optionActive]}
            onPress={() => setTone(t.value)}
          >
            <Text style={[styles.optionText, tone === t.value && styles.optionTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Duree cible</Text>
      <Text style={styles.durationValue}>{duration} min</Text>
      <DurationSlider
        value={duration}
        min={AUDIO.MIN_DURATION}
        max={AUDIO.MAX_DURATION}
        onValueChange={handleDurationChange}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{AUDIO.MIN_DURATION} min</Text>
        <Text style={styles.sliderLabel}>{AUDIO.MAX_DURATION} min</Text>
      </View>

      <View style={styles.chapterSection}>
        <Text style={styles.sectionTitle}>Chapitres</Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={handleToggleNoChapters}
          testID="no-chapters-toggle"
        >
          <View style={[styles.checkbox, noChapters && styles.checkboxChecked]}>
            {noChapters && <Text style={styles.checkmark}>{'\u2713'}</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Pas de chapitre</Text>
        </TouchableOpacity>

        {!noChapters && (
          <>
            <Text style={styles.chapterInfo}>{chapters}/{maxChapters}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setChapters(Math.max(AUDIO.MIN_CHAPTERS, chapters - 1))}
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{chapters}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setChapters(Math.min(maxChapters, chapters + 1))}
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        testID="configure-submit"
      >
        <Text style={styles.buttonText}>
          {loading ? 'Configuration...' : 'Valider la configuration'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  optionActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  durationValue: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#FF6B35', marginBottom: 4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderLabel: { fontSize: 12, color: '#999' },
  chapterSection: { marginTop: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 15, color: '#333' },
  chapterInfo: { fontSize: 13, color: '#999', marginBottom: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 12 },
  stepperButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 20, fontWeight: '600' },
  stepperValue: { fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
