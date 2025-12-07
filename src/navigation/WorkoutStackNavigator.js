import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkoutScreen from '../features/workout/WorkoutScreen';
import WorkoutDetailScreen from '../features/workout/WorkoutDetailScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export const WorkoutStackNavigator = () => {
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
        name="WorkoutList" 
        component={WorkoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="WorkoutDetail" 
        component={WorkoutDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.program?.name || 'Antrenman Detay',
          headerBackTitle: 'Geri'
        })}
      />
    </Stack.Navigator>
  );
};

