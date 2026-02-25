import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { apiPost } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { SharedLink } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'Share'>;

const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5173';

export function ShareScreen({ route }: Props) {
  const { projectId } = route.params;
  const [link, setLink] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = link ? `${WEB_BASE_URL}/${link.slug}` : null;

  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const data = await apiPost<SharedLink>(`/api/projects/${projectId}/share`);
      setLink(data);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await Clipboard.setStringAsync(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partager le podcast</Text>
      <Text style={styles.subtitle}>
        Créez un lien public pour partager votre podcast avec n'importe qui.
      </Text>

      {!link && (
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateLink}
          disabled={loading}
          testID="create-share-link"
        >
          <Text style={styles.buttonText}>
            {loading ? 'Création...' : 'Créer un lien de partage'}
          </Text>
        </TouchableOpacity>
      )}

      {shareUrl && (
        <View style={styles.linkSection}>
          <Text style={styles.linkLabel}>Lien public</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{shareUrl}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            testID="copy-link-button"
          >
            <Text style={styles.copyButtonText}>
              {copied ? 'Copié !' : 'Copier le lien'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkSection: { marginTop: 24 },
  linkLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  linkBox: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 12 },
  linkText: { fontSize: 14, color: '#333', fontFamily: 'monospace' },
  copyButton: { backgroundColor: '#333', borderRadius: 8, padding: 12, alignItems: 'center' },
  copyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
