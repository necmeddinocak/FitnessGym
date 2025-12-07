import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, Button } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useUser } from '../../context/UserContext';
import { 
  getExerciseProgress, 
  getWorkoutHistory, 
  getUserExercises,
  getPlannedWorkouts,
  addPlannedWorkout,
  deletePlannedWorkout,
  getWorkoutPrograms
} from '../../services';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const TrackingScreen = () => {
  const { userId } = useUser();
  const navigation = useNavigation();
  const [exerciseProgress, setExerciseProgress] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [fullWorkoutHistory, setFullWorkoutHistory] = useState([]); // Full workout data with details
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  
  // Exercise selection states
  const [availableExercises, setAvailableExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  // Calendar navigation states
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Planned workout states
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planDate, setPlanDate] = useState(null);
  const [planNote, setPlanNote] = useState('');
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (userId) {
      loadTrackingData();
    }
  }, [userId]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadTrackingData();
      }
    }, [userId])
  );

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      
      // Get available exercises, workouts, planned workouts, and programs
      const [userExercises, workouts, planned, programs] = await Promise.all([
        getUserExercises(userId),
        getWorkoutHistory(userId, 60), // Get 60 days for better streak calculation
        getPlannedWorkouts(userId),
        getWorkoutPrograms(userId),
      ]);
      
      setAvailableExercises(userExercises);
      setPlannedWorkouts(planned);
      setWorkoutPrograms(programs);
      
      // If there are exercises and none is selected, select the first one
      if (userExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(userExercises[0]);
        // Load progress for the first exercise
        const progress = await getExerciseProgress(userId, userExercises[0], 10);
        setExerciseProgress(progress.reverse());
      } else if (selectedExercise) {
        // Reload progress for currently selected exercise
        const progress = await getExerciseProgress(userId, selectedExercise, 10);
        setExerciseProgress(progress.reverse());
      }
      
      setFullWorkoutHistory(workouts); // Store full workout data
      // Convert workout history to date strings for calendar (only completed workouts)
      // Normalize date format to YYYY-MM-DD (Supabase might return different formats)
      const normalizedDates = workouts
        .filter(w => w.completed)
        .map(w => {
          // Handle different date formats from Supabase
          if (!w.date) return null;
          const dateStr = String(w.date).split('T')[0]; // Remove time part if exists
          return dateStr;
        })
        .filter(d => d !== null);
      
      console.log('Workout dates for calendar:', normalizedDates);
      setWorkoutHistory(normalizedDates);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate workout streak
  const calculateStreak = () => {
    if (fullWorkoutHistory.length === 0) return 0;
    
    const sortedWorkouts = [...fullWorkoutHistory]
      .filter(w => w.completed)
      .sort((a, b) => {
        // Normalize dates for comparison
        const dateA = new Date(String(a.date).split('T')[0]);
        const dateB = new Date(String(b.date).split('T')[0]);
        return dateB - dateA;
      });
    
    if (sortedWorkouts.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's a workout today or yesterday
    const lastWorkoutDateStr = String(sortedWorkouts[0].date).split('T')[0];
    const lastWorkoutDate = new Date(lastWorkoutDateStr);
    lastWorkoutDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) return 0; // Streak broken
    
    // Count consecutive days
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDateStr = String(sortedWorkouts[i].date).split('T')[0];
      const workoutDate = new Date(workoutDateStr);
      workoutDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (workoutDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (workoutDate < expectedDate) {
        break;
      }
    }
    
    return streak;
  };

  // Calculate total minutes this month
  const calculateMonthlyMinutes = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return fullWorkoutHistory
      .filter(w => {
        // Normalize date format
        const dateStr = w.date ? String(w.date).split('T')[0] : null;
        if (!dateStr) return false;
        const workoutDate = new Date(dateStr);
        return (
          w.completed &&
          w.duration &&
          workoutDate.getMonth() === currentMonth &&
          workoutDate.getFullYear() === currentYear
        );
      })
      .reduce((total, w) => total + (w.duration || 0), 0);
  };

  // Handle exercise selection
  const handleExerciseSelect = async (exerciseName) => {
    try {
      setSelectedExercise(exerciseName);
      setShowExerciseSelector(false);
      setLoading(true);
      
      const progress = await getExerciseProgress(userId, exerciseName, 10);
      setExerciseProgress(progress.reverse());
    } catch (error) {
      console.error('Error loading exercise progress:', error);
      Alert.alert('Hata', 'Egzersiz verisi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Handle day click
  const handleDayClick = (dateStr) => {
    // Normalize dates for comparison (remove time part if exists)
    const completedWorkoutsOnDate = fullWorkoutHistory.filter(w => {
      const workoutDate = w.date ? String(w.date).split('T')[0] : null;
      return workoutDate === dateStr && w.completed;
    });
    const plannedWorkoutsOnDate = plannedWorkouts.filter(w => {
      const plannedDate = w.date ? String(w.date).split('T')[0] : null;
      return plannedDate === dateStr;
    });
    
    console.log('Workouts on date:', dateStr, { completed: completedWorkoutsOnDate, planned: plannedWorkoutsOnDate });
    
    // If there are completed workouts, show them
    if (completedWorkoutsOnDate.length > 0) {
      const cleanedWorkouts = completedWorkoutsOnDate.map(workout => ({
        ...workout,
        duration: workout.duration != null ? Number(workout.duration) : null,
        notes: workout.notes != null ? String(workout.notes) : null,
        workout_programs: workout.workout_programs ? {
          ...workout.workout_programs,
          name: workout.workout_programs.name || 'Antrenman',
          level: workout.workout_programs.level || null,
          duration: workout.workout_programs.duration || null
        } : null
      }));
      
      setSelectedDate({ date: dateStr, workouts: cleanedWorkouts, planned: plannedWorkoutsOnDate });
      setShowWorkoutModal(true);
      return;
    }
    
    // If there are planned workouts, show options
    if (plannedWorkoutsOnDate.length > 0) {
      const planned = plannedWorkoutsOnDate[0];
      Alert.alert(
        'Planlı Antrenman',
        `${new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n${planned.workout_programs?.name || 'Genel Antrenman'}${planned.notes ? '\n\nNot: ' + planned.notes : ''}`,
        [
          { text: 'Kapat', style: 'cancel' },
          { 
            text: 'Planı Sil', 
            style: 'destructive',
            onPress: () => handleDeletePlan(planned.id)
          },
        ]
      );
      return;
    }
    
    // No workout - open plan modal
    openPlanModal(dateStr);
  };

  // Open plan modal for a specific date
  const openPlanModal = (dateStr) => {
    setPlanDate(dateStr);
    setPlanNote('');
    setSelectedProgram(null);
    setShowPlanModal(true);
  };

  // Save planned workout
  const handleSavePlan = async () => {
    if (!planDate) return;
    
    try {
      setSavingPlan(true);
      await addPlannedWorkout(
        userId, 
        planDate, 
        selectedProgram?.id || null, 
        planNote.trim() || null
      );
      
      // Reload data
      const planned = await getPlannedWorkouts(userId);
      setPlannedWorkouts(planned);
      
      setShowPlanModal(false);
      setPlanDate(null);
      setPlanNote('');
      setSelectedProgram(null);
      
      Alert.alert('Başarılı', 'Antrenman planlandı!');
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Hata', 'Plan kaydedilirken bir hata oluştu.');
    } finally {
      setSavingPlan(false);
    }
  };

  // Delete planned workout
  const handleDeletePlan = async (planId) => {
    try {
      await deletePlannedWorkout(planId);
      
      // Reload data
      const planned = await getPlannedWorkouts(userId);
      setPlannedWorkouts(planned);
      
      Alert.alert('Başarılı', 'Plan silindi.');
    } catch (error) {
      console.error('Error deleting plan:', error);
      Alert.alert('Hata', 'Plan silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Exercise progress chart
  const renderExerciseChart = () => {
    if (availableExercises.length === 0) {
      return (
        <TouchableOpacity 
          style={styles.emptyState}
          onPress={() => navigation.navigate('Workout')}
          activeOpacity={0.7}
        >
          <Ionicons name="barbell-outline" size={48} color={colors.primary} />
          <Text style={styles.emptyText}>Henüz egzersiz verisi yok</Text>
          <Text style={styles.emptyActionText}>Antrenman başlatmak için tıklayın</Text>
          <View style={styles.emptyActionButton}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </View>
        </TouchableOpacity>
      );
    }

    if (exerciseProgress.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.primary} />
          <Text style={styles.emptyText}>Bu egzersiz için veri yok</Text>
          <Text style={styles.emptyActionText}>Başka bir egzersiz seçin</Text>
        </View>
      );
    }
    
    const maxWeight = Math.max(...exerciseProgress.map(e => e.weight));
    const minWeight = Math.min(...exerciseProgress.map(e => e.weight));
    const range = maxWeight - minWeight || 1;

    return (
      <View style={styles.chartContainer}>
        {/* Exercise Selector Header */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Egzersiz İlerlemesi</Text>
          <TouchableOpacity 
            style={styles.exerciseSelectorButton}
            onPress={() => setShowExerciseSelector(true)}
          >
            <Text style={styles.selectedExerciseName} numberOfLines={1}>
              {selectedExercise || 'Egzersiz Seç'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.chart}>
          {exerciseProgress.map((entry, index) => {
            const height = ((entry.weight - minWeight) / range) * 120 + 20;
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.weightLabel}>{String(entry.weight)}</Text>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: height,
                      backgroundColor: index === exerciseProgress.length - 1 
                        ? colors.primary 
                        : colors.accent + '60'
                    }
                  ]} 
                />
                <Text style={styles.dateLabel}>
                  {`${new Date(entry.date).getDate()}/${new Date(entry.date).getMonth() + 1}`}
                </Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.chartStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              +{(exerciseProgress[exerciseProgress.length - 1].weight - exerciseProgress[0].weight).toFixed(1)} kg
            </Text>
            <Text style={styles.statLabel}>İlerleme</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {exerciseProgress[exerciseProgress.length - 1].weight} kg
            </Text>
            <Text style={styles.statLabel}>Güncel PR</Text>
          </View>
        </View>
      </View>
    );
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
  };

  // Check if current calendar view is the current month
  const isCurrentMonth = () => {
    const today = new Date();
    return calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
  };

  // Calendar heatmap
  const renderWorkoutCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    
    // Adjust first day to start from Monday (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Get planned workout dates (normalize format)
    const plannedDates = plannedWorkouts.map(w => w.date ? String(w.date).split('T')[0] : null).filter(d => d);
    
    const weeks = [];
    let week = new Array(adjustedFirstDay).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasWorkout = workoutHistory.includes(dateStr);
      const hasPlanned = plannedDates.includes(dateStr);
      const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
      
      week.push({ day, hasWorkout, hasPlanned, dateStr, isToday });
      
      if (week.length === 7 || day === daysInMonth) {
        weeks.push([...week]);
        week = [];
      }
    }

    // Create display date for header
    const displayDate = new Date(calendarYear, calendarMonth, 1);

    return (
      <Card style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>Antrenman Takvimi</Text>
        
        {/* Calendar Navigation */}
        <View style={styles.calendarNavigation}>
          <TouchableOpacity 
            style={styles.calendarNavButton}
            onPress={goToPreviousMonth}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.calendarMonthDisplay}
            onPress={goToCurrentMonth}
          >
            <Text style={styles.calendarMonthText}>
              {displayDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </Text>
            {!isCurrentMonth() && (
              <Text style={styles.calendarTodayHint}>Bugüne dön</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.calendarNavButton}
            onPress={goToNextMonth}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDaysHeader}>
          {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, i) => (
            <Text key={i} style={styles.weekDayLabel}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendar}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((dayData, dayIndex) => (
                <View key={dayIndex} style={styles.calendarDayContainer}>
                  {dayData ? (
                    <TouchableOpacity
                      style={[
                        styles.calendarDay,
                        dayData.hasWorkout && styles.calendarDayActive,
                        dayData.hasPlanned && !dayData.hasWorkout && styles.calendarDayPlanned,
                        dayData.isToday && styles.calendarDayToday,
                      ]}
                      onPress={() => handleDayClick(dayData.dateStr)}
                      activeOpacity={0.7}
                    >
                      <Text 
                        style={[
                          styles.calendarDayText,
                          dayData.hasWorkout && styles.calendarDayTextActive,
                          dayData.hasPlanned && !dayData.hasWorkout && styles.calendarDayTextPlanned,
                        ]}
                      >
                        {String(dayData.day)}
                      </Text>
                      {dayData.hasPlanned && !dayData.hasWorkout && (
                        <View style={styles.plannedDot} />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.calendarDay} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Tamamlandı</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
            <Text style={styles.legendText}>Planlandı</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surfaceLight }]} />
            <Text style={styles.legendText}>Boş</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Exercise Progress Chart */}
          <Card style={styles.mainChart}>
            {renderExerciseChart()}
          </Card>

          {/* Workout Calendar */}
          {renderWorkoutCalendar()}

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <Card style={styles.quickStatCard}>
              <Ionicons name="flame" size={32} color="#22C55E" />
              <Text style={styles.quickStatNumber}>{String(calculateStreak() || 0)}</Text>
              <Text style={styles.quickStatLabel}>Günlük Seri</Text>
            </Card>

            <Card style={styles.quickStatCard}>
              <Ionicons name="time" size={32} color="#22C55E" />
              <Text style={styles.quickStatNumber}>{String(calculateMonthlyMinutes() || 0)}</Text>
              <Text style={styles.quickStatLabel}>Dakika Bu Ay</Text>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Exercise Selector Modal */}
      <Modal
        visible={showExerciseSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseSelectorModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Egzersiz Seç</Text>
                <Text style={styles.modalSubtitle}>
                  {availableExercises.length} egzersiz bulundu
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowExerciseSelector(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Exercise List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.exerciseList}>
              {availableExercises.map((exercise, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.exerciseItem,
                    selectedExercise === exercise && styles.exerciseItemSelected
                  ]}
                  onPress={() => handleExerciseSelect(exercise)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseItemIcon}>
                    <Ionicons 
                      name={selectedExercise === exercise ? "barbell" : "barbell-outline"} 
                      size={24} 
                      color={selectedExercise === exercise ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <Text style={[
                    styles.exerciseItemText,
                    selectedExercise === exercise && styles.exerciseItemTextSelected
                  ]}>
                    {exercise}
                  </Text>
                  {selectedExercise === exercise && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Workout Details Modal */}
      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDate && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Antrenman Detayları</Text>
                    <Text style={styles.modalDate}>
                      {new Date(selectedDate.date).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
                    <Ionicons name="close" size={28} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Workouts List */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedDate.workouts && Array.isArray(selectedDate.workouts) && selectedDate.workouts.map((workout, index) => {
                    if (!workout) return null;
                    
                    return (
                      <Card key={index} style={styles.workoutDetailCard}>
                        {/* Workout Header */}
                        <View style={styles.workoutDetailHeader}>
                          <View style={styles.workoutIconContainer}>
                            <Ionicons name="fitness" size={24} color={colors.primary} />
                          </View>
                          <View style={styles.workoutHeaderInfo}>
                            <Text style={styles.workoutProgramName}>
                              {(workout.workout_programs && workout.workout_programs.name) || 'Antrenman'}
                            </Text>
                            {workout.workout_programs && workout.workout_programs.level && (
                              <Text style={styles.workoutLevel}>
                                {workout.workout_programs.level === 'beginner' 
                                  ? 'Başlangıç' 
                                  : workout.workout_programs.level === 'intermediate' 
                                  ? 'Orta' 
                                  : 'İleri'}
                              </Text>
                            )}
                          </View>
                          {workout.completed && (
                            <View style={styles.completedBadge}>
                              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            </View>
                          )}
                        </View>

                      {/* Workout Stats */}
                      <View style={styles.workoutStats}>
                        {workout.duration != null && (
                          <View style={styles.workoutStatItem}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.workoutStatText}>
                              {`${workout.duration} dk`}
                            </Text>
                          </View>
                        )}
                        {workout.notes != null && String(workout.notes).trim() !== '' && (
                          <View style={styles.workoutStatItem}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.workoutStatText}>
                              {`${workout.notes}`}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Program Duration */}
                      {workout.workout_programs && workout.workout_programs.duration && String(workout.workout_programs.duration).trim() !== '' && (
                        <View style={styles.workoutDurationBadge}>
                          <Text style={styles.workoutDurationText}>
                            {`${workout.workout_programs.duration}`}
                          </Text>
                        </View>
                      )}
                      </Card>
                    );
                  })}
                </ScrollView>

                {/* Close Button */}
                <Button
                  title="Kapat"
                  onPress={() => setShowWorkoutModal(false)}
                  style={styles.closeButton}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Plan Workout Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.planModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Antrenman Planla</Text>
                {planDate && (
                  <Text style={styles.modalDate}>
                    {new Date(planDate).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.planModalScroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.planModalScrollContent}
            >
              {/* Program Selection */}
              <Text style={styles.planSectionTitle}>Program Seçin (İsteğe Bağlı)</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.programsScrollView}
                contentContainerStyle={styles.programsContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.programCard,
                    !selectedProgram && styles.programCardSelected
                  ]}
                  onPress={() => setSelectedProgram(null)}
                >
                  <Ionicons 
                    name="fitness-outline" 
                    size={28} 
                    color={!selectedProgram ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.programCardTitle,
                    !selectedProgram && styles.programCardTitleSelected
                  ]}>
                    Genel
                  </Text>
                </TouchableOpacity>
                
                {workoutPrograms.map((program) => (
                  <TouchableOpacity
                    key={program.id}
                    style={[
                      styles.programCard,
                      selectedProgram?.id === program.id && styles.programCardSelected
                    ]}
                    onPress={() => setSelectedProgram(program)}
                  >
                    <Ionicons 
                      name="barbell" 
                      size={28} 
                      color={selectedProgram?.id === program.id ? colors.primary : colors.textSecondary} 
                    />
                    <Text 
                      style={[
                        styles.programCardTitle,
                        selectedProgram?.id === program.id && styles.programCardTitleSelected
                      ]}
                      numberOfLines={2}
                    >
                      {program.name}
                    </Text>
                    {program.level && (
                      <Text style={styles.programCardLevel}>
                        {program.level === 'beginner' ? 'Başlangıç' : 
                         program.level === 'intermediate' ? 'Orta' : 'İleri'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Note Input */}
              <Text style={styles.planSectionTitle}>Not Ekleyin (İsteğe Bağlı)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Örn: Bacak günü, kardiyo ekle..."
                placeholderTextColor={colors.textMuted}
                value={planNote}
                onChangeText={setPlanNote}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.planModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, savingPlan && styles.saveButtonDisabled]}
                onPress={handleSavePlan}
                disabled={savingPlan}
              >
                {savingPlan ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={20} color={colors.text} />
                    <Text style={styles.saveButtonText}>Planla</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: fontWeight.semibold,
  },
  emptyActionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  emptyActionButton: {
    marginTop: spacing.sm,
  },
  container: {
    padding: spacing.md,
  },
  mainChart: {
    marginBottom: spacing.md,
  },
  chartContainer: {
    paddingVertical: spacing.sm,
  },
  chartHeader: {
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  exerciseSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedExerciseName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: spacing.md,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  weightLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  bar: {
    width: 30,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chartStats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  calendarCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  calendarNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  calendarMonthText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textTransform: 'capitalize',
  },
  calendarTodayHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs / 2,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekDayLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    width: 40,
    textAlign: 'center',
  },
  calendar: {
    marginBottom: spacing.md,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  calendarDayContainer: {
    width: 40,
    alignItems: 'center',
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayActive: {
    backgroundColor: '#22C55E',
  },
  calendarDayPlanned: {
    backgroundColor: '#FF9500',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  calendarDayText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  calendarDayTextActive: {
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  calendarDayTextPlanned: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  plannedDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  quickStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  quickStatNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  quickStatLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  modalDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  workoutDetailCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  workoutDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  workoutHeaderInfo: {
    flex: 1,
  },
  workoutProgramName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  workoutLevel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  completedBadge: {
    marginLeft: spacing.sm,
  },
  workoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  workoutStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  workoutStatText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  workoutDurationBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  workoutDurationText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  closeButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  exerciseSelectorModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  exerciseList: {
    paddingHorizontal: spacing.lg,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exerciseItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  exerciseItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseItemText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  exerciseItemTextSelected: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  // Plan Modal Styles
  planModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  planModalScroll: {
    paddingHorizontal: spacing.lg,
  },
  planModalScrollContent: {
    paddingBottom: spacing.lg,
  },
  planSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  programsScrollView: {
    marginHorizontal: -spacing.lg,
  },
  programsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  programCard: {
    width: 100,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 100,
  },
  programCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  programCardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  programCardTitleSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  programCardLevel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  planModalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});

export default TrackingScreen;

