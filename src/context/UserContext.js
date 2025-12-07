import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { supabase } from '../config/supabase';
import { 
  signInAnonymously, 
  isUserAnonymous, 
  logout as logoutService, 
  getUserProfile,
  linkAccountWithEmail,
  signInWithEmailPassword
} from '../services/userService';
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
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    // Initialize auth and listen for changes
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        await handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        resetUserState();
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Try to sign in anonymously (will restore existing session if available)
      const result = await signInAnonymously();
      
      if (result?.userId) {
        setUserId(result.userId);
        setUserEmail(result.email);
        setIsAnonymous(result.isAnonymous);
        setIsAuthenticated(true);
        setSupabaseUserId(result.userId);
        
        // Load user profile
        await loadUserProfile(result.userId);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Even if there's an error, we should try to continue
      // User might still be able to use the app
    } finally {
      setLoading(false);
    }
  };

  const handleUserSession = async (user) => {
    try {
      setUserId(user.id);
      setUserEmail(user.email || null);
      setIsAnonymous(user.is_anonymous || !user.email);
      setIsAuthenticated(true);
      setSupabaseUserId(user.id);
      
      await loadUserProfile(user.id);
    } catch (error) {
      console.error('Error handling user session:', error);
    }
  };

  const loadUserProfile = async (id) => {
    try {
      const profile = await getUserProfile(id);
      setUserProfile(profile);
      setUserName(profile?.name || 'Anonim Kullanıcı');
    } catch (error) {
      console.log('Error loading user profile:', error);
      // Set default profile
      setUserProfile({
        name: 'Anonim Kullanıcı',
        join_date: new Date().toISOString().split('T')[0],
      });
      setUserName('Anonim Kullanıcı');
    }
  };

  const resetUserState = () => {
    setUserId(null);
    setUserEmail(null);
    setUserName(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    setIsAnonymous(true);
    setSupabaseUserId(null);
  };

  /**
   * Link anonymous account with email and password
   */
  const claimAccount = async (email, password) => {
    try {
      console.log('claimAccount started');
      // Note: Don't set global loading here - ProfileScreen handles its own claimLoading state
      const result = await linkAccountWithEmail(email, password);
      console.log('linkAccountWithEmail completed:', result);
      
      if (result.success) {
        // Update state immediately - don't wait for anything else
        setUserEmail(email);
        setIsAnonymous(false);
        
        // Load profile in background - don't block the return
        if (userId) {
          loadUserProfile(userId).catch(err => {
            console.log('Background profile load error (ignored):', err.message);
          });
        }
      }
      
      console.log('claimAccount returning');
      return result;
    } catch (error) {
      console.error('Error claiming account:', error);
      throw error;
    }
  };

  /**
   * Sign in with email and password (for returning users)
   */
  const signIn = async (email, password) => {
    try {
      console.log('signIn started');
      // Note: Don't set global loading here - ProfileScreen handles its own loginLoading state
      const result = await signInWithEmailPassword(email, password);
      console.log('signInWithEmailPassword completed:', result?.userId);
      
      if (result?.userId) {
        // Update state immediately - don't wait for anything else
        setUserId(result.userId);
        setUserEmail(result.email);
        setIsAnonymous(false);
        setIsAuthenticated(true);
        setSupabaseUserId(result.userId);
        
        // Load profile in background - don't block the return
        loadUserProfile(result.userId).catch(err => {
          console.log('Background profile load error (ignored):', err.message);
        });
      }
      
      console.log('signIn returning');
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutService();
      resetUserState();
      
      // Re-initialize with anonymous auth
      await initializeAuth();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (userId) {
      // Use timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Refresh timeout')), 5000)
      );
      
      try {
        await Promise.race([loadUserProfile(userId), timeoutPromise]);
        
        // Also check if user is still anonymous
        const anonymous = await isUserAnonymous();
        setIsAnonymous(anonymous);
      } catch (error) {
        console.log('Profile refresh error:', error.message);
        // Still try to check anonymous status even if profile load failed
        try {
          const anonymous = await isUserAnonymous();
          setIsAnonymous(anonymous);
        } catch (anonError) {
          console.log('Anonymous check error:', anonError.message);
        }
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
        isAnonymous,
        loading,
        claimAccount,
        signIn,
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
