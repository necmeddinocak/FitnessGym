import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Import screens
import HomeScreen from '../features/home/HomeScreen';
import { WorkoutStackNavigator } from './WorkoutStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import TrackingScreen from '../features/tracking/TrackingScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Workout') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Tracking') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 15,
          paddingTop: 8,
          paddingHorizontal: 10,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutStackNavigator}
        options={{ 
          tabBarLabel: 'Antrenman',
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Tracking" 
        component={TrackingScreen}
        options={{ tabBarLabel: 'Takip' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ 
          tabBarLabel: 'Profil',
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
};

