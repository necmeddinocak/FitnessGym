import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, Button } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useUser } from '../../context/UserContext';
import { addWorkoutHistory, addExerciseProgress } from '../../services';

const WorkoutDetailScreen = ({ route, navigation }) => {
  const { program } = route.params;
  const { userId } = useUser();
  const scrollViewRef = useRef(null);
  const currentScrollY = useRef(0);
  
  const [exercises, setExercises] = useState(
    program.exercises.map((ex, index) => ({
      ...ex,
      id: index,
      completedSets: 0,
      weights: Array(parseInt(ex.sets)).fill(''),
      notes: '',
    }))
  );
  
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [saving, setSaving] = useState(false);

  // Timer
  useEffect(() => {
    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, startTime]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle set completion
  const toggleSet = (exerciseId, setIndex) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newCompletedSets = ex.completedSets === setIndex + 1 
          ? setIndex 
          : setIndex + 1;
        return { ...ex, completedSets: newCompletedSets };
      }
      return ex;
    }));
  };

  // Update weight
  const updateWeight = (exerciseId, setIndex, weight) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newWeights = [...ex.weights];
        newWeights[setIndex] = weight;
        return { ...ex, weights: newWeights };
      }
      return ex;
    }));
  };

  // Calculate progress
  const totalSets = exercises.reduce((sum, ex) => sum + parseInt(ex.sets), 0);
  const completedSets = exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
  const progress = (completedSets / totalSets) * 100;

  // UUID formatını kontrol et
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Finish workout
  const finishWorkout = async () => {
    Alert.alert(
      'Antrenmanı Bitir',
      'Antrenmanı tamamladınız mı? Veriler kaydedilecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Bitir',
          onPress: async () => {
            try {
              setSaving(true);
              
              // Workout history verisi hazırla
              const historyData = {
                date: new Date().toISOString().split('T')[0],
                completed: true,
                duration: Math.floor(elapsedTime / 60),
                notes: `${program.name} - ${completedSets}/${totalSets} set tamamlandı`,
              };
              
              // Sadece geçerli UUID ise workout_program_id ekle
              if (isValidUUID(program.id)) {
                historyData.workout_program_id = program.id;
              }
              
              // Save workout history
              await addWorkoutHistory(userId, historyData);

              // Save exercise progress
              for (const ex of exercises) {
                if (ex.completedSets > 0) {
                  const avgWeight = ex.weights
                    .filter(w => w && !isNaN(parseFloat(w)))
                    .reduce((sum, w) => sum + parseFloat(w), 0) / ex.completedSets || 0;
                  
                  if (avgWeight > 0) {
                    await addExerciseProgress(userId, {
                      exercise_name: ex.name,
                      weight: avgWeight,
                      sets: ex.completedSets,
                      reps: ex.reps,
                      notes: ex.notes,
                    });
                  }
                }
              }

              Alert.alert(
                'Tebrikler! 🎉',
                `Antrenmanı başarıyla tamamladınız!\n\nSüre: ${formatTime(elapsedTime)}\nTamamlanan: ${completedSets}/${totalSets} set`,
                [
                  {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error saving workout:', error);
              Alert.alert('Hata', 'Antrenman kaydedilirken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          onScroll={(event) => {
            currentScrollY.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.container}>
          {/* Header Stats */}
          <Card style={styles.headerCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.statLabel}>Süre</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="fitness-outline" size={24} color={colors.secondary} />
                <Text style={styles.statValue}>
                  {completedSets}/{totalSets}
                </Text>
                <Text style={styles.statLabel}>Set</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={24} color={colors.accent} />
                <Text style={styles.statValue}>{progress.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>İlerleme</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            {/* Pause/Resume Button */}
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={() => setIsPaused(!isPaused)}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={20}
                color={colors.text}
              />
              <Text style={styles.pauseButtonText}>
                {isPaused ? 'Devam Et' : 'Ara Ver'}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Exercises List */}
          {exercises.map((exercise) => (
            <Card key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseName}>{exercise.name || 'Egzersiz'}</Text>
                  <Text style={styles.exerciseInfo}>
                    {`${exercise.sets || 0} set × ${exercise.reps || 0}`}
                  </Text>
                </View>
                <View style={styles.exerciseProgress}>
                  <Text style={styles.exerciseProgressText}>
                    {`${exercise.completedSets || 0}/${exercise.sets || 0}`}
                  </Text>
                </View>
              </View>

              {/* Sets */}
              <View style={styles.setsContainer}>
                {Array.from({ length: parseInt(exercise.sets || 0) || 0 }).map((_, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <TouchableOpacity
                      style={[
                        styles.setCheckbox,
                        setIndex < exercise.completedSets && styles.setCheckboxCompleted,
                      ]}
                      onPress={() => toggleSet(exercise.id, setIndex)}
                    >
                      {setIndex < exercise.completedSets && (
                        <Ionicons name="checkmark" size={16} color={colors.text} />
                      )}
                    </TouchableOpacity>

                    <Text style={styles.setNumber}>Set {setIndex + 1}</Text>

                    <TextInput
                      style={styles.weightInput}
                      placeholder="Ağırlık (kg)"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={exercise.weights[setIndex]}
                      onChangeText={(text) => updateWeight(exercise.id, setIndex, text)}
                      onFocus={(event) => {
                        // Event target'ı hemen yakala (synthetic event pooling nedeniyle)
                        const target = event.target;
                        // Biraz bekleyip scroll yap - klavyenin açılmasını bekle
                        setTimeout(() => {
                          target?.measureInWindow((x, screenY, width, height) => {
                            // Mevcut scroll pozisyonu + ekrandaki pozisyon = içerikteki gerçek pozisyon
                            const targetScrollY = currentScrollY.current + screenY - 250;
                            scrollViewRef.current?.scrollTo({ 
                              y: Math.max(0, targetScrollY), 
                              animated: true 
                            });
                          });
                        }, 150);
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Notes */}
              <TextInput
                style={styles.notesInput}
                placeholder="Not ekle (opsiyonel)"
                placeholderTextColor={colors.textMuted}
                value={exercise.notes}
                onChangeText={(text) => {
                  setExercises(exercises.map(ex => 
                    ex.id === exercise.id ? { ...ex, notes: text } : ex
                  ));
                }}
                multiline
                onFocus={(event) => {
                  // Event target'ı hemen yakala (synthetic event pooling nedeniyle)
                  const target = event.target;
                  // Biraz bekleyip scroll yap - klavyenin açılmasını bekle
                  setTimeout(() => {
                    target?.measureInWindow((x, screenY, width, height) => {
                      // Mevcut scroll pozisyonu + ekrandaki pozisyon = içerikteki gerçek pozisyon
                      const targetScrollY = currentScrollY.current + screenY - 250;
                      scrollViewRef.current?.scrollTo({ 
                        y: Math.max(0, targetScrollY), 
                        animated: true 
                      });
                    });
                  }, 150);
                }}
              />
            </Card>
          ))}

          {/* Finish Button */}
          <Button
            title={saving ? "Kaydediliyor..." : "Antrenmanı Bitir"}
            onPress={finishWorkout}
            disabled={saving || completedSets === 0}
            style={styles.finishButton}
          />
          
          {/* Klavye açıkken altta boşluk bırak */}
          <View style={styles.keyboardSpacer} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: spacing.md,
  },
  keyboardSpacer: {
    height: 0, // Klavye için ekstra boşluk
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  pauseButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  exerciseCard: {
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  exerciseInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  exerciseProgress: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  exerciseProgressText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  setsContainer: {
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  setCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCheckboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  setNumber: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    width: 50,
  },
  weightInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  finishButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

export default WorkoutDetailScreen;


