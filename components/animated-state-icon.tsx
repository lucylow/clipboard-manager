import { useEffect, useRef, type ReactNode } from "react";
import { Animated } from "react-native";

type Props = {
  active: boolean;
  reducedMotion: boolean;
  children: ReactNode;
};

export function AnimatedStateIcon({ active, reducedMotion, children }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }

    scale.stopAnimation();
    scale.setValue(active ? 0.82 : 0.94);
    const animation = Animated.timing(scale, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, reducedMotion, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
