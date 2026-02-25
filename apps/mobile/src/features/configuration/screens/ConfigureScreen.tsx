import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { apiGet, apiPatch } from '../../../shared/services/api';
import { Slider } from '../../../shared/components/Slider';
import { Checkbox } from '../../../shared/components/Checkbox';
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

export function ConfigureScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [tone, setTone] = useState<string>(Tone.Pedagogue);
  const [duration, setDuration] = useState<number>(15);
  const [chapters, setChapters] = useState<number>(defaultChapters(15));
  const [noChapters, setNoChapters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    apiGet<Project>(`/api/projects/${projectId}`)
      .then((project) => {
        setTone(project.tone);
        setDuration(project.targetDuration);
        const isNoChapters = project.chapterCount === 1;
        setNoChapters(isNoChapters);
        setChapters(isNoChapters ? 1 : project.chapterCount);
      })
      .catch(() => {})
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
    try {
      await apiPatch<Project>(`/api/projects/${projectId}/configure`, payload);
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
      <Slider
        value={duration}
        min={AUDIO.MIN_DURATION}
        max={AUDIO.MAX_DURATION}
        onValueChange={handleDurationChange}
        testID="duration-slider"
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{AUDIO.MIN_DURATION} min</Text>
        <Text style={styles.sliderLabel}>{AUDIO.MAX_DURATION} min</Text>
      </View>

      <View style={styles.chapterSection}>
        <Text style={styles.sectionTitle}>Chapitres</Text>

        <Checkbox
          checked={noChapters}
          label="Pas de chapitre"
          onToggle={handleToggleNoChapters}
          testID="no-chapters-toggle"
        />

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
  chapterInfo: { fontSize: 13, color: '#999', marginBottom: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 12 },
  stepperButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 20, fontWeight: '600' },
  stepperValue: { fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
