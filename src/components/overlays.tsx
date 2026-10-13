import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  ZoomIn,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { alpha, useTheme } from '@/theme';

import { Icon, type IconName } from './icon';
import { Font, Text } from './text';

const SCRIM = '#0f141a';

/** Bottom sheet over a scrim (radius 28, no shadow). */
export function BottomSheet({
  visible,
  onClose,
  label,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const quiet = useReducedMotion();

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;
  // Drawn in the screen itself, not in a Modal: a Modal's dialog window may stop above the
  // navigation bar on some devices, leaving a strip under the sheet.
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={quiet ? undefined : FadeIn.duration(200)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: alpha(SCRIM, 0.4) }]}
          onPress={onClose}
          accessibilityLabel={label}
          accessible={false}
        />
      </Animated.View>
      <Animated.View
        entering={quiet ? undefined : SlideInDown.duration(260)}
        accessibilityViewIsModal
        style={[
          styles.sheet,
          { backgroundColor: c.page, paddingBottom: Math.max(insets.bottom, 16) + 20 },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: alpha(c.ink, 0.3) }]} />
        {children}
      </Animated.View>
    </View>
  );
}

/** Confirmation dialog: title, text, «Отмена» and the main action on the right. */
export function ConfirmDialog({
  visible,
  icon,
  title,
  text,
  confirm,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  icon: IconName;
  title: string;
  text: string;
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = useTheme();
  const t = useStrings();
  const quiet = useReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.dlgWrap}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: alpha(SCRIM, 0.45) }]}
          onPress={onCancel}
          accessible={false}
        />
        <Animated.View
          entering={quiet ? undefined : ZoomIn.duration(220)}
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[styles.dlg, { backgroundColor: '#ffffff' }]}
        >
          <Icon name={icon} size={28} color={c.deep} style={{ alignSelf: 'center' }} />
          <Text variant="title" style={styles.dlgTitle}>
            {title}
          </Text>
          <Text variant="body" muted style={styles.dlgText}>
            {text}
          </Text>
          <View style={styles.dlgActions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.dlgBtn}>
              <Text variant="small" color={c.deep} style={styles.dlgBtnText}>
                {t.cancel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.dlgBtn, { backgroundColor: c.deep, paddingHorizontal: 18 }]}
            >
              <Text variant="small" color="#ffffff" style={styles.dlgBtnText}>
                {confirm}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------- snackbar ---------- */

const SnackContext = createContext<(text: string) => void>(() => {});

export function useSnackbar() {
  return use(SnackContext);
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();
  const show = (value: string) => {
    setText(value);
    setKey((k) => k + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(null), 2800);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <SnackContext value={show}>
      {children}
      {text && (
        <Animated.View
          key={key}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(180)}
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.snack, { bottom: insets.bottom + 24 }]}
        >
          <Text variant="small" color="#ffffff">
            {text}
          </Text>
        </Animated.View>
      )}
    </SnackContext>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  dlgWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dlg: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 28 },
  dlgTitle: { textAlign: 'center', marginTop: 12, marginBottom: 10 },
  dlgText: { fontSize: 15, lineHeight: 22 },
  dlgActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 22 },
  dlgBtn: { minHeight: 48, paddingHorizontal: 14, borderRadius: 24, justifyContent: 'center' },
  dlgBtnText: { fontFamily: Font.extrabold },
  snack: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1d2a33',
  },
});
