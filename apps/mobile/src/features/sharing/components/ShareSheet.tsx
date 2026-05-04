import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { apiPost } from '../../../shared/services/api';
import { color, radius, space, type } from '../../../shared/theme';
import type { SharedLink } from '@zeste/shared';

const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5173';

export interface ShareSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface ShareSheetProps {
  projectId: string;
}

export const ShareSheet = forwardRef<ShareSheetHandle, ShareSheetProps>(
  function ShareSheet({ projectId }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [link, setLink] = useState<SharedLink | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const snapPoints = useMemo(() => ['60%'], []);

    const ensureLink = useCallback(async () => {
      if (link) return link;
      try {
        const data = await apiPost<SharedLink>(`/api/projects/${projectId}/share`);
        setLink(data);
        setError(null);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur réseau');
        return null;
      }
    }, [link, projectId]);

    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          sheetRef.current?.present();
          ensureLink();
        },
        dismiss: () => {
          sheetRef.current?.dismiss();
        },
      }),
      [ensureLink],
    );

    const shareUrl = link ? `${WEB_BASE_URL}/${link.slug}` : null;

    const handleCopy = useCallback(async () => {
      if (!shareUrl) return;
      await Clipboard.setStringAsync(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, [shareUrl]);

    const handleNativeShare = useCallback(async () => {
      if (!shareUrl) return;
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(shareUrl);
      }
    }, [shareUrl]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.title}>
            Partager cet <Text style={[styles.title, type.serif]}>épisode</Text>.
          </Text>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <View style={styles.linkCard}>
                <Text
                  style={styles.linkText}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  testID="share-url"
                >
                  {shareUrl ?? 'Génération du lien…'}
                </Text>
                <Pressable
                  style={[styles.copyBtn, !shareUrl && styles.copyBtnDisabled]}
                  onPress={handleCopy}
                  disabled={!shareUrl}
                  testID="share-copy-button"
                >
                  <Text style={styles.copyText}>{copied ? 'Copié !' : 'Copier'}</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.shareNative}
                onPress={handleNativeShare}
                disabled={!shareUrl}
                testID="share-native-button"
              >
                <Text style={styles.shareNativeText}>Partager via une autre app</Text>
              </Pressable>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Lien public</Text>
                <Switch value={isPublic} onValueChange={setIsPublic} />
              </View>

              <Text style={styles.meta}>Expire dans 30 jours · 0 écoutes</Text>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  bg: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  handle: {
    backgroundColor: color.line,
    width: 36,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space['2xl'],
    gap: space.lg,
  },
  title: {
    ...type.title,
    color: color.ink,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.line,
  },
  linkText: {
    flex: 1,
    fontSize: type.body.fontSize,
    color: color.ink,
  },
  copyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    backgroundColor: color.ink,
  },
  copyBtnDisabled: {
    opacity: 0.4,
  },
  copyText: {
    color: color.bg,
    fontSize: 13,
    fontWeight: '600',
  },
  shareNative: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.line,
  },
  shareNativeText: {
    color: color.ink,
    fontSize: type.label.fontSize,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  toggleLabel: {
    fontSize: type.label.fontSize,
    color: color.ink,
  },
  meta: {
    fontSize: type.meta.fontSize,
    color: color.mute,
    textAlign: 'center',
  },
  error: {
    fontSize: type.body.fontSize,
    color: color.danger,
    paddingVertical: space.lg,
    textAlign: 'center',
  },
});
