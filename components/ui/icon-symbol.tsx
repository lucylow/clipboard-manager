import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconName = keyof typeof MAPPING;
const MAPPING = {
  'house.fill': 'home', 'star.fill': 'star', star: 'star-border', 'gearshape.fill': 'settings',
  magnifyingglass: 'search', 'xmark.circle.fill': 'cancel', plus: 'add', 'checkmark.circle.fill': 'check-circle',
  'doc.on.clipboard': 'content-paste', 'doc.text': 'description', photo: 'photo', 'doc.on.doc': 'content-copy', xmark: 'close',
  'chevron.right': 'chevron-right', 'chevron.left.forwardslash.chevron.right': 'code', paperplane: 'send', 'exclamationmark.triangle.fill': 'warning', 'slider.horizontal.3': 'tune',
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>['name']>;

export function IconSymbol({ name, size = 24, color, style }: { name: IconName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: unknown }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
