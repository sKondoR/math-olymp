import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Palettes, ThemeNames } from '@/constants/tokens';
import { Langs } from '@/data/types';
import { LangNames, useStrings } from '@/i18n';
import { useSettings } from '@/state/store';
import { pressedScale, useTheme } from '@/theme';

import { Icon } from './icon';
import { BottomSheet } from './overlays';
import { Font, Text } from './text';

/** Menu from the top right of the home screen: language, theme, «Мои результаты». */
export function MenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useTheme();
  const t = useStrings();
  const router = useRouter();
  const { settings, setLang, setTheme } = useSettings();

  return (
    <BottomSheet visible={visible} onClose={onClose} label={t.menu}>
      <Text variant="title" accessibilityRole="header" style={styles.head}>
        {t.menu}
      </Text>

      <Text variant="small" muted style={styles.section}>
        {t.language}
      </Text>
      <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={t.language}>
        {Langs.map((l) => {
          const on = settings.lang === l;
          return (
            <Segment key={l} on={on} onPress={() => setLang(l)} half>
              {on && <Icon name="check" size={18} color={c.deep} />}
              <Text variant="small">{LangNames[l]}</Text>
            </Segment>
          );
        })}
      </View>
      {t.tasksOnlyRussian ? (
        <Text variant="caption" muted style={styles.note}>
          {t.tasksOnlyRussian}
        </Text>
      ) : null}

      <Text variant="small" muted style={styles.section}>
        {t.theme}
      </Text>
      <View style={styles.seg} accessibilityRole="radiogroup" accessibilityLabel={t.theme}>
        {ThemeNames.map((name) => {
          const p = Palettes[name];
          return (
            <Segment key={name} on={settings.theme === name} onPress={() => setTheme(name)}>
              <View style={[styles.swatch, { backgroundColor: p.page }]}>
                <View style={[styles.swatchHalf, { backgroundColor: p.action }]} />
              </View>
              <Text variant="small">{t.themes[name]}</Text>
            </Segment>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onClose();
          router.push('/results');
        }}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: c.panel, borderColor: c.hairline },
          pressedScale(pressed),
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: c.shallow }]}>
          <Icon name="bar_chart" size={22} color={c.deep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="label">{t.results}</Text>
          <Text variant="caption" muted style={{ fontFamily: Font.medium }}>
            {t.resultsSub}
          </Text>
        </View>
        <Icon name="chevron_right" color={c.inkMuted} />
      </Pressable>
    </BottomSheet>
  );
}

function Segment({
  on,
  onPress,
  half,
  children,
}: {
  on: boolean;
  onPress: () => void;
  half?: boolean;
  children: React.ReactNode;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[
        styles.segBtn,
        half ? styles.half : styles.third,
        on
          ? { backgroundColor: c.shallow, borderColor: c.progress, borderWidth: 2 }
          : { backgroundColor: c.panel, borderColor: c.hairline, borderWidth: 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { marginHorizontal: 4, marginBottom: 8 },
  section: {
    marginTop: 14,
    marginBottom: 8,
    marginHorizontal: 4,
    fontFamily: Font.extrabold,
  },
  note: { marginTop: 8, marginHorizontal: 4 },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segBtn: {
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  half: { flexBasis: '48%', flexGrow: 1 },
  third: { flexBasis: '30%', flexGrow: 1 },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000022',
    transform: [{ rotate: '45deg' }],
  },
  swatchHalf: { position: 'absolute', left: 9, top: 0, right: 0, bottom: 0 },
  row: {
    marginTop: 18,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
