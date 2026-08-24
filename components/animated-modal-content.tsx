import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { AnimatedEntrance } from "@/components/animated-entrance";

type Props = {
  children: ReactNode;
  reducedMotion: boolean;
  style?: StyleProp<ViewStyle>;
  distance?: number;
};

export function AnimatedModalContent({ children, reducedMotion, style, distance = 14 }: Props) {
  return (
    <AnimatedEntrance reducedMotion={reducedMotion} distance={distance} style={style}>
      {children}
    </AnimatedEntrance>
  );
}
