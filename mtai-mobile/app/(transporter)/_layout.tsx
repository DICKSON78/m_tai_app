import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/constants/theme';

const TAB_COLOR_ACTIVE = COLORS.primaryDark;
const TAB_COLOR_INACTIVE = '#9CA3AF';
const TAB_BAR_HEIGHT = 62;

function TabIcon({
  icon,
  focused,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
}) {
  return (
    <MaterialIcons
      name={icon}
      size={22}
      color={focused ? TAB_COLOR_ACTIVE : TAB_COLOR_INACTIVE}
    />
  );
}

function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  return {
    height: TAB_BAR_HEIGHT + insets.bottom,
    paddingBottom: Math.max(8, insets.bottom),
    paddingTop: 6,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  };
}

export default function TransporterLayout() {
  const tabBarStyle = useTabBarStyle();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLOR_ACTIVE,
        tabBarInactiveTintColor: TAB_COLOR_INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FONTS.medium,
        },
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Deliveries',
          tabBarIcon: ({ focused }) => <TabIcon icon="local-shipping" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon icon="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
