import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

const USER_ID_KEY = '@FitnessGym:userId';
const USER_EMAIL_KEY = '@FitnessGym:userEmail';
const USER_NAME_KEY = '@FitnessGym:userName';

// ==================== ANONYMOUS AUTH ====================

/**
 * Sign in anonymously
 * Creates a new anonymous user or restores existing session
 */
export const signInAnonymously = async () => {
  try {
    // First check if there's an existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('Existing session found:', session.user.id);
      
      // Ensure user exists in our users table
      await ensureUserInDatabase(session.user);
      
      return {
        userId: session.user.id,
        email: session.user.email || null,
        isAnonymous: session.user.is_anonymous || !session.user.email,
        user: session.user
      };
    }
    
    // No existing session, create anonymous user
    console.log('No session found, signing in anonymously...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) throw error;
    
    if (data?.user) {
      console.log('Anonymous user created:', data.user.id);
      
      // Create user record in our database
      await ensureUserInDatabase(data.user);
      
      // Save to AsyncStorage for backward compatibility
      await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
      
      return {
        userId: data.user.id,
        email: null,
        isAnonymous: true,
        user: data.user
      };
    }
    
    throw new Error('Failed to create anonymous user');
  } catch (error) {
    console.error('Error in signInAnonymously:', error);
    throw error;
  }
};

/**
 * Ensure user exists in our users table
 * Returns the user profile (created or existing)
 * Also syncs email from auth if it was updated
 */
const ensureUserInDatabase = async (authUser) => {
  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
    }
    
    if (existingUser) {
      // Sync email from auth if user linked their account (email was null but now has email in auth)
      if (!existingUser.email && authUser.email) {
        console.log('Syncing email from auth to users table:', authUser.email);
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ email: authUser.email })
          .eq('user_id', authUser.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error syncing email:', updateError);
          return existingUser; // Return existing user if update fails
        }
        
        return updatedUser;
      }
      return existingUser;
    }
    
    // Create new user record
    const newUserData = {
      user_id: authUser.id,
      email: authUser.email || null,
      name: authUser.user_metadata?.name || 'Anonim Kullanıcı',
      join_date: new Date().toISOString().split('T')[0],
    };
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([newUserData])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user in database:', insertError);
      // Return a default profile even if insert fails
      return newUserData;
    }
    
    console.log('User created in database:', authUser.id);
    return newUser;
  } catch (error) {
    console.error('Error in ensureUserInDatabase:', error);
    // Return a minimal profile to prevent app crash
    return {
      user_id: authUser.id,
      name: 'Anonim Kullanıcı',
      join_date: new Date().toISOString().split('T')[0],
    };
  }
};

/**
 * Link anonymous account with email and password
 * Converts anonymous user to permanent user
 * IMPORTANT: Email and password must be updated in a SINGLE call for anonymous users
 */
export const linkAccountWithEmail = async (email, password) => {
  console.log('Starting linkAccountWithEmail for:', email);
  
  // Create a promise that resolves when we detect the auth state change
  // This is more reliable than waiting for updateUser to resolve
  let authChangeResolve;
  let authChangeTimeout;
  
  const authChangePromise = new Promise((resolve, reject) => {
    authChangeResolve = resolve;
    
    // Set a timeout in case something goes wrong
    authChangeTimeout = setTimeout(() => {
      reject(new Error('Hesap güncelleme zaman aşımına uğradı. Lütfen tekrar deneyin.'));
    }, 15000);
  });
  
  // Listen for auth state change
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('linkAccountWithEmail - Auth event:', event);
    if (event === 'USER_UPDATED' && session?.user) {
      clearTimeout(authChangeTimeout);
      authChangeResolve({ success: true, user: session.user });
    }
  });
  
  try {
    // Start the update - don't await, just fire
    const updatePromise = supabase.auth.updateUser({
      email: email,
      password: password,
    });
    
    // Also handle the case where updateUser returns an error immediately
    updatePromise.then(({ data, error }) => {
      if (error) {
        clearTimeout(authChangeTimeout);
        const errorMessage = error.message?.toLowerCase() || '';
        if (
          errorMessage.includes('already registered') ||
          errorMessage.includes('already been registered') ||
          errorMessage.includes('email address has already') ||
          error.code === 'email_exists'
        ) {
          authChangeResolve({ 
            success: false, 
            error: new Error('Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.')
          });
        } else {
          authChangeResolve({ 
            success: false, 
            error: new Error(error.message || 'Hesap kaydedilirken bir hata oluştu.')
          });
        }
      }
    }).catch(err => {
      clearTimeout(authChangeTimeout);
      authChangeResolve({ success: false, error: err });
    });
    
    // Wait for either auth state change or error
    const result = await authChangePromise;
    
    // Clean up subscription
    subscription?.unsubscribe();
    
    console.log('linkAccountWithEmail result:', result);
    
    if (!result.success) {
      throw result.error;
    }
    
    // Update database in background - don't wait
    (async () => {
      try {
        await supabase
          .from('users')
          .update({ email: email })
          .eq('user_id', result.user.id);
        
        await AsyncStorage.setItem(USER_EMAIL_KEY, email);
        console.log('Email updated in database successfully');
      } catch (dbError) {
        console.error('Error updating email in database (non-blocking):', dbError);
      }
    })();
    
    console.log('Account linked successfully with email:', email);
    
    return {
      success: true,
      email: email,
      needsVerification: false,
    };
  } catch (error) {
    subscription?.unsubscribe();
    clearTimeout(authChangeTimeout);
    console.error('Error linking account:', error);
    throw error;
  }
};

