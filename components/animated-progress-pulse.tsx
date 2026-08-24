import { useEffect, useRef } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";

type Props = {
  reducedMotion: boolean;
  color?: string;
  style?: ViewStyle;
};

export function AnimatedProgressPulse({ reducedMotion, color = "#FFFFFF", style }: Props) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0.35)).current;

  useEffect(() => {
    opacity.stopAnimation();
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return <Animated.View accessibilityLabel="In progress" style={[styles.pulse, { backgroundColor: color, opacity }, style]} />;
}

const styles = {
  pulse: { width: 24, height: 4, borderRadius: 2 } satisfies ViewStyle,
};
