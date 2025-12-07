import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../features/profile/ProfileScreen';
import ProfileEditScreen from '../features/profile/ProfileEditScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          title: 'Profili Düzenle',
          headerBackTitle: 'Geri'
        }}
      />
    </Stack.Navigator>
  );
};

