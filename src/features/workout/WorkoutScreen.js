import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, Badge, Button } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useUser } from '../../context/UserContext';
import { getCustomPrograms, getPresetPrograms, createWorkoutProgram, deleteWorkoutProgram, getAllExercises, searchExercises } from '../../services';
import { fallbackExercises } from '../../data/mockData';

const WorkoutScreen = ({ navigation }) => {
  const { userId } = useUser();
  const [activeTab, setActiveTab] = useState('my-programs'); // 'my-programs' or 'preset'
  const [customPrograms, setCustomPrograms] = useState([]);
  const [presetPrograms, setPresetPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedPrograms, setExpandedPrograms] = useState({}); // Track expanded programs
  
  // Form state
  const [programName, setProgramName] = useState('');
  const [programLevel, setProgramLevel] = useState('beginner');
  const [exercises, setExercises] = useState([]);
  
  // Exercise form state
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseSets, setExerciseSets] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [exerciseRest, setExerciseRest] = useState('60'); // Default 60 seconds
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);

  useEffect(() => {
    if (userId) {
      loadPrograms();
    }
    loadExercises();
  }, [userId]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const [custom, preset] = await Promise.all([
        getCustomPrograms(userId),
        getPresetPrograms(),
      ]);
      setCustomPrograms(custom);
      setPresetPrograms(preset);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const exercises = await getAllExercises();
      if (exercises && exercises.length > 0) {
        console.log(`Loaded ${exercises.length} exercises from Supabase`);
        setAllExercises(exercises);
        setFilteredExercises(exercises);
      } else {
        // Use fallback if Supabase table is empty or doesn't exist
        console.log(`Using fallback exercise list (${fallbackExercises.length} exercises)`);
        setAllExercises(fallbackExercises);
        setFilteredExercises(fallbackExercises);
      }
    } catch (error) {
      console.error('Error loading exercises from Supabase, using fallback list:', error);
      // Fallback to local list if table doesn't exist yet
      console.log(`Fallback loaded: ${fallbackExercises.length} exercises`);
      setAllExercises(fallbackExercises);
      setFilteredExercises(fallbackExercises);
    }
  };

  const resetForm = () => {
    setProgramName('');
    setProgramLevel('beginner');
    setExercises([]);
    setSelectedExercise(null);
    setExerciseSets('');
    setExerciseReps('');
    setExerciseRest('60');
    setEditingExerciseIndex(null);
  };

  // Modal kapatma fonksiyonu - tüm modal state'lerini temizler
  const closeCreateModal = () => {
    setShowExerciseModal(false); // Önce exercise modal'ı kapat
    setShowCreateModal(false);
    resetForm();
  };

  const resetExerciseForm = () => {
    setSelectedExercise(null);
    setExerciseSets('');
    setExerciseReps('');
    setExerciseRest('60');
    setEditingExerciseIndex(null);
  };

  const handleExerciseSearch = (query) => {
    setExerciseSearchQuery(query);
    if (query.trim() === '') {
      setFilteredExercises(allExercises);
    } else {
      const filtered = allExercises.filter(ex => 
        ex.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(false);
  };

  const openExerciseSelector = () => {
    console.log(`Opening exercise selector with ${allExercises.length} exercises`);
    console.log('First 3 exercises:', allExercises.slice(0, 3).map(e => e.name));
    console.log('Filtered exercise count before open:', filteredExercises.length);
    setExerciseSearchQuery('');
    setFilteredExercises(allExercises);
    setShowExerciseModal(true);
  };

  const addOrUpdateExercise = () => {
    if (!selectedExercise || !exerciseSets.trim() || !exerciseReps.trim()) {
      Alert.alert('Hata', 'Lütfen tüm egzersiz bilgilerini doldurun');
      return;
    }

    const exerciseData = {
      name: selectedExercise.name,
      sets: exerciseSets.trim(),
      reps: exerciseReps.trim(),
      rest: exerciseRest,
    };

    if (editingExerciseIndex !== null) {
      // Update existing exercise
      const updatedExercises = [...exercises];
      updatedExercises[editingExerciseIndex] = exerciseData;
      setExercises(updatedExercises);
    } else {
      // Add new exercise
      setExercises([...exercises, exerciseData]);
    }

    resetExerciseForm();
  };

  const editExercise = (index) => {
    const exercise = exercises[index];
    // Find the exercise in the list to set selectedExercise
    const foundExercise = allExercises.find(ex => ex.name === exercise.name);
    setSelectedExercise(foundExercise || { name: exercise.name });
    setExerciseSets(exercise.sets);
    setExerciseReps(exercise.reps);
    setExerciseRest(exercise.rest || '60');
    setEditingExerciseIndex(index);
  };

  const removeExercise = (index) => {
    Alert.alert(
      'Egzersizi Sil',
      'Bu egzersizi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter((_, i) => i !== index));
            if (editingExerciseIndex === index) {
              resetExerciseForm();
            }
          }
        }
      ]
    );
  };

  const moveExercise = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const updatedExercises = [...exercises];
    const temp = updatedExercises[index];
    updatedExercises[index] = updatedExercises[newIndex];
    updatedExercises[newIndex] = temp;
    setExercises(updatedExercises);
  };

  const calculateEstimatedDuration = () => {
    if (exercises.length === 0) return 0;
    
    const totalSets = exercises.reduce((sum, ex) => sum + parseInt(ex.sets || 0), 0);
    const avgSetDuration = 60; // Average 60 seconds per set (including exercise time)
    const avgRestTime = exercises.reduce((sum, ex) => sum + parseInt(ex.rest || 60), 0) / exercises.length;
    
    const totalMinutes = Math.round((totalSets * avgSetDuration + totalSets * avgRestTime) / 60);
    return totalMinutes;
  };

  const toggleExpandProgram = (programId) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  const handleStartWorkout = (program) => {
    Alert.alert(
      'Antrenmana Başla',
      `${program.name} programına başlamak üzeresiniz. Hazır mısınız?`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Başla',
          onPress: () => {
            // Navigate to workout detail screen
            navigation.navigate('WorkoutDetail', { program });
          }
        }
      ]
    );
  };

  const handleDeleteProgram = (program) => {
    Alert.alert(
      'Programı Sil',
      `"${program.name}" programını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkoutProgram(program.id);
              // Refresh programs list
              await loadPrograms();
              Alert.alert('Başarılı', 'Program silindi.');
            } catch (error) {
              console.error('Error deleting program:', error);
              Alert.alert('Hata', 'Program silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleCreateProgram = async () => {
    if (!programName.trim()) {
      Alert.alert('Hata', 'Lütfen program adı girin');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir egzersiz ekleyin');
      return;
    }

    try {
      setCreating(true);
      
      const estimatedDuration = calculateEstimatedDuration();
      
      const programData = {
        name: programName.trim(),
        level: programLevel,
        duration: `${estimatedDuration} dk`,
        category: 'custom',
        exercises: exercises,
      };

      await createWorkoutProgram(userId, programData);
      
      // Refresh programs list
      await loadPrograms();
      
      // Close modal and reset form
      closeCreateModal();
      
      Alert.alert('Başarılı', 'Program başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Error creating program:', error?.message || error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu';
      Alert.alert('Hata', `Program oluşturulurken bir hata oluştu: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseIcon}>
        <Ionicons name="fitness" size={16} color={colors.secondary} />
      </View>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseDetails}>{item.sets} set × {item.reps}</Text>
    </View>
  );

  const renderProgramCard = ({ item }) => {
    const isExpanded = expandedPrograms[item.id];
    const displayExercises = isExpanded ? item.exercises : item.exercises.slice(0, 3);
    const hasMoreExercises = item.exercises.length > 3;

    return (
      <Card style={styles.programCard}>
        <View style={styles.programHeader}>
          <View style={styles.programTitleContainer}>
            <Text style={styles.programName}>{item.name}</Text>
            <Badge 
              label={
                item.level === 'beginner' ? 'Başlangıç' : 
                item.level === 'intermediate' ? 'Orta' : 
                'İleri'
              }
              variant={item.level}
            />
          </View>
          <View style={styles.programMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.exercises.length} hareket</Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.programDescription}>{item.description}</Text>
        )}

        <View style={styles.exercisesList}>
          <Text style={styles.exercisesTitle}>Hareketler:</Text>
          {displayExercises.map((exercise, index) => (
            <View key={index} style={styles.exercisePreview}>
              <Text style={styles.exercisePreviewText}>
                {`• ${exercise.name || ''} (${exercise.sets || 0}×${exercise.reps || 0})`}
              </Text>
            </View>
          ))}
          {hasMoreExercises && (
            <TouchableOpacity 
              onPress={() => toggleExpandProgram(item.id)}
              style={styles.moreExercisesButton}
            >
              <Text style={styles.moreExercises}>
                {isExpanded 
                  ? 'Daha az göster' 
                  : `+${item.exercises.length - 3} hareket daha`
                }
              </Text>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.programButtons}>
          <Button 
            title="Antrenmana Başla"
            onPress={() => handleStartWorkout(item)}
            style={styles.startProgramButton}
            size="small"
          />
          {/* Silme butonu - sadece kullanıcının oluşturduğu programlarda */}
          {item.category === 'custom' && (
            <TouchableOpacity 
              style={styles.deleteProgramButton}
              onPress={() => handleDeleteProgram(item)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'my-programs' && styles.tabActive
          ]}
          onPress={() => setActiveTab('my-programs')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'my-programs' && styles.tabTextActive
          ]}>
            Programlarım
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'preset' && styles.tabActive
          ]}
          onPress={() => setActiveTab('preset')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'preset' && styles.tabTextActive
          ]}>
            Hazır Programlar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'my-programs' ? (
        <View style={styles.content}>
          {/* Create New Program Button */}
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={48} color={colors.primary} />
            <Text style={styles.createButtonText}>Yeni Program Oluştur</Text>
            <Text style={styles.createButtonSubtext}>
              Kendi antrenman programını tasarla
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Oluşturduğun Programlar</Text>
          {customPrograms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>Henüz program oluşturmadın</Text>
              <Text style={styles.emptySubtext}>
                Yukarıdaki butona tıklayarak ilk programını oluştur
              </Text>
            </View>
          ) : (
            <FlatList
              data={customPrograms}
              renderItem={renderProgramCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Seviyene Göre Programlar</Text>
          <FlatList
            data={presetPrograms}
            renderItem={renderProgramCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Create Program Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCreateModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Program Oluştur</Text>
                <TouchableOpacity onPress={closeCreateModal}>
                  <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Program Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Program Adı *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Göğüs & Triceps"
                  placeholderTextColor={colors.textMuted}
                  value={programName}
                  onChangeText={setProgramName}
                />
              </View>

              {/* Level Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Seviye *</Text>
                <View style={styles.levelButtons}>
                  <TouchableOpacity
                    style={[
                      styles.levelButton,
                      programLevel === 'beginner' && styles.levelButtonActive
                    ]}
                    onPress={() => setProgramLevel('beginner')}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      programLevel === 'beginner' && styles.levelButtonTextActive
                    ]}>Başlangıç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.levelButton,
                      programLevel === 'intermediate' && styles.levelButtonActive
                    ]}
                    onPress={() => setProgramLevel('intermediate')}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      programLevel === 'intermediate' && styles.levelButtonTextActive
                    ]}>Orta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.levelButton,
                      programLevel === 'advanced' && styles.levelButtonActive
                    ]}
                    onPress={() => setProgramLevel('advanced')}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      programLevel === 'advanced' && styles.levelButtonTextActive
                    ]}>İleri</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Estimated Duration */}
              {exercises.length > 0 && (
                <View style={styles.formGroup}>
                  <View style={styles.durationInfo}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <Text style={styles.durationText}>
                      Tahmini Süre: {calculateEstimatedDuration()} dk
                    </Text>
                  </View>
                </View>
              )}

              {/* Exercise Form */}
              <View style={styles.exerciseFormSection}>
                <Text style={styles.sectionTitle}>Egzersizler *</Text>
                
                <View style={styles.exerciseForm}>
                  {/* Exercise Selector */}
                  <TouchableOpacity
                    style={styles.exerciseSelectorButton}
                    onPress={openExerciseSelector}
                  >
                    <Text style={[
                      styles.exerciseSelectorText,
                      !selectedExercise && styles.exerciseSelectorPlaceholder
                    ]}>
                      {selectedExercise ? selectedExercise.name : 'Egzersiz Seç'}
                    </Text>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <View style={styles.exerciseRow}>
                    <TextInput
                      style={[styles.input, styles.exerciseSmallInput]}
                      placeholder="Set"
                      placeholderTextColor={colors.textMuted}
                      value={exerciseSets}
                      onChangeText={setExerciseSets}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, styles.exerciseSmallInput]}
                      placeholder="Tekrar"
                      placeholderTextColor={colors.textMuted}
                      value={exerciseReps}
                      onChangeText={setExerciseReps}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Rest Time Selector */}
                  <View style={styles.restTimeContainer}>
                    <Text style={styles.restTimeLabel}>Dinlenme (sn):</Text>
                    <View style={styles.restTimeButtons}>
                      {['30', '60', '90', '120'].map((seconds) => (
                        <TouchableOpacity
                          key={seconds}
                          style={[
                            styles.restTimeButton,
                            exerciseRest === seconds && styles.restTimeButtonActive
                          ]}
                          onPress={() => setExerciseRest(seconds)}
                        >
                          <Text style={[
                            styles.restTimeButtonText,
                            exerciseRest === seconds && styles.restTimeButtonTextActive
                          ]}>
                            {seconds}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addExerciseButtonLarge}
                    onPress={addOrUpdateExercise}
                  >
                    <Ionicons 
                      name={editingExerciseIndex !== null ? "checkmark" : "add"} 
                      size={20} 
                      color={colors.text} 
                    />
                    <Text style={styles.addExerciseButtonText}>
                      {editingExerciseIndex !== null ? 'Güncelle' : 'Egzersiz Ekle'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Exercise List */}
                {exercises.length > 0 && (
                  <View style={styles.exerciseList}>
                    {exercises.map((exercise, index) => (
                      <View key={index} style={styles.exerciseListItem}>
                        <View style={styles.exerciseListInfo}>
                          <Text style={styles.exerciseListName}>{exercise.name || 'Egzersiz'}</Text>
                          <Text style={styles.exerciseListDetails}>
                            {`${exercise.sets || 0} set × ${exercise.reps || 0} • ${exercise.rest || 60}sn dinlenme`}
                          </Text>
                        </View>
                        <View style={styles.exerciseActions}>
                          {/* Move Up/Down Buttons */}
                          <View style={styles.moveButtons}>
                            <TouchableOpacity 
                              onPress={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                              style={styles.moveButton}
                            >
                              <Ionicons 
                                name="chevron-up" 
                                size={18} 
                                color={index === 0 ? colors.textMuted : colors.textSecondary} 
                              />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => moveExercise(index, 'down')}
                              disabled={index === exercises.length - 1}
                              style={styles.moveButton}
                            >
                              <Ionicons 
                                name="chevron-down" 
                                size={18} 
                                color={index === exercises.length - 1 ? colors.textMuted : colors.textSecondary} 
                              />
                            </TouchableOpacity>
                          </View>
                          {/* Edit Button */}
                          <TouchableOpacity 
                            onPress={() => editExercise(index)}
                            style={styles.editButton}
                          >
                            <Ionicons name="pencil" size={18} color={colors.primary} />
                          </TouchableOpacity>
                          {/* Delete Button */}
                          <TouchableOpacity onPress={() => removeExercise(index)}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Create Button */}
              <Button
                title={creating ? "Oluşturuluyor..." : "Programı Oluştur"}
                onPress={handleCreateProgram}
                disabled={creating}
                style={styles.createModalButton}
              />
            </ScrollView>
          </View>

          {/* Exercise Selection Modal - İÇ İÇE (nested) */}
          <Modal
            visible={showExerciseModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowExerciseModal(false)}
          >
            <SafeAreaView style={styles.exerciseModalContainer}>
              {/* Header */}
              <View style={styles.exerciseModalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowExerciseModal(false)}
                  style={styles.exerciseModalBackButton}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.exerciseModalTitle}>
                  Egzersiz Seç
                </Text>
                <View style={styles.exerciseModalHeaderRight}>
                  <Text style={styles.exerciseModalCount}>{filteredExercises.length} egzersiz</Text>
                </View>
              </View>

              {/* Search */}
              <View style={styles.exerciseModalSearchContainer}>
                <View style={styles.exerciseModalSearchBox}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.exerciseModalSearchInput}
                    placeholder="Egzersiz ara..."
                    placeholderTextColor={colors.textMuted}
                    value={exerciseSearchQuery}
                    onChangeText={handleExerciseSearch}
                    returnKeyType="search"
                    autoCorrect={false}
                  />
                  {exerciseSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleExerciseSearch('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Exercise List */}
              <FlatList
                data={filteredExercises}
                keyExtractor={(item, index) => item.id?.toString() || `exercise-${index}`}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.exerciseModalListContent}
                ItemSeparatorComponent={() => <View style={styles.exerciseModalSeparator} />}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.exerciseModalItem,
                      pressed && styles.exerciseModalItemPressed
                    ]}
                    onPress={() => {
                      console.log('Selected:', item.name);
                      handleSelectExercise(item);
                    }}
                  >
                    <View style={styles.exerciseModalItemIcon}>
                      <Ionicons name="barbell" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.exerciseModalItemContent}>
                      <Text style={styles.exerciseModalItemName}>{item.name}</Text>
                      <Text style={styles.exerciseModalItemMeta}>
                        {item.muscle_group || 'Genel'} • {item.equipment || 'Alet gerektirmez'}
                      </Text>
                    </View>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </Pressable>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.exerciseModalEmpty}>
                    <Ionicons name="fitness-outline" size={80} color={colors.textMuted} />
                    <Text style={styles.exerciseModalEmptyTitle}>
                      {allExercises.length === 0 ? 'Egzersizler Yükleniyor...' : 'Egzersiz Bulunamadı'}
                    </Text>
                    <Text style={styles.exerciseModalEmptySubtitle}>
                      {allExercises.length === 0 
                        ? 'Lütfen bekleyin...' 
                        : 'Farklı bir arama terimi deneyin'}
                    </Text>
                  </View>
                )}
              />
            </SafeAreaView>
          </Modal>
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  createButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  createButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  createButtonSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  programCard: {
    marginBottom: spacing.md,
  },
  programHeader: {
    marginBottom: spacing.md,
  },
  programTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  programName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  programMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  programDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  exercisesList: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exercisesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  exercisePreview: {
    marginBottom: spacing.xs,
  },
  exercisePreviewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  moreExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  moreExercises: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  exerciseDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  programButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  startProgramButton: {
    flex: 1,
  },
  deleteProgramButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
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
    maxHeight: '90%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  formGroup: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  levelButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  levelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  levelButtonTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  exerciseFormSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  exerciseForm: {
    marginTop: spacing.sm,
  },
  exerciseInput: {
    marginBottom: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  exerciseSmallInput: {
    flex: 1,
  },
  addExerciseButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseList: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  exerciseListInfo: {
    flex: 1,
  },
  exerciseListName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  exerciseListDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  createModalButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  durationText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  exerciseSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseSelectorText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseSelectorPlaceholder: {
    color: colors.textMuted,
  },
  restTimeContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  restTimeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  restTimeButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  restTimeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  restTimeButtonActive: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  restTimeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  restTimeButtonTextActive: {
    color: colors.secondary,
    fontWeight: fontWeight.bold,
  },
  addExerciseButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addExerciseButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  moveButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  moveButton: {
    padding: 2,
  },
  editButton: {
    padding: spacing.xs / 2,
  },
  // Exercise Modal - Full Screen Styles
  exerciseModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  exerciseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  exerciseModalBackButton: {
    padding: spacing.xs,
  },
  exerciseModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  exerciseModalHeaderRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  exerciseModalCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  exerciseModalSearchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  exerciseModalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseModalSearchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  exerciseModalListContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  exerciseModalSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
  exerciseModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  exerciseModalItemPressed: {
    backgroundColor: colors.surface,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  exerciseModalItemIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseModalItemContent: {
    flex: 1,
  },
  exerciseModalItemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseModalItemMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  exerciseModalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  exerciseModalEmptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  exerciseModalEmptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default WorkoutScreen;

