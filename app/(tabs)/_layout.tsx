import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#E76F51', tabBarInactiveTintColor: '#9AA3AA', tabBarButton: HapticTab, tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: '#FFFFFF', borderTopColor: '#E8E4DF', borderTopWidth: 0.5 } }}>
    <Tabs.Screen name="index" options={{ title: 'History', tabBarIcon: ({ color }) => <IconSymbol name="doc.on.clipboard" size={24} color={color} /> }} />
    <Tabs.Screen name="favorites" options={{ title: 'Favorites', tabBarIcon: ({ color }) => <IconSymbol name="star.fill" size={24} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <IconSymbol name="gearshape.fill" size={24} color={color} /> }} />
  </Tabs>;
}
