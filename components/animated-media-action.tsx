import { type ReactNode } from "react";
import { Pressable, Text, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AnimatedProgressPulse } from "@/components/animated-progress-pulse";

type Props = {
  label: string;
  busyLabel?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  busy: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onPress: PressableProps["onPress"];
  buttonStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  pulseColor?: string;
  children?: ReactNode;
};

export function AnimatedMediaAction({
  label,
  busyLabel,
  accessibilityLabel,
  accessibilityHint,
  busy,
  disabled,
  reducedMotion,
  onPress,
  buttonStyle,
  textStyle,
  disabledStyle,
  pressedStyle,
  pulseColor = "#FFFFFF",
  children,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy, disabled }}
      disabled={disabled}
      style={({ pressed }) => [buttonStyle, disabled && disabledStyle, pressed && !disabled && pressedStyle]}
      onPress={onPress}
    >
      {children}
      {busy ? <AnimatedProgressPulse reducedMotion={reducedMotion} color={pulseColor} label={busyLabel ?? label} /> : null}
      <Text style={textStyle}>{busyLabel && busy ? busyLabel : label}</Text>
    </Pressable>
  );
}
