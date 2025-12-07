-- Create exercises table for standard exercise database
-- Migration: 005_create_exercises_table
-- Created: 2025-11-25

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- upper_body, lower_body, core, cardio, etc.
  muscle_group TEXT NOT NULL, -- chest, back, shoulders, legs, etc.
  equipment TEXT, -- barbell, dumbbell, machine, bodyweight, etc.
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

-- Insert standard exercises
INSERT INTO exercises (name, category, muscle_group, equipment, difficulty, description) VALUES
-- Chest
('Bench Press', 'upper_body', 'chest', 'barbell', 'beginner', 'Göğüs için temel bileşik hareket'),
('Incline Bench Press', 'upper_body', 'chest', 'barbell', 'intermediate', 'Üst göğüs odaklı'),
('Decline Bench Press', 'upper_body', 'chest', 'barbell', 'intermediate', 'Alt göğüs odaklı'),
('Dumbbell Press', 'upper_body', 'chest', 'dumbbell', 'beginner', 'Göğüs için dumbbell hareketi'),
('Incline Dumbbell Press', 'upper_body', 'chest', 'dumbbell', 'intermediate', 'Üst göğüs için dumbbell'),
('Cable Fly', 'upper_body', 'chest', 'cable', 'beginner', 'İzolasyon hareketi'),
('Push-Up', 'upper_body', 'chest', 'bodyweight', 'beginner', 'Vücut ağırlığı ile göğüs çalışması'),
('Dips', 'upper_body', 'chest', 'bodyweight', 'intermediate', 'Göğüs ve triceps için'),

-- Back
('Pull-Up', 'upper_body', 'back', 'bodyweight', 'intermediate', 'Sırt genişliği için'),
('Chin-Up', 'upper_body', 'back', 'bodyweight', 'intermediate', 'Biceps dahil sırt çalışması'),
('Barbell Row', 'upper_body', 'back', 'barbell', 'intermediate', 'Sırt kalınlığı için'),
('Bent-Over Row', 'upper_body', 'back', 'barbell', 'intermediate', 'Klasik sırt hareketi'),
('T-Bar Row', 'upper_body', 'back', 'barbell', 'intermediate', 'Sırt kalınlığı'),
('Lat Pulldown', 'upper_body', 'back', 'machine', 'beginner', 'Lat geliştirme'),
('Cable Row', 'upper_body', 'back', 'cable', 'beginner', 'Orta sırt için'),
('Dumbbell Row', 'upper_body', 'back', 'dumbbell', 'beginner', 'Tek kol sırt çalışması'),
('Deadlift', 'upper_body', 'back', 'barbell', 'advanced', 'Tüm vücut için güç hareketi'),

-- Shoulders
('Overhead Press', 'upper_body', 'shoulders', 'barbell', 'intermediate', 'Omuz için temel hareket'),
('Military Press', 'upper_body', 'shoulders', 'barbell', 'intermediate', 'Klasik omuz hareketi'),
('Shoulder Press', 'upper_body', 'shoulders', 'barbell', 'intermediate', 'Omuz geliştirme'),
('Dumbbell Shoulder Press', 'upper_body', 'shoulders', 'dumbbell', 'beginner', 'Dumbbell ile omuz'),
('Lateral Raise', 'upper_body', 'shoulders', 'dumbbell', 'beginner', 'Yan omuz için izolasyon'),
('Front Raise', 'upper_body', 'shoulders', 'dumbbell', 'beginner', 'Ön omuz için'),
('Rear Delt Fly', 'upper_body', 'shoulders', 'dumbbell', 'beginner', 'Arka omuz için'),
('Face Pull', 'upper_body', 'shoulders', 'cable', 'beginner', 'Arka omuz ve trapez'),

-- Arms - Biceps
('Barbell Curl', 'upper_body', 'biceps', 'barbell', 'beginner', 'Temel biceps hareketi'),
('Dumbbell Curl', 'upper_body', 'biceps', 'dumbbell', 'beginner', 'İzolasyon biceps hareketi'),
('Hammer Curl', 'upper_body', 'biceps', 'dumbbell', 'beginner', 'Brachialis odaklı'),
('Preacher Curl', 'upper_body', 'biceps', 'barbell', 'intermediate', 'İzole biceps çalışması'),
('Cable Curl', 'upper_body', 'biceps', 'cable', 'beginner', 'Sabit gerilim biceps'),
('Concentration Curl', 'upper_body', 'biceps', 'dumbbell', 'beginner', 'Tam izolasyon'),

