import { Tabs } from 'expo-router';
import React from 'react';

/**
 * Tab layout simplificado: la navegación principal se hace
 * desde el Sidebar drawer (igual que la Navbar lateral de la web).
 * El bottom tab bar se oculta.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },  // Ocultar tab bar: navegación por Sidebar
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar' }} />
    </Tabs>
  );
}
