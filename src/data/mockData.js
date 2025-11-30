// Mock data for FitnessGym app

export const motivationalQuotes = [
  "Güç, iradeyi yenmekten gelir.",
  "Başarı, günlük çabanın sonucudur.",
  "Vücudun yapabileceklerinin sınırı yoktur, sadece zihnini ikna etmelisin.",
  "Bugün yaptıkların yarının başarısıdır.",
  "En büyük rakibin dünkü kendindir.",
  "Acı geçicidir, gurur kalıcıdır.",
  "Vazgeçmek yok, sadece ilerleme var.",
  "Her tekrar, hedefe bir adım daha yaklaşmaktır.",
];

export const workoutPrograms = [
  {
    id: '1',
    name: 'Göğüs & Triceps',
    level: 'beginner',
    duration: '45 dk',
    exercises: [
      { name: 'Bench Press', sets: '3', reps: '8-10' },
      { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12' },
      { name: 'Cable Fly', sets: '3', reps: '12-15' },
      { name: 'Triceps Pushdown', sets: '3', reps: '10-12' },
      { name: 'Overhead Extension', sets: '3', reps: '12-15' },
    ],
    category: 'custom',
  },
  {
    id: '2',
    name: 'Sırt & Biceps',
    level: 'beginner',
    duration: '50 dk',
    exercises: [
      { name: 'Pull-Up', sets: '3', reps: '6-8' },
      { name: 'Barbell Row', sets: '3', reps: '8-10' },
      { name: 'Lat Pulldown', sets: '3', reps: '10-12' },
      { name: 'Barbell Curl', sets: '3', reps: '10-12' },
      { name: 'Hammer Curl', sets: '3', reps: '12-15' },
    ],
    category: 'custom',
  },
  {
    id: '3',
    name: 'Bacak Günü',
    level: 'intermediate',
    duration: '60 dk',
    exercises: [
      { name: 'Squat', sets: '4', reps: '6-8' },
      { name: 'Leg Press', sets: '3', reps: '10-12' },
      { name: 'Romanian Deadlift', sets: '3', reps: '8-10' },
      { name: 'Leg Curl', sets: '3', reps: '12-15' },
      { name: 'Calf Raise', sets: '4', reps: '15-20' },
    ],
    category: 'custom',
  },
];

export const presetPrograms = [
  {
    id: 'preset1',
    name: 'Full Body Başlangıç',
    level: 'beginner',
    duration: '40 dk',
    description: 'Tüm vücut kaslarını çalıştıran başlangıç programı',
    exercises: [
      { name: 'Squat', sets: '3', reps: '10-12' },
      { name: 'Bench Press', sets: '3', reps: '10-12' },
      { name: 'Bent-Over Row', sets: '3', reps: '10-12' },
      { name: 'Overhead Press', sets: '3', reps: '8-10' },
      { name: 'Plank', sets: '3', reps: '30-45 sn' },
    ],
    category: 'preset',
  },
  {
    id: 'preset2',
    name: 'Push-Pull-Legs (PPL)',
    level: 'intermediate',
    duration: '60 dk',
    description: '3 günlük split program - İtme, Çekme, Bacak',
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '8-10' },
      { name: 'Shoulder Press', sets: '3', reps: '10-12' },
      { name: 'Triceps Dips', sets: '3', reps: '10-12' },
    ],
    category: 'preset',
  },
  {
    id: 'preset3',
    name: 'Üst Vücut Güç',
    level: 'advanced',
    duration: '70 dk',
    description: 'İleri seviye üst vücut geliştirme programı',
    exercises: [
      { name: 'Weighted Pull-Up', sets: '4', reps: '6-8' },
      { name: 'Incline Bench Press', sets: '4', reps: '6-8' },
      { name: 'Barbell Row', sets: '4', reps: '6-8' },
      { name: 'Dumbbell Shoulder Press', sets: '3', reps: '8-10' },
    ],
    category: 'preset',
  },
];

export const weeklyWorkouts = [
  { date: '2025-11-18', completed: true },
  { date: '2025-11-19', completed: true },
  { date: '2025-11-20', completed: false },
  { date: '2025-11-21', completed: true },
  { date: '2025-11-22', completed: true },
];

export const weightHistory = [
  { date: '2025-11-01', weight: 82.5 },
  { date: '2025-11-05', weight: 82.2 },
  { date: '2025-11-08', weight: 81.8 },
  { date: '2025-11-12', weight: 81.5 },
  { date: '2025-11-15', weight: 81.2 },
  { date: '2025-11-18', weight: 80.8 },
  { date: '2025-11-22', weight: 80.5 },
];