-- Arms - Triceps
('Triceps Pushdown', 'upper_body', 'triceps', 'cable', 'beginner', 'Temel triceps hareketi'),
('Triceps Extension', 'upper_body', 'triceps', 'dumbbell', 'beginner', 'Triceps izolasyonu'),
('Overhead Extension', 'upper_body', 'triceps', 'dumbbell', 'beginner', 'Uzun baş odaklı'),
('Skull Crusher', 'upper_body', 'triceps', 'barbell', 'intermediate', 'Lying triceps extension'),
('Close-Grip Bench Press', 'upper_body', 'triceps', 'barbell', 'intermediate', 'Bileşik triceps hareketi'),
('Triceps Dips', 'upper_body', 'triceps', 'bodyweight', 'intermediate', 'Vücut ağırlığı triceps'),

-- Legs - Quads
('Squat', 'lower_body', 'legs', 'barbell', 'intermediate', 'Bacak için temel hareket'),
('Front Squat', 'lower_body', 'legs', 'barbell', 'advanced', 'Quad odaklı squat'),
('Bulgarian Split Squat', 'lower_body', 'legs', 'dumbbell', 'intermediate', 'Tek bacak çalışması'),
('Leg Press', 'lower_body', 'legs', 'machine', 'beginner', 'Güvenli bacak hareketi'),
('Leg Extension', 'lower_body', 'legs', 'machine', 'beginner', 'Quad izolasyonu'),
('Lunge', 'lower_body', 'legs', 'dumbbell', 'beginner', 'Fonksiyonel bacak hareketi'),
('Goblet Squat', 'lower_body', 'legs', 'dumbbell', 'beginner', 'Başlangıç için squat'),

-- Legs - Hamstrings
('Romanian Deadlift', 'lower_body', 'hamstrings', 'barbell', 'intermediate', 'Hamstring geliştirme'),
('Leg Curl', 'lower_body', 'hamstrings', 'machine', 'beginner', 'Hamstring izolasyonu'),
('Stiff Leg Deadlift', 'lower_body', 'hamstrings', 'barbell', 'intermediate', 'Hamstring odaklı'),
('Good Morning', 'lower_body', 'hamstrings', 'barbell', 'advanced', 'Posterior chain'),

-- Legs - Calves
('Calf Raise', 'lower_body', 'calves', 'machine', 'beginner', 'Baldır geliştirme'),
('Seated Calf Raise', 'lower_body', 'calves', 'machine', 'beginner', 'Soleus odaklı'),
('Standing Calf Raise', 'lower_body', 'calves', 'machine', 'beginner', 'Gastrocnemius odaklı'),

-- Core
('Plank', 'core', 'abs', 'bodyweight', 'beginner', 'Temel core hareketi'),
('Crunch', 'core', 'abs', 'bodyweight', 'beginner', 'Klasik karın hareketi'),
('Russian Twist', 'core', 'abs', 'bodyweight', 'beginner', 'Oblique çalışması'),
('Leg Raise', 'core', 'abs', 'bodyweight', 'intermediate', 'Alt karın için'),
('Ab Wheel', 'core', 'abs', 'equipment', 'advanced', 'İleri seviye core'),
('Cable Crunch', 'core', 'abs', 'cable', 'intermediate', 'Ağırlıklı karın hareketi'),
('Hanging Leg Raise', 'core', 'abs', 'bodyweight', 'advanced', 'İleri seviye alt karın'),

-- Cardio
('Treadmill', 'cardio', 'cardio', 'machine', 'beginner', 'Koşu bandı kardiyosu'),
('Cycling', 'cardio', 'cardio', 'machine', 'beginner', 'Bisiklet kardiyosu'),
('Rowing', 'cardio', 'cardio', 'machine', 'beginner', 'Kürek çekme kardiyosu'),
('Jump Rope', 'cardio', 'cardio', 'equipment', 'beginner', 'İp atlama'),
('Burpees', 'cardio', 'cardio', 'bodyweight', 'intermediate', 'HIIT hareketi')

ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE exercises IS 'Standard exercise database';
COMMENT ON COLUMN exercises.name IS 'Exercise name';
COMMENT ON COLUMN exercises.category IS 'Exercise category (upper_body, lower_body, core, cardio)';
COMMENT ON COLUMN exercises.muscle_group IS 'Primary muscle group targeted';
COMMENT ON COLUMN exercises.equipment IS 'Required equipment';
COMMENT ON COLUMN exercises.difficulty IS 'Exercise difficulty level';

