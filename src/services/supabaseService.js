import { supabase } from '../config/supabase';

// ==================== EXERCISES ====================

/**
 * Get all exercises from database
 */
export const getAllExercises = async () => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
};

/**
 * Search exercises by name
 */
export const searchExercises = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching exercises:', error);
    throw error;
  }
};

/**
 * Get exercises by category
 */
export const getExercisesByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching exercises by category:', error);
    throw error;
  }
};

// ==================== WORKOUT PROGRAMS ====================

/**
 * Get all workout programs for a user (including preset programs)
 */
export const getWorkoutPrograms = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.system`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }
};

/**
 * Get preset workout programs only
 */
export const getPresetPrograms = async () => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('user_id', 'system')
      .eq('category', 'preset')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching preset programs:', error);
    throw error;
  }
};

/**
 * Get custom workout programs for a user
 */
export const getCustomPrograms = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'custom')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching custom programs:', error);
    throw error;
  }
};

/**
 * Create a new workout program
 */
export const createWorkoutProgram = async (userId, programData) => {
  try {
    console.log('Creating workout program with userId:', userId);
    console.log('Program data:', JSON.stringify(programData, null, 2));
    
    const insertData = {
      user_id: userId,
      name: programData.name,
      level: programData.level,
      duration: programData.duration,
      category: programData.category,
      exercises: programData.exercises, // JSONB column accepts JS arrays directly
    };
    
    console.log('Insert data:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error creating workout program:', error?.message || error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * Update a workout program
 */
export const updateWorkoutProgram = async (programId, programData) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update(programData)
      .eq('id', programId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating workout program:', error);
    throw error;
  }
};

/**
 * Delete a workout program
 */
export const deleteWorkoutProgram = async (programId) => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};

// ==================== WEIGHT HISTORY ====================

/**
 * Get weight history for a user
 */
export const getWeightHistory = async (userId, limit = 30) => {
  try {
    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching weight history:', error);
    throw error;
  }
};

/**
 * Add weight entry
 */
export const addWeightEntry = async (userId, weight, date = null) => {
  try {
    const { data, error } = await supabase
      .from('weight_history')
      .insert([
        {
          user_id: userId,
          weight,
          date: date || new Date().toISOString().split('T')[0],
        },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding weight entry:', error);
    throw error;
  }
};

/**
 * Update weight entry
 */
export const updateWeightEntry = async (entryId, weight) => {
  try {
    const { data, error } = await supabase
      .from('weight_history')
      .update({ weight })
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating weight entry:', error);
    throw error;
  }
};

/**
 * Delete weight entry
 */
export const deleteWeightEntry = async (entryId) => {
  try {
    const { error } = await supabase
      .from('weight_history')
      .delete()
      .eq('id', entryId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    throw error;
  }
};

// ==================== EXERCISE PROGRESS ====================

/**
 * Get unique exercise names for a user
 */
export const getUserExercises = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('exercise_progress')
      .select('exercise_name')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Get unique exercise names
    const uniqueExercises = [...new Set(data.map(item => item.exercise_name))];
    return uniqueExercises.sort();
  } catch (error) {
    console.error('Error fetching user exercises:', error);
    throw error;
  }
};

/**
 * Get exercise progress for a user
 */
export const getExerciseProgress = async (userId, exerciseName = null, limit = 50) => {
  try {
    let query = supabase
      .from('exercise_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (exerciseName) {
      query = query.eq('exercise_name', exerciseName);
    }
    
    const { data, error } = await query
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching exercise progress:', error);
    throw error;
  }
};

/**
 * Add exercise progress entry
 */
export const addExerciseProgress = async (userId, progressData) => {
  try {
    const { data, error } = await supabase
      .from('exercise_progress')
      .insert([
        {
          user_id: userId,
          date: progressData.date || new Date().toISOString().split('T')[0],
          ...progressData,
        },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding exercise progress:', error);
    throw error;
  }
};

/**
 * Update exercise progress entry
 */
export const updateExerciseProgress = async (entryId, progressData) => {
  try {
    const { data, error } = await supabase
      .from('exercise_progress')
      .update(progressData)
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating exercise progress:', error);
    throw error;
  }
};

// ==================== WORKOUT HISTORY ====================

/**
 * Get workout history for a user
 */
export const getWorkoutHistory = async (userId, limit = 30) => {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .select(`
        *,
        workout_programs (
          name,
          level,
          duration
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workout history:', error);
    throw error;
  }
};

