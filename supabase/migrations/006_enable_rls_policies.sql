-- Enable Row Level Security on all tables
-- Migration: 006_enable_rls_policies
-- Created: 2025-11-25
-- Updated: 2025-11-26 - Relaxed policies for development (no auth)

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- ==================== EXERCISES ====================
-- Public read access (everyone can read exercises)
CREATE POLICY "Exercises are viewable by everyone" 
  ON exercises FOR SELECT 
  USING (true);

-- ==================== USERS ====================
-- Relaxed policies for development
CREATE POLICY "Allow select users" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert users" 
  ON users FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update users" 
  ON users FOR UPDATE 
  USING (true);

-- ==================== WORKOUT PROGRAMS ====================
-- Relaxed policies for development
CREATE POLICY "Allow select programs" 
  ON workout_programs FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert programs" 
  ON workout_programs FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update programs" 
  ON workout_programs FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete programs" 
  ON workout_programs FOR DELETE 
  USING (true);

-- ==================== WORKOUT HISTORY ====================
-- Relaxed policies for development
CREATE POLICY "Allow select workout_history" 
  ON workout_history FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert workout_history" 
  ON workout_history FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update workout_history" 
  ON workout_history FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete workout_history" 
  ON workout_history FOR DELETE 
  USING (true);

-- ==================== EXERCISE PROGRESS ====================
-- Relaxed policies for development
CREATE POLICY "Allow select exercise_progress" 
  ON exercise_progress FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert exercise_progress" 
  ON exercise_progress FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update exercise_progress" 
  ON exercise_progress FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete exercise_progress" 
  ON exercise_progress FOR DELETE 
  USING (true);

-- ==================== WEIGHT HISTORY ====================
-- Relaxed policies for development
CREATE POLICY "Allow select weight_history" 
  ON weight_history FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert weight_history" 
  ON weight_history FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update weight_history" 
  ON weight_history FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete weight_history" 
  ON weight_history FOR DELETE 
  USING (true);

-- ==================== NOTES ====================
-- These policies are relaxed for development purposes.
-- For production, implement proper Supabase Auth and use:
--   auth.uid() for user identification
--   Proper RLS policies like: USING (user_id = auth.uid())
