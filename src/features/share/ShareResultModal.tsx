import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Text, useToast } from '../../components';
import { colors, withAlpha } from '../../theme';
import { CARD_RATIO, ResultShareCard, ResultShareData } from './ResultShareCard';
import { captureWidth, shareResultCard } from './shareResult';

export type ShareResultModalProps = { visible: boolean; data: ResultShareData; onClose: () => void };

/** Prévia do card + Compartilhar/Fechar. Um card fora da tela em resolução total é o capturado. */
export const ShareResultModal = ({ visible, data, onClose }: ShareResultModalProps) => {
  const toast = useToast();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const captureRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const previewWidth = Math.min(screenWidth - 48, (screenHeight - 260) / CARD_RATIO, 360);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await shareResultCard(captureRef);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível compartilhar.';
      setError(message);
      toast.show({ message, variant: 'danger', position: 'top' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar prévia" />
        <Text variant="label">Prévia do card</Text>
        <View style={styles.preview}>
          <ResultShareCard data={data} width={previewWidth} />
        </View>
        {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
        <View style={styles.actions}>
          <Button icon="share-social" loading={busy} onPress={share}>Compartilhar</Button>
          <Button variant="ghost" disabled={busy} onPress={onClose}>Fechar</Button>
        </View>
        {visible ? (
          <View style={styles.offscreen} pointerEvents="none">
            <ResultShareCard ref={captureRef} data={data} width={captureWidth()} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: withAlpha('#000000', 0.92), alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  preview: { borderWidth: 1, borderColor: colors.line, borderRadius: 4, overflow: 'hidden' },
  actions: { alignSelf: 'stretch', gap: 8 },
  offscreen: { position: 'absolute', left: -5000, top: 0 },
});
