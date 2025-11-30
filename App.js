import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { TabNavigator } from './src/navigation/TabNavigator';
import { UserProvider, useUser } from './src/context/UserContext';
import LoginScreen from './src/features/auth/LoginScreen';
import { colors } from './src/theme';
import { initializeNotifications } from './src/services';

// Main App Content with Auth Check
const AppContent = () => {
  const { isAuthenticated, login, userId } = useUser();

  // Kullanıcı giriş yaptığında bildirimleri başlat
  useEffect(() => {
    if (isAuthenticated && userId) {
      // Bildirimleri başlat
      initializeNotifications(0).then((success) => {
        if (success) {
          console.log('Bildirimler başarıyla başlatıldı');
        }
      }).catch((error) => {
        console.log('Bildirim başlatma hatası:', error);
      });
    }
  }, [isAuthenticated, userId]);

  const handleLogin = async (email, name, isNewUser) => {
    try {
      await login(email, name, isNewUser);
    } catch (error) {
      // Silent fail - error already shown to user via Alert
      console.log('Auth attempt:', error.message || 'Unknown error');
      throw error;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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
