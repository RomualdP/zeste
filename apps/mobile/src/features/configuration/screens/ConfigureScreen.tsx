import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { apiPatch } from '../../../shared/services/api';
import { Tone, TargetDuration, AUDIO } from '@zeste/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'Configure'>;

const TONES = [
  { value: Tone.Pedagogue, label: 'Pédagogue' },
  { value: Tone.Debate, label: 'Débat' },
  { value: Tone.Vulgarization, label: 'Vulgarisation' },
  { value: Tone.Interview, label: 'Interview' },
];

const DURATIONS = [
  { value: TargetDuration.Short, label: '5 min' },
  { value: TargetDuration.Medium, label: '15 min' },
  { value: TargetDuration.Long, label: '30 min' },
];

export function ConfigureScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [tone, setTone] = useState<string>(Tone.Pedagogue);
  const [duration, setDuration] = useState<number>(TargetDuration.Medium);
  const [chapters, setChapters] = useState<number>(AUDIO.DEFAULT_CHAPTERS[TargetDuration.Medium]);
  const [loading, setLoading] = useState(false);

  const maxChapters = AUDIO.MAX_CHAPTERS_PER_DURATION[duration as keyof typeof AUDIO.MAX_CHAPTERS_PER_DURATION] ?? AUDIO.MAX_CHAPTERS;

  const handleDurationChange = (d: number) => {
    setDuration(d);
    const defaultCh = AUDIO.DEFAULT_CHAPTERS[d as keyof typeof AUDIO.DEFAULT_CHAPTERS] ?? 3;
    setChapters(defaultCh);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiPatch<Project>(`/api/projects/${projectId}/configure`, {
        tone,
        targetDuration: duration,
        chapterCount: chapters,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

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

      <Text style={styles.sectionTitle}>Durée cible</Text>
      <View style={styles.options}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.option, duration === d.value && styles.optionActive]}
            onPress={() => handleDurationChange(d.value)}
          >
            <Text style={[styles.optionText, duration === d.value && styles.optionTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Chapitres ({chapters}/{maxChapters})</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  optionActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 12 },
  stepperButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 20, fontWeight: '600' },
  stepperValue: { fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
