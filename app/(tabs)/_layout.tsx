import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#E76F51', tabBarInactiveTintColor: '#9AA3AA', tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 1 }, tabBarButton: HapticTab, tabBarStyle: { paddingTop: 7, paddingBottom: bottomPadding, height: 59 + bottomPadding, backgroundColor: '#FFFEFC', borderTopColor: '#E8E4DF', borderTopWidth: 0.5, elevation: 8 } }}>
    <Tabs.Screen name="index" options={{ title: 'History', tabBarIcon: ({ color, focused }) => <IconSymbol name="doc.on.clipboard" size={focused ? 25 : 23} color={color} /> }} />
    <Tabs.Screen name="favorites" options={{ title: 'Favorites', tabBarIcon: ({ color, focused }) => <IconSymbol name="star.fill" size={focused ? 25 : 23} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <IconSymbol name="gearshape.fill" size={focused ? 25 : 23} color={color} /> }} />
  </Tabs>;
}
