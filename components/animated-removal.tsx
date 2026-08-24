import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  removing: boolean;
  reducedMotion: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedRemoval({ children, removing, reducedMotion, style }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.stopAnimation();
    if (!removing || reducedMotion) {
      progress.setValue(removing && reducedMotion ? 1 : 0);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, removing]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            {
              translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
