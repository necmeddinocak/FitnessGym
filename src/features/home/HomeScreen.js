import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, Button } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { motivationalQuotes } from '../../data/mockData';
import { useUser } from '../../context/UserContext';
import { 
  getWorkoutStats, 
  getWorkoutHistoryByDateRange, 
  getWeightHistory, 
  getWeeklyVolumeStats, 
  getLatestPR,
  scheduleWeeklySummaryNotification,
  loadNotificationSettings
} from '../../services';

const HomeScreen = ({ navigation }) => {
  const { userId, userName } = useUser();
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalWorkouts: 0, currentWeight: null, workoutStreak: 0 });
  const [weeklyWorkouts, setWeeklyWorkouts] = useState([]);
  const [volumeStats, setVolumeStats] = useState({ currentVolume: 0, percentageChange: 0 });
  const [latestPR, setLatestPR] = useState(null);
  
  useEffect(() => {
    // Random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
    
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get workout statistics
      const workoutStats = await getWorkoutStats(userId);
      setStats(workoutStats);
      
      // Get current week (Monday to Sunday)
      const today = new Date();
      const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate Monday of current week
      const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + mondayOffset);
      
      // Sunday is 6 days after Monday
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const weekHistory = await getWorkoutHistoryByDateRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Create array for current week (Monday to Sunday)
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const hasWorkout = weekHistory.some(w => w.date === dateStr && w.completed);
        weekDays.push({ date: dateStr, completed: hasWorkout });
      }
      setWeeklyWorkouts(weekDays);
      
      // Haftalık antrenman sayısını hesapla ve bildirimi güncelle
      const completedCount = weekDays.filter(w => w.completed).length;
      
      // Bildirim ayarlarını yükle ve haftalık özet bildirimini güncelle
      try {
        const settings = await loadNotificationSettings();
        
        // Haftalık özet bildirimini güncelle (doğru workout sayısıyla)
        if (settings?.weeklySummary) {
          await scheduleWeeklySummaryNotification(completedCount);
        }
      } catch (notifError) {
        console.log('Bildirim ayarları yüklenemedi:', notifError);
      }
      
      // Get weekly volume stats
      const weeklyVolume = await getWeeklyVolumeStats(userId);
      setVolumeStats(weeklyVolume);
      
      // Get latest PR
      const pr = await getLatestPR(userId);
      setLatestPR(pr);
      
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedWorkouts = weeklyWorkouts.filter(w => w.completed).length;
  const totalDays = weeklyWorkouts.length;
  
  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Hoş Geldin{userName ? `, ${userName}` : ''}! 💪
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('tr-TR', { 
              day: 'numeric',
              month: 'long', 
              year: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </View>

        {/* Motivational Card */}
        <Card style={styles.motivationCard}>
          <View style={styles.quoteIconContainer}>
            <Ionicons name="flame" size={32} color={colors.primary} />
          </View>
          <Text style={styles.quoteText}>{quote}</Text>
        </Card>

        {/* Weekly Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Bu Haftaki Performansın</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>{completedWorkouts}</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Bu hafta {completedWorkouts} gün antrenman yaptın!
              </Text>
            </View>
          </View>

          {/* Week Days with Labels */}
          <View style={styles.weekDaysContainer}>
            {weeklyWorkouts.map((day, index) => {
              // Get the actual day name from the date
              // Add timezone offset to avoid UTC issues
              const dateParts = day.date.split('-');
              const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
              const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
              const dayLabels = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']; // Sunday to Saturday
              const dayLabel = dayLabels[dayOfWeek];
              
              return (
                <View key={index} style={styles.dayColumn}>
                  <Text style={styles.dayLabel}>{dayLabel}</Text>
                  <View 
                    style={[
                      styles.dayCircle,
                      day.completed && styles.dayCompleted
                    ]}
                  >
                    {day.completed && (
                      <Ionicons 
                        name="checkmark" 
                        size={18} 
                        color={colors.text}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Quick Start */}
        <Card style={styles.quickStartCard}>
          <Text style={styles.quickStartTitle}>Hızlı Başlat</Text>
          <Text style={styles.quickStartSubtext}>
            Bugünkü antrenmana hazır mısın?
          </Text>
          <Button 
            title="Antrenmana Başla"
            onPress={() => navigation.navigate('Workout')}
            style={styles.startButton}
          />
        </Card>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          {/* Weekly Volume Load */}
          <Card style={styles.statCard}>
            <Ionicons name="barbell" size={28} color={colors.secondary} />
            <Text style={styles.statNumber}>
              {(volumeStats.currentVolume / 1000).toFixed(1)} Ton
            </Text>
            <Text style={styles.statLabel}>Haftalık Hacim</Text>
            {volumeStats.percentageChange !== 0 && (
              <View style={styles.changeContainer}>
                <Ionicons 
                  name={volumeStats.percentageChange > 0 ? "trending-up" : "trending-down"} 
                  size={14} 
                  color={volumeStats.percentageChange > 0 ? colors.success : colors.error} 
                />
                <Text style={[
                  styles.changeText,
                  { color: volumeStats.percentageChange > 0 ? colors.success : colors.error }
                ]}>
                  {volumeStats.percentageChange > 0 ? '+' : ''}{volumeStats.percentageChange}%
                </Text>
              </View>
            )}
          </Card>
          
          {/* Latest PR */}
          <Card style={styles.statCard}>
            <View style={styles.prHeader}>
              <Ionicons name="trophy" size={28} color={colors.warning} />
              {latestPR && <Text style={styles.prBadge}>Yeni PR</Text>}
            </View>
            {latestPR ? (
              <>
                <Text style={styles.prExercise} numberOfLines={1}>
                  {latestPR.exercise_name}
                </Text>
                <Text style={styles.statNumber}>
                  {latestPR.weight}kg
                </Text>
                <Text style={styles.statLabel}>
                  {latestPR.reps} Tekrar
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Henüz PR Yok</Text>
              </>
            )}
          </Card>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  motivationCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quoteIconContainer: {
    marginBottom: spacing.xs,
  },
  quoteText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.medium,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  summaryCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: colors.primary + '20',
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    lineHeight: 32,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  dayCompleted: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  quickStartCard: {
    marginBottom: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  quickStartTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quickStartSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
    gap: 4,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  prBadge: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.bold,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  prExercise: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});

export default HomeScreen;

