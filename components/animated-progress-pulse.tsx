import { useEffect, useRef } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  reducedMotion: boolean;
  color?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedProgressPulse({
  reducedMotion,
  color = "#FFFFFF",
  label = "In progress",
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0.35)).current;

  useEffect(() => {
    opacity.stopAnimation();
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={[styles.pulse, { backgroundColor: color, opacity }, style]}
    />
  );
}

const styles = {
  pulse: { width: 24, height: 4, borderRadius: 2 } satisfies ViewStyle,
};
