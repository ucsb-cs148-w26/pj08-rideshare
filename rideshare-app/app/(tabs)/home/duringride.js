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
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../ui/styles/colors';
import { doc, getDoc, updateDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, functions } from '../../../src/firebase';
import { httpsCallable } from 'firebase/functions';
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
  const [noShowRiders, setNoShowRiders] = useState({});
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('completed');
  const [noShowModalVisible, setNoShowModalVisible] = useState(false);
  const [selectedRiderForNoShow, setSelectedRiderForNoShow] = useState(null);

  const END_STATUS_OPTIONS = [
    { key: 'completed', label: 'Completed',  icon: 'checkmark-circle', color: '#22c55e' },
    { key: 'cancelled', label: 'Cancelled',   icon: 'close-circle',     color: '#ef4444' },
  ];

  const [verifyingPins, setVerifyingPins] = useState({}); // Tracks loading state (when verifying pin)
  const [verifiedRiders, setVerifiedRiders] = useState({}); // Tracks success state (after verified pin)

  // Fetch riders who joined this ride
  useEffect(() => {
    if (!rideId) return;
    const joinsRef = collection(db, 'rides', rideId, 'joins');
    const unsub = onSnapshot(joinsRef, async (snapshot) => {
      const list = [];
      const noShowMap = {};
      for (const joinDoc of snapshot.docs) {
        const data = joinDoc.data() || {};
        let name = data.riderEmail || joinDoc.id;
        try {
          const userSnap = await getDoc(doc(db, 'users', joinDoc.id));
          if (userSnap.exists()) {
            name = userSnap.data().name || name;
          }
        } catch (e) {}

        list.push({ 
          id: joinDoc.id, 
          name: name,
          status: data.status
        });
        
        // Track no show status
        if (data.no_show) {
          noShowMap[joinDoc.id] = true;
        }
      }
      setRiders(list);
      setNoShowRiders(noShowMap);
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
    // Check if all riders are either verified or marked no-show
    const processedCount = riders.filter(
      (rider) => verifiedRiders[rider.id] || rider.status === 'verified' || noShowRiders[rider.id]
    ).length;
    const totalRiders = riders.length;

    if (processedCount < totalRiders) {
      const remaining = totalRiders - processedCount;
      Alert.alert(
        'Cannot End Ride',
        `You must verify or mark all riders as no-show before ending the ride. ${remaining} rider${remaining > 1 ? 's' : ''} still need to be processed.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'End Ride',
      'Are you sure you want to end this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Ride',
          style: 'destructive',
          onPress: () => {
            setSelectedStatus('completed');
            setEndModalVisible(true);
          },
        },
      ]
    );
  };

  const handleMarkNoShow = async (riderId) => {
    try {
      const joinRef = doc(db, 'rides', rideId, 'joins', riderId);
      await updateDoc(joinRef, {
        no_show: true,
        markedNoShowAt: new Date().toISOString(),
      });
      setNoShowModalVisible(false);
      setSelectedRiderForNoShow(null);
      Alert.alert('Marked as No Show', 'This rider has been marked as a no-show.');
    } catch (error) {
      console.error('Error marking no show:', error);
      Alert.alert('Error', 'Failed to mark rider as no show.');
    }
  };

  const openNoShowConfirm = (rider) => {
    setSelectedRiderForNoShow(rider);
    setNoShowModalVisible(true);
  };

  const closeNoShowConfirm = () => {
    setNoShowModalVisible(false);
    setSelectedRiderForNoShow(null);
  };

  const handleConfirmEnd = async () => {
    setIsEnding(true);
    try {
      if (rideId) {
        const rideRef = doc(db, 'rides', rideId);
        await updateDoc(rideRef, {
          status: selectedStatus,
          completedAt: new Date().toISOString(),
        });

        // Delete the group chat conversation
        try {
          const conversationRef = doc(db, 'conversations', rideId);
          await deleteDoc(conversationRef);
          console.log('Group chat deleted for ride:', rideId);
        } catch (chatError) {
          console.warn('Error deleting conversation:', chatError);
          // Continue even if chat deletion fails
        }
      }
      setEndModalVisible(false);
      clearActiveRide();
      router.push('/(tabs)/history');
    } catch (error) {
      console.error('Error ending ride:', error);
      Alert.alert('Error', 'Failed to end ride. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  const handleVerifyPin = async (riderId) => {
    const enteredPin = pinInputs[riderId];

    if (!enteredPin || enteredPin.length !== 4) {
      Alert.alert("Invalid Entry", "Please enter a 4-digit PIN.");
      return;
    }

    // loading spinner for this specific rider
    setVerifyingPins((prev) => ({ ...prev, [riderId]: true }));

    try {
      const verifyPinFunction = httpsCallable(functions, 'verifyRiderPin');

      const result = await verifyPinFunction({
        rideId: rideId, 
        riderId: riderId, 
        pin: enteredPin 
      });

      if (result.data.verified) {
        setVerifiedRiders((prev) => ({ ...prev, [riderId]: true }));
      } else {
        Alert.alert("Verification Failed", "The PIN is incorrect. Please try again.");
      }
      
    } catch (error) {
      console.error("Error verifying PIN:", error);
      Alert.alert("Error", "Could not reach the verification server.");
    } finally {
      // stop loading spinner regardless of success or failure
      setVerifyingPins((prev) => ({ ...prev, [riderId]: false }));
    }
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
              <View style={styles.pinRowTop}>
                <Ionicons name="person-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                <Text style={[styles.pinRowName, noShowRiders[rider.id] && styles.noShowText]}>
                  {rider.name} {noShowRiders[rider.id] ? '(No Show)' : ''}
                </Text>
              </View>

              <View style={styles.pinRowBottom}>
                {/*Verification UI logic*/}
                {verifiedRiders[rider.id] || rider.status === 'verified' ? (

                  // User is verified
                  <View style={[styles.pinInput, styles.verifiedBadge]}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>

                ) : (
                  // Verification is pending
                  <>
                    <TextInput
                      style={styles.pinInput}
                      placeholder="PIN"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={pinInputs[rider.id] || ''}
                      onChangeText={(t) => setPinInputs((p) => ({ ...p, [rider.id]: t }))}
                      editable={!verifyingPins[rider.id]} // Disable input while loading
                    />
                    <TouchableOpacity 
                      style={styles.pinVerifyBtn}
                      onPress={() => handleVerifyPin(rider.id)}
                      disabled={verifyingPins[rider.id]}
                    >
                      {verifyingPins[rider.id] ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.pinVerifyText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/*No Show UI logic*/}
                {!(verifiedRiders[rider.id] || rider.status === 'verified') && (
                  <TouchableOpacity 
                    style={[
                      styles.noShowBtn, 
                      noShowRiders[rider.id] && styles.noShowBtnDisabled
                    ]}
                    onPress={() => openNoShowConfirm(rider)}
                    disabled={noShowRiders[rider.id]}
                  >
                    <Text style={styles.noShowBtnText}>No Show</Text>
                  </TouchableOpacity>
                )}
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

      {/* ── End Ride Modal ────────────────────────────────── */}
      <Modal
        visible={endModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEndModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEndModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>End Ride</Text>
              <TouchableOpacity onPress={() => setEndModalVisible(false)}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* status picker */}
            <Text style={styles.modalSectionLabel}>How did this ride end?</Text>
            <View style={styles.statusPicker}>
              {END_STATUS_OPTIONS.map((opt) => {
                const active = selectedStatus === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.statusOption,
                      active && { borderColor: opt.color, backgroundColor: opt.color + '15' },
                    ]}
                    onPress={() => setSelectedStatus(opt.key)}
                  >
                    <Ionicons name={opt.icon} size={24} color={active ? opt.color : '#C7C7CC'} />
                    <Text
                      style={[
                        styles.statusOptionText,
                        active && { color: opt.color, fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* confirm button */}
            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                isEnding && styles.buttonDisabled,
              ]}
              onPress={handleConfirmEnd}
              disabled={isEnding}
            >
              {isEnding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmText}>Finish & End Ride</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* No Show Confirmation Modal */}
      <Modal
        visible={noShowModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeNoShowConfirm}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={closeNoShowConfirm}
        >
          <Pressable style={styles.confirmModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="alert-circle" size={48} color="#f59e0b" />
              <Text style={styles.confirmModalTitle}>Mark as No Show?</Text>
            </View>

            {selectedRiderForNoShow && (
              <Text style={styles.confirmModalMessage}>
                Are you sure you want to mark <Text style={styles.confirmModalRiderName}>{selectedRiderForNoShow.name}</Text> as a no-show? This action cannot be undone.
              </Text>
            )}

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmModalCancelBtn}
                onPress={closeNoShowConfirm}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmModalConfirmBtn}
                onPress={() => selectedRiderForNoShow && handleMarkNoShow(selectedRiderForNoShow.id)}
              >
                <Text style={styles.confirmModalConfirmText}>Mark No Show</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pinRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 6,
  },
  pinRowName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  pinRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pinVerifyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  pinVerifyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  noShowBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  noShowBtnDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  noShowBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  noShowText: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)', 
  },
  verifiedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
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

  /* end-ride modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '88%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  modalSectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  statusPicker: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    gap: 6,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* no-show confirmation modal */
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    padding: 24,
    alignItems: 'center',
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  confirmModalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalRiderName: {
    fontWeight: '700',
    color: colors.primary,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  confirmModalCancelText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
