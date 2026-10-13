import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { alpha, pressedScale, useTheme } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

/** The one warm action of a screen: 56 dp pill with an arrow circle on the right. */
export function PrimaryButton({
  label,
  icon = 'arrow_forward',
  onPress,
  disabled,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: disabled ? alpha(c.ink, 0.1) : c.action },
        !disabled && pressedScale(pressed),
        style,
      ]}
    >
      <Text variant="button" color={disabled ? alpha(c.ink, 0.42) : c.onAction}>
        {label}
      </Text>
      {!disabled && (
        <View style={[styles.arrow, { backgroundColor: alpha(c.onAction, 0.16) }]}>
          <Icon name={icon} size={22} color={c.onAction} />
        </View>
      )}
    </Pressable>
  );
}

/** Second-level pill: white panel with a hairline edge, 48 dp. */
export function SecondaryButton({
  label,
  icon,
  iconFirst,
  onPress,
  disabled,
  outline,
  style,
  accessibilityState,
}: {
  label: string;
  icon?: IconName;
  iconFirst?: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** contour only, for «Начать заново» */
  outline?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityState?: { expanded?: boolean };
}) {
  const c = useTheme();
  const iconEl = icon && <Icon name={icon} size={20} color={c.ink} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        outline
          ? { borderColor: alpha(c.ink, 0.4), backgroundColor: 'transparent' }
          : { borderColor: c.hairline, backgroundColor: c.panel },
        disabled && { opacity: 0.4 },
        !disabled && pressedScale(pressed),
        style,
      ]}
    >
      {iconFirst && iconEl}
      <Text variant="small">{label}</Text>
      {!iconFirst && iconEl}
    </Pressable>
  );
}

/** 48 dp round icon button for app bars. */
export function IconButton({
  icon,
  label,
  onPress,
  size = 24,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: alpha(c.ink, 0.06) }]}
    >
      <Icon name={icon} size={size} color={c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
