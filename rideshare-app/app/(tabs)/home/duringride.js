import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../ui/styles/colors';
import { doc, getDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import { useActiveRide } from '../../../src/context/ActiveRideContext';

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function DuringRidePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rideId, fromAddress, toAddress, rideDate, ownerName } = params;
  const { activeRide, clearActiveRide } = useActiveRide();

  // Elapsed time — computed from the persistent startedAt timestamp in context
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);
  const [isEnding, setIsEnding] = useState(false);
  const [pinInputs, setPinInputs] = useState({});
  const [riders, setRiders] = useState([]);

  // Fetch riders who joined this ride
  useEffect(() => {
    if (!rideId) return;
    const joinsRef = collection(db, 'rides', rideId, 'joins');
    const unsub = onSnapshot(joinsRef, async (snapshot) => {
      const list = [];
      for (const joinDoc of snapshot.docs) {
        const data = joinDoc.data() || {};
        let name = data.riderEmail || joinDoc.id;
        try {
          const userSnap = await getDoc(doc(db, 'users', joinDoc.id));
          if (userSnap.exists()) {
            name = userSnap.data().name || name;
          }
        } catch (e) {}
        list.push({ id: joinDoc.id, name });
      }
      setRiders(list);
    });
    return () => unsub();
  }, [rideId]);

  useEffect(() => {
    const startedAt = activeRide?.startedAt;
    if (!startedAt) return;

    // Immediately compute elapsed so there's no flicker
    setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeRide?.startedAt]);

  const formatElapsed = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEndRide = () => {
    Alert.alert(
      'End Ride',
      'Are you sure you want to end this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Ride',
          style: 'destructive',
          onPress: async () => {
            setIsEnding(true);
            try {
              if (rideId) {
                const rideRef = doc(db, 'rides', rideId);
                await updateDoc(rideRef, {
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                });
              }
              clearActiveRide();
              router.back();
            } catch (error) {
              console.error('Error ending ride:', error);
              Alert.alert('Error', 'Failed to end ride. Please try again.');
            } finally {
              setIsEnding(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top status bar */}
      <View style={styles.statusBar}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>RIDE IN PROGRESS</Text>
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 20 : 16 }}
      >
        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>Elapsed Time</Text>
          <Text style={styles.timerValue}>{formatElapsed(elapsedSeconds)}</Text>
        </View>

        {/* Route info card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeIconColumn}>
              <View style={styles.fromDot} />
              <View style={styles.routeLine} />
              <Ionicons name="location" size={20} color={colors.accent} />
            </View>
            <View style={styles.routeTextColumn}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>FROM</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {fromAddress || 'Unknown pickup'}
                </Text>
              </View>
              <View style={styles.routeSpacer} />
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>TO</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {toAddress || 'Unknown destination'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Scheduled: {formatTime(rideDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Driver: {ownerName || 'You'}
            </Text>
          </View>
        </View>

        {/* PIN Verification */}
        <View style={styles.pinCard}>
          <View style={styles.pinCardHeader}>
            <Ionicons name="key-outline" size={22} color={colors.secondary} />
            <Text style={styles.pinCardTitle}>Verify Riders</Text>
          </View>
          <Text style={styles.pinCardSubtext}>
            Ask each rider for their 4-digit PIN to confirm identity.
          </Text>

          {riders.length === 0 && (
            <Text style={styles.pinCardSubtext}>No riders have joined yet.</Text>
          )}

          {riders.map((rider) => (
            <View key={rider.id} style={styles.pinRow}>
              <View style={styles.pinRowLeft}>
                <Ionicons name="person-circle-outline" size={24} color="rgba(255,255,255,0.5)" />
                <Text style={styles.pinRowName}>{rider.name}</Text>
              </View>
              <View style={styles.pinRowRight}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="PIN"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={pinInputs[rider.id] || ''}
                  onChangeText={(t) => setPinInputs((p) => ({ ...p, [rider.id]: t }))}
                />
                <TouchableOpacity style={styles.pinVerifyBtn}>
                  <Text style={styles.pinVerifyText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Drive safely card */}
        <View style={styles.placeholderCard}>
          <Ionicons name="car-sport-outline" size={40} color={colors.accent} />
          <Text style={styles.placeholderTitle}>Drive safely!</Text>
          <Text style={styles.placeholderSubtext}>
            Your riders have been notified that the ride has started.
          </Text>
        </View>

        {/* End Ride button */}
        <View style={styles.endRideSection}>
          <TouchableOpacity
            style={[styles.endRideButton, isEnding && styles.buttonDisabled]}
            onPress={handleEndRide}
            disabled={isEnding}
          >
            {isEnding ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="stop-circle" size={22} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.endRideText}>End Ride</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  statusBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  liveText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  timerLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timerValue: {
    color: colors.secondary,
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  routeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  routeRow: {
    flexDirection: 'row',
  },
  routeIconColumn: {
    alignItems: 'center',
    marginRight: 14,
    paddingTop: 4,
  },
  fromDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  routeTextColumn: {
    flex: 1,
  },
  routeItem: {
    marginBottom: 4,
  },
  routeSpacer: {
    height: 16,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    color: colors.white,
    fontSize: 15,
    marginLeft: 10,
  },
  placeholderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // PIN card styles
  pinCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pinCardTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  pinCardSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginBottom: 16,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pinRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pinRowName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  pinRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pinVerifyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pinVerifyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  endRideSection: {
    marginTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  endRideButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  endRideText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
