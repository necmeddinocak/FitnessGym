import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found. Make sure .env file exists with SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Create Supabase client with session persistence
export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Current user ID (stored locally for app logic)
let currentUserId = null;

/**
 * Set the current user ID
 * This is used for app logic - RLS is temporarily relaxed
 */
export const setSupabaseUserId = (userId) => {
  // Aynı userId tekrar set ediliyorsa, gereksiz log yazdırma
  if (currentUserId === userId) {
    return;
  }
  currentUserId = userId;
  console.log('User ID set:', userId);
};

/**
 * Get the current user ID
 */
export const getSupabaseUserId = () => currentUserId;
