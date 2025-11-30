import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

const USER_ID_KEY = '@FitnessGym:userId';
const USER_EMAIL_KEY = '@FitnessGym:userEmail';
const USER_NAME_KEY = '@FitnessGym:userName';

// Supabase Storage URL
const SUPABASE_URL = 'https://mtbghmonlicoftagncbr.supabase.co';

/**
 * Generate a random user ID
 * Format: FG_XXXXXXXXXX (FG = FitnessGym)
 */
const generateUserId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `FG_${timestamp}_${random}`;
};

/**
 * Get or create user ID
 * Returns the stored user ID or creates a new one if not exists
 */
export const getOrCreateUserId = async () => {
  try {
    // Check if user ID exists in AsyncStorage
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      // Generate new user ID
      userId = generateUserId();
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      
      // Create user record in database
      const { error } = await supabase
        .from('users')
        .insert([
          {
            user_id: userId,
            join_date: new Date().toISOString().split('T')[0],
          },
        ]);
      
      if (error) {
        console.error('Error creating user in database:', error);
        throw error;
      }
      
      console.log('New user created:', userId);
    }
    
    return userId;
  } catch (error) {
    console.error('Error in getOrCreateUserId:', error);
    throw error;
  }
};

/**
 * Get current user ID (without creating)
 */
export const getCurrentUserId = async () => {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Clear user data (for testing/reset)
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
    console.log('User data cleared');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Login with email (ONLY for existing users)
 * Returns error if user doesn't exist
 */
export const loginWithEmail = async (email) => {
  try {
    // Check if user exists with this email
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }
    
    if (!existingUser) {
      // User doesn't exist, throw error
      throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
    }
    
    // User exists, return existing user data
    console.log('Existing user found:', existingUser.user_id);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(USER_ID_KEY, existingUser.user_id);
    await AsyncStorage.setItem(USER_EMAIL_KEY, existingUser.email);
    await AsyncStorage.setItem(USER_NAME_KEY, existingUser.name || '');
    
    return {
      userId: existingUser.user_id,
      email: existingUser.email,
      name: existingUser.name,
      isNewUser: false,
      profile: existingUser
    };
  } catch (error) {
    console.log('Login attempt:', error.message);
    throw error;
  }
};

/**
 * Register new user with email and name
 * Returns error if user already exists
 */
export const registerWithEmail = async (email, name) => {
  try {
    // Check if user already exists with this email
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();
    
    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }
    
    if (existingUser) {
      // User already exists, throw error
      throw new Error('Bu e-posta adresi zaten kayıtlı. Giriş yapın.');
    }
    
    // Create new user
    const userId = generateUserId();
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          user_id: userId,
          email: email,
          name: name,
          join_date: new Date().toISOString().split('T')[0],
        },
      ])
      .select()
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('New user created:', userId);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(USER_ID_KEY, userId);
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    
    return {
      userId: userId,
      email: email,
      name: name,
      isNewUser: true,
      profile: newUser
    };
  } catch (error) {
    console.log('Registration attempt:', error.message);
    throw error;
  }
};

/**
 * Check if user is logged in
 */
export const isUserLoggedIn = async () => {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
    const name = await AsyncStorage.getItem(USER_NAME_KEY);
    
    if (userId && email) {
      return {
        isLoggedIn: true,
        userId,
        email,
        name
      };
    }
    
    return { isLoggedIn: false };
  } catch (error) {
    console.error('Error checking login status:', error);
    return { isLoggedIn: false };
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USER_EMAIL_KEY);
    await AsyncStorage.removeItem(USER_NAME_KEY);
    console.log('User logged out');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Update user email and name
 */
export const updateUserEmailAndName = async (userId, email, name) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ email, name })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update AsyncStorage
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    
    return data;
  } catch (error) {
    console.error('Error updating user email and name:', error);
    throw error;
  }
};

/**
 * Request permission to access media library
 */
export const requestMediaPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Fotoğraf galerisine erişim izni gerekli.');
  }
  return true;
};

/**
 * Pick image from gallery
 */
export const pickImage = async () => {
  try {
    await requestMediaPermission();
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.assets[0];
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async () => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Kamera erişim izni gerekli.');
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.assets[0];
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Upload avatar to Supabase Storage
 */
export const uploadAvatar = async (userId, imageUri) => {
  try {
    // Get the file extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Fetch the image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to arraybuffer for upload
    const arrayBuffer = await new Response(blob).arrayBuffer();
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const avatarUrl = urlData.publicUrl;
    
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }
    
    console.log('Avatar uploaded successfully:', avatarUrl);
    return avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/**
 * Delete old avatar from storage
 */
export const deleteOldAvatar = async (avatarUrl) => {
  try {
    if (!avatarUrl || !avatarUrl.includes('/avatars/')) return;
    
    // Extract file name from URL
    const fileName = avatarUrl.split('/avatars/').pop();
    if (!fileName) return;
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);
    
    if (error) {
      console.error('Error deleting old avatar:', error);
    }
  } catch (error) {
    console.error('Error in deleteOldAvatar:', error);
  }
};

/**
 * Update avatar with image picker flow
 * Returns the new avatar URL or null if cancelled
 */
export const updateAvatarWithPicker = async (userId, currentAvatarUrl = null) => {
  try {
    const image = await pickImage();
    
    if (!image) {
      return null; // User cancelled
    }
    
    // Delete old avatar if exists
    if (currentAvatarUrl) {
      await deleteOldAvatar(currentAvatarUrl);
    }
    
    // Upload new avatar
    const newAvatarUrl = await uploadAvatar(userId, image.uri);
    return newAvatarUrl;
  } catch (error) {
    console.error('Error updating avatar:', error);
    throw error;
  }
};

/**
 * Update avatar with camera
 * Returns the new avatar URL or null if cancelled
 */
export const updateAvatarWithCamera = async (userId, currentAvatarUrl = null) => {
  try {
    const image = await takePhoto();
    
    if (!image) {
      return null; // User cancelled
    }
    
    // Delete old avatar if exists
    if (currentAvatarUrl) {
      await deleteOldAvatar(currentAvatarUrl);
    }
    
    // Upload new avatar
    const newAvatarUrl = await uploadAvatar(userId, image.uri);
    return newAvatarUrl;
  } catch (error) {
    console.error('Error updating avatar with camera:', error);
    throw error;
  }
};