export const exerciseProgress = [
  { date: '2025-11-01', exercise: 'Bench Press', weight: 60 },
  { date: '2025-11-05', exercise: 'Bench Press', weight: 62.5 },
  { date: '2025-11-10', exercise: 'Bench Press', weight: 65 },
  { date: '2025-11-15', exercise: 'Bench Press', weight: 65 },
  { date: '2025-11-20', exercise: 'Bench Press', weight: 67.5 },
];

export const workoutHistory = [
  '2025-11-01',
  '2025-11-03',
  '2025-11-05',
  '2025-11-08',
  '2025-11-10',
  '2025-11-12',
  '2025-11-15',
  '2025-11-17',
  '2025-11-19',
  '2025-11-22',
];

export const userProfile = {
  name: 'Ahmet Yılmaz',
  age: 28,
  height: 178, // cm
  currentWeight: 80.5, // kg
  targetWeight: 75, // kg
  joinDate: '2025-01-15',
};

// Fallback exercise list (used if Supabase table doesn't exist yet)
export const fallbackExercises = [
  // Chest
  { id: '1', name: 'Bench Press', category: 'upper_body', muscle_group: 'chest', equipment: 'barbell', difficulty: 'beginner' },
  { id: '2', name: 'Incline Bench Press', category: 'upper_body', muscle_group: 'chest', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '3', name: 'Decline Bench Press', category: 'upper_body', muscle_group: 'chest', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '4', name: 'Dumbbell Press', category: 'upper_body', muscle_group: 'chest', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '5', name: 'Incline Dumbbell Press', category: 'upper_body', muscle_group: 'chest', equipment: 'dumbbell', difficulty: 'intermediate' },
  { id: '6', name: 'Cable Fly', category: 'upper_body', muscle_group: 'chest', equipment: 'cable', difficulty: 'beginner' },
  { id: '7', name: 'Push-Up', category: 'upper_body', muscle_group: 'chest', equipment: 'bodyweight', difficulty: 'beginner' },
  { id: '8', name: 'Dips', category: 'upper_body', muscle_group: 'chest', equipment: 'bodyweight', difficulty: 'intermediate' },
  
  // Back
  { id: '9', name: 'Pull-Up', category: 'upper_body', muscle_group: 'back', equipment: 'bodyweight', difficulty: 'intermediate' },
  { id: '10', name: 'Chin-Up', category: 'upper_body', muscle_group: 'back', equipment: 'bodyweight', difficulty: 'intermediate' },
  { id: '11', name: 'Barbell Row', category: 'upper_body', muscle_group: 'back', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '12', name: 'Bent-Over Row', category: 'upper_body', muscle_group: 'back', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '13', name: 'T-Bar Row', category: 'upper_body', muscle_group: 'back', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '14', name: 'Lat Pulldown', category: 'upper_body', muscle_group: 'back', equipment: 'machine', difficulty: 'beginner' },
  { id: '15', name: 'Cable Row', category: 'upper_body', muscle_group: 'back', equipment: 'cable', difficulty: 'beginner' },
  { id: '16', name: 'Dumbbell Row', category: 'upper_body', muscle_group: 'back', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '17', name: 'Deadlift', category: 'upper_body', muscle_group: 'back', equipment: 'barbell', difficulty: 'advanced' },
  
  // Shoulders
  { id: '18', name: 'Overhead Press', category: 'upper_body', muscle_group: 'shoulders', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '19', name: 'Military Press', category: 'upper_body', muscle_group: 'shoulders', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '20', name: 'Shoulder Press', category: 'upper_body', muscle_group: 'shoulders', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '21', name: 'Dumbbell Shoulder Press', category: 'upper_body', muscle_group: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '22', name: 'Lateral Raise', category: 'upper_body', muscle_group: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '23', name: 'Front Raise', category: 'upper_body', muscle_group: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '24', name: 'Rear Delt Fly', category: 'upper_body', muscle_group: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '25', name: 'Face Pull', category: 'upper_body', muscle_group: 'shoulders', equipment: 'cable', difficulty: 'beginner' },
  
  // Biceps
  { id: '26', name: 'Barbell Curl', category: 'upper_body', muscle_group: 'biceps', equipment: 'barbell', difficulty: 'beginner' },
  { id: '27', name: 'Dumbbell Curl', category: 'upper_body', muscle_group: 'biceps', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '28', name: 'Hammer Curl', category: 'upper_body', muscle_group: 'biceps', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '29', name: 'Preacher Curl', category: 'upper_body', muscle_group: 'biceps', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '30', name: 'Cable Curl', category: 'upper_body', muscle_group: 'biceps', equipment: 'cable', difficulty: 'beginner' },
  { id: '31', name: 'Concentration Curl', category: 'upper_body', muscle_group: 'biceps', equipment: 'dumbbell', difficulty: 'beginner' },
  
  // Triceps
  { id: '32', name: 'Triceps Pushdown', category: 'upper_body', muscle_group: 'triceps', equipment: 'cable', difficulty: 'beginner' },
  { id: '33', name: 'Triceps Extension', category: 'upper_body', muscle_group: 'triceps', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '34', name: 'Overhead Extension', category: 'upper_body', muscle_group: 'triceps', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '35', name: 'Skull Crusher', category: 'upper_body', muscle_group: 'triceps', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '36', name: 'Close-Grip Bench Press', category: 'upper_body', muscle_group: 'triceps', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '37', name: 'Triceps Dips', category: 'upper_body', muscle_group: 'triceps', equipment: 'bodyweight', difficulty: 'intermediate' },
  
  // Legs
  { id: '38', name: 'Squat', category: 'lower_body', muscle_group: 'legs', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '39', name: 'Front Squat', category: 'lower_body', muscle_group: 'legs', equipment: 'barbell', difficulty: 'advanced' },
  { id: '40', name: 'Bulgarian Split Squat', category: 'lower_body', muscle_group: 'legs', equipment: 'dumbbell', difficulty: 'intermediate' },
  { id: '41', name: 'Leg Press', category: 'lower_body', muscle_group: 'legs', equipment: 'machine', difficulty: 'beginner' },
  { id: '42', name: 'Leg Extension', category: 'lower_body', muscle_group: 'legs', equipment: 'machine', difficulty: 'beginner' },
  { id: '43', name: 'Lunge', category: 'lower_body', muscle_group: 'legs', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '44', name: 'Goblet Squat', category: 'lower_body', muscle_group: 'legs', equipment: 'dumbbell', difficulty: 'beginner' },
  { id: '45', name: 'Romanian Deadlift', category: 'lower_body', muscle_group: 'hamstrings', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '46', name: 'Leg Curl', category: 'lower_body', muscle_group: 'hamstrings', equipment: 'machine', difficulty: 'beginner' },
  { id: '47', name: 'Stiff Leg Deadlift', category: 'lower_body', muscle_group: 'hamstrings', equipment: 'barbell', difficulty: 'intermediate' },
  { id: '48', name: 'Good Morning', category: 'lower_body', muscle_group: 'hamstrings', equipment: 'barbell', difficulty: 'advanced' },
  { id: '49', name: 'Calf Raise', category: 'lower_body', muscle_group: 'calves', equipment: 'machine', difficulty: 'beginner' },
  { id: '50', name: 'Seated Calf Raise', category: 'lower_body', muscle_group: 'calves', equipment: 'machine', difficulty: 'beginner' },
  
  // Core
  { id: '51', name: 'Plank', category: 'core', muscle_group: 'abs', equipment: 'bodyweight', difficulty: 'beginner' },
  { id: '52', name: 'Crunch', category: 'core', muscle_group: 'abs', equipment: 'bodyweight', difficulty: 'beginner' },
  { id: '53', name: 'Russian Twist', category: 'core', muscle_group: 'abs', equipment: 'bodyweight', difficulty: 'beginner' },
  { id: '54', name: 'Leg Raise', category: 'core', muscle_group: 'abs', equipment: 'bodyweight', difficulty: 'intermediate' },
  { id: '55', name: 'Ab Wheel', category: 'core', muscle_group: 'abs', equipment: 'equipment', difficulty: 'advanced' },
  { id: '56', name: 'Cable Crunch', category: 'core', muscle_group: 'abs', equipment: 'cable', difficulty: 'intermediate' },
  { id: '57', name: 'Hanging Leg Raise', category: 'core', muscle_group: 'abs', equipment: 'bodyweight', difficulty: 'advanced' },
  
  // Cardio
  { id: '58', name: 'Treadmill', category: 'cardio', muscle_group: 'cardio', equipment: 'machine', difficulty: 'beginner' },
  { id: '59', name: 'Cycling', category: 'cardio', muscle_group: 'cardio', equipment: 'machine', difficulty: 'beginner' },
  { id: '60', name: 'Rowing', category: 'cardio', muscle_group: 'cardio', equipment: 'machine', difficulty: 'beginner' },
  { id: '61', name: 'Jump Rope', category: 'cardio', muscle_group: 'cardio', equipment: 'equipment', difficulty: 'beginner' },
  { id: '62', name: 'Burpees', category: 'cardio', muscle_group: 'cardio', equipment: 'bodyweight', difficulty: 'intermediate' },
];