/**
 * Sign in with email and password (for returning users)
 */
export const signInWithEmailPassword = async (email, password) => {
  console.log('Starting signInWithEmailPassword for:', email);
  
  // Create a promise that resolves when we detect the auth state change
  let authChangeResolve;
  let authChangeTimeout;
  
  const authChangePromise = new Promise((resolve, reject) => {
    authChangeResolve = resolve;
    
    // Set a timeout in case something goes wrong
    authChangeTimeout = setTimeout(() => {
      reject(new Error('Giriş zaman aşımına uğradı. Lütfen tekrar deneyin.'));
    }, 15000);
  });
  
  // Listen for auth state change
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('signInWithEmailPassword - Auth event:', event);
    if (event === 'SIGNED_IN' && session?.user) {
      clearTimeout(authChangeTimeout);
      authChangeResolve({ success: true, user: session.user });
    }
  });
  
  try {
    // Start the sign in - don't await, just fire
    const signInPromise = supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    // Handle errors from signInWithPassword
    signInPromise.then(({ data, error }) => {
      if (error) {
        clearTimeout(authChangeTimeout);
        const errorMessage = error.message?.toLowerCase() || '';
        if (
          errorMessage.includes('invalid') || 
          errorMessage.includes('credentials') ||
          errorMessage.includes('invalid login')
        ) {
          authChangeResolve({ 
            success: false, 
            error: new Error('E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.')
          });
        } else if (errorMessage.includes('email not confirmed')) {
          authChangeResolve({ 
            success: false, 
            error: new Error('E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.')
          });
        } else {
          authChangeResolve({ 
            success: false, 
            error: new Error(error.message || 'Giriş yapılırken bir hata oluştu.')
          });
        }
      }
    }).catch(err => {
      clearTimeout(authChangeTimeout);
      authChangeResolve({ success: false, error: err });
    });
    
    // Wait for either auth state change or error
    const result = await authChangePromise;
    
    // Clean up subscription
    subscription?.unsubscribe();
    
    console.log('signInWithEmailPassword result:', result);
    
    if (!result.success) {
      throw result.error;
    }
    
    // Update database and AsyncStorage in background - don't wait
    (async () => {
      try {
        await ensureUserInDatabase(result.user);
        await AsyncStorage.setItem(USER_ID_KEY, result.user.id);
        await AsyncStorage.setItem(USER_EMAIL_KEY, result.user.email || '');
        console.log('User data saved to AsyncStorage');
      } catch (dbError) {
        console.error('Error saving user data (non-blocking):', dbError);
      }
    })();
    
    console.log('Sign in successful for:', email);
    
    return {
      userId: result.user.id,
      email: result.user.email,
      isAnonymous: false,
      user: result.user
    };
  } catch (error) {
    subscription?.unsubscribe();
    clearTimeout(authChangeTimeout);
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Check if current user is anonymous
 */
export const isUserAnonymous = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return true;
    
    // User is anonymous if is_anonymous is true OR they don't have an email
    return user.is_anonymous === true || !user.email;
  } catch (error) {
    console.error('Error checking anonymous status:', error);
    return true;
  }
};

/**
 * Get current auth session
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentAuthUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// ==================== USER PROFILE ====================

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
 * Returns null if user doesn't exist (instead of throwing error)
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // If user doesn't exist, create them
    if (!data) {
      console.log('User not found in database, creating...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        return await ensureUserInDatabase(authUser);
      }
      
      // Return default profile
      return {
        user_id: userId,
        name: 'Anonim Kullanıcı',
        join_date: new Date().toISOString().split('T')[0],
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    // Return default profile instead of throwing
    return {
      user_id: userId,
      name: 'Anonim Kullanıcı',
      join_date: new Date().toISOString().split('T')[0],
    };
  }
};

/**
 * Check if user is logged in (has valid session)
 */
export const isUserLoggedIn = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      return {
        isLoggedIn: true,
        userId: session.user.id,
        email: session.user.email || null,
        name: session.user.user_metadata?.name || null,
        isAnonymous: session.user.is_anonymous || !session.user.email
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
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Clear AsyncStorage
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

// ==================== AVATAR FUNCTIONS ====================

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
