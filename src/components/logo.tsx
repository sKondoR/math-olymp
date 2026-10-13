import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Font, Text } from './text';

/** Logo 26: tiles M·A·T·H (the A as an outline) and «Olymp», in the colours of the theme. */
export function Logo() {
  const c = useTheme();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="MathOlymp" style={styles.row}>
      <View style={styles.tiles}>
        {['M', 'A', 'T', 'H'].map((l, i) => {
          const outline = i === 1;
          return (
            <View
              key={l}
              style={[
                styles.tile,
                {
                  transform:
                    i % 2 ? [{ rotate: '4deg' }, { translateY: -2 }] : [{ rotate: '-4deg' }],
                },
                outline ? { borderWidth: 3, borderColor: c.logo } : { backgroundColor: c.deep },
              ]}
            >
              <Text style={styles.letter} color={outline ? c.logo : '#ffffff'}>
                {l}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.olymp} color={c.logo}>
        Olymp
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tiles: { flexDirection: 'row', gap: 3 },
  tile: {
    width: 31,
    height: 31,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontFamily: Font.extrabold, fontSize: 20, lineHeight: 24 },
  olymp: { fontFamily: Font.medium, fontSize: 34, lineHeight: 40, letterSpacing: -1 },
});
