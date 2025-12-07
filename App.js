import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { TabNavigator } from './src/navigation/TabNavigator';
import { UserProvider, useUser } from './src/context/UserContext';
import { colors } from './src/theme';
import { initializeNotifications } from './src/services';

// Main App Content - Now directly shows TabNavigator (no login screen)
const AppContent = () => {
  const { isAuthenticated, userId } = useUser();

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      initializeNotifications(0).then((success) => {
        if (success) {
          console.log('Bildirimler başarıyla başlatıldı');
        }
      }).catch((error) => {
        console.log('Bildirim başlatma hatası:', error);
      });
    }
  }, [isAuthenticated, userId]);

  // With anonymous auth, user is always authenticated
  // The loading state is handled in UserProvider
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={colors.background} />
      <TabNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
