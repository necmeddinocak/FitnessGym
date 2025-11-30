import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { isUserLoggedIn, loginWithEmail, registerWithEmail, logout as logoutService, getUserProfile } from '../services/userService';
import { setSupabaseUserId } from '../config/supabase';
import { colors } from '../theme';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const loginStatus = await isUserLoggedIn();
      
      if (loginStatus.isLoggedIn) {
        setUserId(loginStatus.userId);
        setUserEmail(loginStatus.email);
        setUserName(loginStatus.name);
        setIsAuthenticated(true);
        
        // Set user ID for Supabase
        setSupabaseUserId(loginStatus.userId);

        // Try to get full user profile
        try {
          const profile = await getUserProfile(loginStatus.userId);
          setUserProfile(profile);
        } catch (error) {
          console.log('Error fetching user profile:', error);
        }
      } else {
        setIsAuthenticated(false);
        setSupabaseUserId(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setSupabaseUserId(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, name, isNewUser = false) => {
    try {
      setLoading(true);
      let result;
      
      if (isNewUser) {
        // Register new user
        result = await registerWithEmail(email, name);
      } else {
        // Login existing user
        result = await loginWithEmail(email);
      }
      
      setUserId(result.userId);
      setUserEmail(result.email);
      setUserName(result.name);
      setUserProfile(result.profile);
      setIsAuthenticated(true);
      
      // Set user ID for Supabase
      setSupabaseUserId(result.userId);
      
      return result;
    } catch (error) {
      console.log('Authentication failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutService();
      setUserId(null);
      setUserEmail(null);
      setUserName(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      
      // Clear user ID from Supabase
      setSupabaseUserId(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (userId) {
      try {
        const profile = await getUserProfile(userId);
        setUserProfile(profile);
        setUserEmail(profile.email);
        setUserName(profile.name);
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        userEmail,
        userName,
        userProfile,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUserProfile,
      }}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

