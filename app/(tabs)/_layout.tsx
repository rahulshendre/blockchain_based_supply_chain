import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Farmer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="leaf.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="distributor"
        options={{
          title: 'Distributor',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="truck.box.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="retailer"
        options={{
          title: 'Retailer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="storefront.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="consumer"
        options={{
          title: 'Consumer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