/**
 * Add workout history entry
 */
export const addWorkoutHistory = async (userId, historyData) => {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .insert([
        {
          user_id: userId,
          date: historyData.date || new Date().toISOString().split('T')[0],
          completed: historyData.completed !== undefined ? historyData.completed : true,
          ...historyData,
        },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding workout history:', error);
    throw error;
  }
};

/**
 * Update workout history entry
 */
export const updateWorkoutHistory = async (entryId, historyData) => {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .update(historyData)
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating workout history:', error);
    throw error;
  }
};

/**
 * Get workout history for date range
 */
export const getWorkoutHistoryByDateRange = async (userId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workout history by date range:', error);
    throw error;
  }
};

/**
 * Get workout statistics for a user
 */
export const getWorkoutStats = async (userId) => {
  try {
    // Get total workouts
    const { count: totalWorkouts, error: workoutError } = await supabase
      .from('workout_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);
    
    if (workoutError) throw workoutError;
    
    // Get recent weight
    const { data: recentWeight, error: weightError } = await supabase
      .from('weight_history')
      .select('weight')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    // Get workout streak (consecutive days with workouts)
    const { data: recentWorkouts, error: streakError } = await supabase
      .from('workout_history')
      .select('date')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(30);
    
    let streak = 0;
    if (recentWorkouts && recentWorkouts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < recentWorkouts.length; i++) {
        const workoutDate = new Date(recentWorkouts[i].date);
        workoutDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
          streak++;
        } else if (diffDays > streak) {
          break;
        }
      }
    }
    
    return {
      totalWorkouts: totalWorkouts || 0,
      currentWeight: recentWeight?.weight || null,
      workoutStreak: streak,
    };
  } catch (error) {
    console.error('Error fetching workout stats:', error);
    throw error;
  }
};

/**
 * Calculate volume load (weight × reps × sets) for a date range
 */
export const getVolumeLoadByDateRange = async (userId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('exercise_progress')
      .select('weight, reps, sets')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    
    // Calculate total volume: sum of (weight × reps × sets)
    const totalVolume = data.reduce((sum, exercise) => {
      const weight = parseFloat(exercise.weight) || 0;
      const reps = parseInt(exercise.reps) || 0;
      const sets = parseInt(exercise.sets) || 1;
      return sum + (weight * reps * sets);
    }, 0);
    
    return totalVolume;
  } catch (error) {
    console.error('Error calculating volume load:', error);
    throw error;
  }
};

/**
 * Get weekly volume load with comparison to previous week
 */
export const getWeeklyVolumeStats = async (userId) => {
  try {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    // Calculate Monday of current week
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + mondayOffset);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Sunday is 6 days after Monday
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    // Previous week
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const previousWeekEnd = new Date(currentWeekEnd);
    previousWeekEnd.setDate(currentWeekEnd.getDate() - 7);
    
    // Get volumes for both weeks
    const currentVolume = await getVolumeLoadByDateRange(
      userId,
      currentWeekStart.toISOString().split('T')[0],
      currentWeekEnd.toISOString().split('T')[0]
    );
    
    const previousVolume = await getVolumeLoadByDateRange(
      userId,
      previousWeekStart.toISOString().split('T')[0],
      previousWeekEnd.toISOString().split('T')[0]
    );
    
    // Calculate percentage change
    let percentageChange = 0;
    if (previousVolume > 0) {
      percentageChange = ((currentVolume - previousVolume) / previousVolume) * 100;
    } else if (currentVolume > 0) {
      percentageChange = 100;
    }
    
    return {
      currentVolume,
      previousVolume,
      percentageChange: Math.round(percentageChange),
    };
  } catch (error) {
    console.error('Error getting weekly volume stats:', error);
    throw error;
  }
};

