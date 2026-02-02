import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@golf_round_data';

// Default hole data
const createEmptyHole = (holeNumber) => ({
  hole: holeNumber,
  par: 4,
  scoreToPar: 0, // -3 (albatross) to +4 or more
  fairwayHit: null, // null = not applicable (par 3), true/false for par 4/5
  greenInRegulation: null, // true/false
  upAndDown: null, // null = not applicable (hit GIR), true/false
  putts: 2,
});

// Create 18 empty holes
const createEmptyRound = () =>
  Array.from({ length: 18 }, (_, i) => createEmptyHole(i + 1));

export default function App() {
  const [currentHole, setCurrentHole] = useState(1);
  const [holes, setHoles] = useState(createEmptyRound());
  const [showSummary, setShowSummary] = useState(false);

  // Load saved data on app start
  useEffect(() => {
    loadData();
  }, []);

  // Save data whenever holes change
  useEffect(() => {
    saveData();
  }, [holes]);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setHoles(parsed.holes || createEmptyRound());
        setCurrentHole(parsed.currentHole || 1);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ holes, currentHole })
      );
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  const currentHoleData = holes[currentHole - 1];

  const updateHole = (field, value) => {
    setHoles((prev) => {
      const updated = [...prev];
      updated[currentHole - 1] = { ...updated[currentHole - 1], [field]: value };

      // If par is 3, fairway is not applicable
      if (field === 'par' && value === 3) {
        updated[currentHole - 1].fairwayHit = null;
      }

      // If GIR is true, up and down is not applicable
      if (field === 'greenInRegulation' && value === true) {
        updated[currentHole - 1].upAndDown = null;
      }

      return updated;
    });
  };

  const goToNextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const goToPreviousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const startNewRound = () => {
    Alert.alert(
      'Start New Round',
      'Are you sure you want to start a new round? This will clear all current data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start New',
          style: 'destructive',
          onPress: () => {
            setHoles(createEmptyRound());
            setCurrentHole(1);
            setShowSummary(false);
          },
        },
      ]
    );
  };

  // Calculate stats
  const calculateStats = () => {
    let totalStrokes = 0;
    let totalPar = 0;
    let totalScoreToPar = 0;
    let fairwaysHit = 0;
    let fairwaysPossible = 0;
    let greensHit = 0;
    let greensPossible = 0;
    let upAndDownsConverted = 0;
    let upAndDownAttempts = 0;
    let totalPutts = 0;
    let holesPlayed = 0;

    holes.forEach((hole) => {
      if (hole.greenInRegulation !== null) {
        holesPlayed++;
        totalPar += hole.par;
        totalScoreToPar += hole.scoreToPar;
        totalStrokes += hole.par + hole.scoreToPar;

        greensPossible++;
        if (hole.greenInRegulation) greensHit++;

        if (hole.par > 3) {
          fairwaysPossible++;
          if (hole.fairwayHit) fairwaysHit++;
        }

        if (!hole.greenInRegulation) {
          upAndDownAttempts++;
          if (hole.upAndDown) upAndDownsConverted++;
        }

        totalPutts += hole.putts;
      }
    });

    return {
      totalStrokes,
      totalPar,
      scoreToPar: totalScoreToPar,
      holesPlayed,
      fairwayPercentage: fairwaysPossible > 0 ? Math.round((fairwaysHit / fairwaysPossible) * 100) : 0,
      fairwaysHit,
      fairwaysPossible,
      girPercentage: greensPossible > 0 ? Math.round((greensHit / greensPossible) * 100) : 0,
      greensHit,
      greensPossible,
      upAndDownPercentage: upAndDownAttempts > 0 ? Math.round((upAndDownsConverted / upAndDownAttempts) * 100) : 0,
      upAndDownsConverted,
      upAndDownAttempts,
      totalPutts,
      puttsPerHole: holesPlayed > 0 ? (totalPutts / holesPlayed).toFixed(1) : 0,
    };
  };

  const OptionButton = ({ label, selected, onPress, color = '#2e7d32' }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        selected && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const NumberSelector = ({ value, onDecrease, onIncrease, min = 0, max = 10 }) => (
    <View style={styles.numberSelector}>
      <TouchableOpacity
        style={[styles.numberButton, value <= min && styles.numberButtonDisabled]}
        onPress={onDecrease}
        disabled={value <= min}
      >
        <Text style={styles.numberButtonText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.numberValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.numberButton, value >= max && styles.numberButtonDisabled]}
        onPress={onIncrease}
        disabled={value >= max}
      >
        <Text style={styles.numberButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  if (showSummary) {
    const stats = calculateStats();
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Round Summary</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryScore}>
              {stats.scoreToPar === 0
                ? 'E'
                : stats.scoreToPar > 0
                ? `+${stats.scoreToPar}`
                : stats.scoreToPar}
            </Text>
            <Text style={styles.summarySubtext}>
              {stats.totalStrokes} strokes (Par {stats.totalPar})
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.fairwayPercentage}%</Text>
              <Text style={styles.statLabel}>Fairways</Text>
              <Text style={styles.statDetail}>
                {stats.fairwaysHit}/{stats.fairwaysPossible}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.girPercentage}%</Text>
              <Text style={styles.statLabel}>GIR</Text>
              <Text style={styles.statDetail}>
                {stats.greensHit}/{stats.greensPossible}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.upAndDownPercentage}%</Text>
              <Text style={styles.statLabel}>Up & Down</Text>
              <Text style={styles.statDetail}>
                {stats.upAndDownsConverted}/{stats.upAndDownAttempts}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.puttsPerHole}</Text>
              <Text style={styles.statLabel}>Putts/Hole</Text>
              <Text style={styles.statDetail}>{stats.totalPutts} total</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowSummary(false)}
            >
              <Text style={styles.secondaryButtonText}>Back to Round</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={startNewRound}>
              <Text style={styles.primaryButtonText}>New Round</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView style={styles.scrollView}>
          {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Short Sided</Text>
          <TouchableOpacity onPress={() => setShowSummary(true)}>
            <Text style={styles.summaryLink}>View Summary</Text>
          </TouchableOpacity>
        </View>

        {/* Hole Navigation */}
        <View style={styles.holeNavigation}>
          <TouchableOpacity
            style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
            onPress={goToPreviousHole}
            disabled={currentHole === 1}
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.holeIndicator}>
            <Text style={styles.holeNumber}>Hole {currentHole}</Text>
            <Text style={styles.holeSubtext}>of 18</Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, currentHole === 18 && styles.navButtonDisabled]}
            onPress={goToNextHole}
            disabled={currentHole === 18}
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Hole Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.holePicker}
        >
          {holes.map((hole, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.holePickerItem,
                currentHole === index + 1 && styles.holePickerItemActive,
                hole.greenInRegulation !== null && styles.holePickerItemCompleted,
              ]}
              onPress={() => setCurrentHole(index + 1)}
            >
              <Text
                style={[
                  styles.holePickerText,
                  currentHole === index + 1 && styles.holePickerTextActive,
                ]}
              >
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Card */}
        <View style={styles.inputCard}>
          {/* Par Selection */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Par</Text>
            <View style={styles.optionGroup}>
              {[3, 4, 5].map((par) => (
                <OptionButton
                  key={par}
                  label={par.toString()}
                  selected={currentHoleData.par === par}
                  onPress={() => updateHole('par', par)}
                />
              ))}
            </View>
          </View>

          {/* Score Relative to Par */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Score (relative to par)</Text>
            <View style={styles.scoreSelector}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateHole('scoreToPar', currentHoleData.scoreToPar - 1)}
              >
                <Text style={styles.scoreButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.scoreDisplay}>
                <Text style={[
                  styles.scoreValue,
                  currentHoleData.scoreToPar < 0 && styles.scoreUnder,
                  currentHoleData.scoreToPar > 0 && styles.scoreOver,
                ]}>
                  {currentHoleData.scoreToPar === 0 ? 'E' : 
                   currentHoleData.scoreToPar > 0 ? `+${currentHoleData.scoreToPar}` : 
                   currentHoleData.scoreToPar}
                </Text>
                <Text style={styles.scoreLabel}>
                  {currentHoleData.scoreToPar <= -3 ? 'Albatross' :
                   currentHoleData.scoreToPar === -2 ? 'Eagle' :
                   currentHoleData.scoreToPar === -1 ? 'Birdie' :
                   currentHoleData.scoreToPar === 0 ? 'Par' :
                   currentHoleData.scoreToPar === 1 ? 'Bogey' :
                   currentHoleData.scoreToPar === 2 ? 'Double' :
                   currentHoleData.scoreToPar === 3 ? 'Triple' : 'Bogey+'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateHole('scoreToPar', currentHoleData.scoreToPar + 1)}
              >
                <Text style={styles.scoreButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fairway Hit (only for Par 4 and 5) */}
          {currentHoleData.par > 3 && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Fairway Hit?</Text>
              <View style={styles.optionGroup}>
                <OptionButton
                  label="Yes"
                  selected={currentHoleData.fairwayHit === true}
                  onPress={() => updateHole('fairwayHit', true)}
                />
                <OptionButton
                  label="No"
                  selected={currentHoleData.fairwayHit === false}
                  onPress={() => updateHole('fairwayHit', false)}
                  color="#c62828"
                />
              </View>
            </View>
          )}

          {/* Green in Regulation */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Green in Regulation?</Text>
            <View style={styles.optionGroup}>
              <OptionButton
                label="Yes"
                selected={currentHoleData.greenInRegulation === true}
                onPress={() => updateHole('greenInRegulation', true)}
              />
              <OptionButton
                label="No"
                selected={currentHoleData.greenInRegulation === false}
                onPress={() => updateHole('greenInRegulation', false)}
                color="#c62828"
              />
            </View>
          </View>

          {/* Up and Down (only if missed GIR) */}
          {currentHoleData.greenInRegulation === false && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Up and Down?</Text>
              <View style={styles.optionGroup}>
                <OptionButton
                  label="Yes"
                  selected={currentHoleData.upAndDown === true}
                  onPress={() => updateHole('upAndDown', true)}
                />
                <OptionButton
                  label="No"
                  selected={currentHoleData.upAndDown === false}
                  onPress={() => updateHole('upAndDown', false)}
                  color="#c62828"
                />
              </View>
            </View>
          )}

          {/* Putts */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Putts</Text>
            <NumberSelector
              value={currentHoleData.putts}
              onDecrease={() => updateHole('putts', currentHoleData.putts - 1)}
              onIncrease={() => updateHole('putts', currentHoleData.putts + 1)}
              min={0}
              max={10}
            />
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentHole > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={goToPreviousHole}>
              <Text style={styles.secondaryButtonText}>Previous Hole</Text>
            </TouchableOpacity>
          )}

          {currentHole < 18 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={goToNextHole}>
              <Text style={styles.primaryButtonText}>Next Hole →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowSummary(true)}
            >
              <Text style={styles.primaryButtonText}>Finish Round</Text>
            </TouchableOpacity>
          )}
        </View>

          {/* New Round Button */}
          <TouchableOpacity style={styles.newRoundButton} onPress={startNewRound}>
            <Text style={styles.newRoundButtonText}>Start New Round</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryLink: {
    fontSize: 14,
    color: '#a5d6a7',
    textDecorationLine: 'underline',
  },
  holeNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  holeIndicator: {
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  holeSubtext: {
    fontSize: 14,
    color: '#a5d6a7',
  },
  holePicker: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  holePickerItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  holePickerItemActive: {
    backgroundColor: '#ffffff',
  },
  holePickerItemCompleted: {
    backgroundColor: 'rgba(165, 214, 167, 0.5)',
  },
  holePickerText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  holePickerTextActive: {
    color: '#1a472a',
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputRow: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  optionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  optionButtonTextSelected: {
    color: '#ffffff',
  },
  scoreSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scoreButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a472a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreButtonText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scoreDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333333',
  },
  scoreUnder: {
    color: '#2e7d32',
  },
  scoreOver: {
    color: '#c62828',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  numberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  numberButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a472a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  numberButtonText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  numberValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a472a',
    minWidth: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a472a',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  newRoundButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newRoundButtonText: {
    fontSize: 14,
    color: '#a5d6a7',
    textDecorationLine: 'underline',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  summaryScore: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#1a472a',
  },
  summarySubtext: {
    fontSize: 18,
    color: '#666666',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 20,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a472a',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    textAlign: 'center',
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
  },
  statDetail: {
    fontSize: 12,
    color: '#a5d6a7',
    marginTop: 4,
  },
});
