-- Add is_pr column to exercise_progress table for tracking personal records
-- Migration: 004_add_is_pr_column
-- Created: 2025-11-25

-- Add is_pr column (boolean to mark personal records)
ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS is_pr BOOLEAN DEFAULT false;

-- Add notes column for additional information
ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on is_pr for faster PR queries
CREATE INDEX IF NOT EXISTS idx_exercise_progress_is_pr ON exercise_progress(user_id, is_pr, date DESC);

-- Comments
COMMENT ON COLUMN exercise_progress.is_pr IS 'Marks if this entry is a personal record';
COMMENT ON COLUMN exercise_progress.notes IS 'Additional notes for the exercise entry';