// ==================== PLANNED WORKOUTS ====================

/**
 * Get planned workouts for a user (workouts with completed=false)
 */
export const getPlannedWorkouts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .select(`
        *,
        workout_programs (
          name,
          level,
          duration
        )
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching planned workouts:', error);
    throw error;
  }
};

/**
 * Add a planned workout
 */
export const addPlannedWorkout = async (userId, date, programId = null, notes = null) => {
  try {
    const insertData = {
      user_id: userId,
      date: date,
      completed: false,
      notes: notes,
    };
    
    if (programId) {
      insertData.workout_program_id = programId;
    }
    
    const { data, error } = await supabase
      .from('workout_history')
      .insert([insertData])
      .select(`
        *,
        workout_programs (
          name,
          level,
          duration
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding planned workout:', error);
    throw error;
  }
};

/**
 * Delete a planned workout
 */
export const deletePlannedWorkout = async (workoutId) => {
  try {
    const { error } = await supabase
      .from('workout_history')
      .delete()
      .eq('id', workoutId)
      .eq('completed', false); // Safety: only delete if not completed
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting planned workout:', error);
    throw error;
  }
};

/**
 * Update a planned workout
 */
export const updatePlannedWorkout = async (workoutId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('workout_history')
      .update(updateData)
      .eq('id', workoutId)
      .eq('completed', false)
      .select(`
        *,
        workout_programs (
          name,
          level,
          duration
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating planned workout:', error);
    throw error;
  }
};

/**
 * Get the latest personal record (PR) for the user
 * Automatically detects PR by finding the highest weight for each exercise
 * and returns the most recent one
 */
export const getLatestPR = async (userId) => {
  try {
    // First, try to get exercises with is_pr column if it exists
    const { data: prData, error: prError } = await supabase
      .from('exercise_progress')
      .select('exercise_name, weight, reps, date')
      .eq('user_id', userId)
      .eq('is_pr', true)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // If is_pr column exists and we found a PR, return it
    if (!prError && prData) {
      return prData;
    }
    
    // If is_pr column doesn't exist or no PR found, calculate PR automatically
    // Get all exercise progress entries
    const { data: allProgress, error: allError } = await supabase
      .from('exercise_progress')
      .select('exercise_name, weight, reps, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (allError) throw allError;
    if (!allProgress || allProgress.length === 0) return null;
    
    // Group by exercise and find max weight for each
    const exerciseMaxWeight = {};
    
    allProgress.forEach(entry => {
      const weight = parseFloat(entry.weight) || 0;
      const exerciseName = entry.exercise_name;
      
      if (!exerciseMaxWeight[exerciseName] || weight > exerciseMaxWeight[exerciseName].weight) {
        exerciseMaxWeight[exerciseName] = {
          exercise_name: exerciseName,
          weight: entry.weight,
          reps: entry.reps,
          date: entry.date,
          maxWeight: weight
        };
      }
    });
    
    // Convert to array and sort by date to get most recent PR
    const prs = Object.values(exerciseMaxWeight);
    if (prs.length === 0) return null;
    
    // Sort by date (most recent first)
    prs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Return the most recent PR
    const latestPR = prs[0];
    return {
      exercise_name: latestPR.exercise_name,
      weight: latestPR.weight,
      reps: latestPR.reps,
      date: latestPR.date
    };
    
  } catch (error) {
    console.error('Error getting latest PR:', error);
    return null;
  }
};

