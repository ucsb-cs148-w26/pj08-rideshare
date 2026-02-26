import React, { useEffect, useState, useRef, useCallback } from 'react';
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, runTransaction, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';

const tagColors = {
  'Downtown': '#e11d48',
  'Groceries/Shopping': '#f97316',
  'SBA': '#efdf70',
  'LAX': '#10b981',
  'Amtrak Station': '#0ea5e9',
  'Going Home/Far': '#6366f1',
  'Other': '#ff1493',
};

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RideList({ rides, emptyText, isHosted = false, onViewDetails = null }) {
  if (!rides || rides.length === 0) {
    return (
      <View style={commonStyles.emptyState}>
        <Text style={commonStyles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  // Show cards with WHEN/TO and view details button for both hosted and joined rides
  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => String(item.id)}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      renderItem={({ item }) => (
        <View style={styles.joinedRideCard}>
          <View style={styles.joinedCardContent}>
            <View style={styles.joinedCardLeft}>
              <Text style={styles.joinedCardLabel}>When:</Text>
              <Text style={styles.joinedCardDate}>{formatDate(item.rideDate)}</Text>
              <Text style={styles.joinedCardTime}>{formatTime(item.rideDate)}</Text>
            </View>
            <View style={styles.joinedCardRight}>
              <Text style={styles.joinedCardLabel}>To:</Text>
              <Text style={styles.joinedCardDestination} numberOfLines={2}>
                {item.fromAddress} → {item.toAddress}
              </Text>
            </View>
          </View>
          {isHosted ? (
            <View style={styles.startRideRow}>
              <TouchableOpacity 
                style={[styles.joinedViewDetailsButton, { flex: 1 }]}
                onPress={() => onViewDetails && onViewDetails(item)}
              >
                <Text style={styles.joinedViewDetailsText}>View Details</Text>
              </TouchableOpacity>
              {new Date() >= new Date(item.rideDate) ? (
                <>
                  <TouchableOpacity
                    style={[styles.startRideButtonActive, { flex: 1 }]}
                    onPress={() => {}}
                  >
                    <Text style={styles.startRideTextActive}>Start Ride</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startRideInfoButton}
                    onPress={() => alert('Start Ride is now available! Tap to begin your ride.')}
                  >
                    <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.startRideButtonDisabled, { flex: 1 }]}
                    onPress={() => alert('Start Ride will be available once the scheduled ride time begins.')}
                  >
                    <Text style={styles.startRideTextDisabled}>Start Ride</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startRideInfoButton}
                    onPress={() => alert('Start Ride will be available once the scheduled ride time begins.')}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#555" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.joinedViewDetailsButton}
              onPress={() => onViewDetails && onViewDetails(item)}
            >
              <Text style={styles.joinedViewDetailsText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return 'Not provided';
  const cleaned = String(phoneNumber).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phoneNumber;
}

function formatCurrency(value) {
  const num = typeof value === 'number' ? value : Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  return `$${safe.toFixed(2)}`;
}

export default function Homepage({ user }) {
  const [hostedRides, setHostedRides] = useState([]);
  const [joinedRides, setJoinedRides] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedRide, setSelectedRide] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [driverVehicle, setDriverVehicle] = useState(null);
  const [hasVehicleInfo, setHasVehicleInfo] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [leaveRideModalVisible, setLeaveRideModalVisible] = useState(false);
  const [leavingRide, setLeavingRide] = useState(false);
  const cancellationFee = selectedRide ? Number(selectedRide.price) * 0.25 : 0;
  const cancellationFeeText = formatCurrency(cancellationFee);
  const cancellationDeadline = selectedRide?.cancellationDeadline
    ? new Date(selectedRide.cancellationDeadline)
    : null;
  const isLateCancellation = Boolean(cancellationDeadline && new Date() > cancellationDeadline);
  const paymentRecipientName = driverInfo?.name || selectedRide?.ownerName || 'the driver';
  const paymentHandle = (driverInfo?.payHandle || '').trim();

  const [cancelRideModalVisible, setCancelRideModalVisible] = useState(false);
  const [cancellingRide, setCancellingRide] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [cancelNoteError, setCancelNoteError] = useState(''); 
  const reopenModalRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (reopenModalRef.current) {
        reopenModalRef.current = false;
        setDetailsModalVisible(true);
      }
    }, [])
  );

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Fetch hosted rides
    const ridesRef = collection(db, 'rides');
    const q = query(ridesRef, where('ownerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((ride) => ride.status !== 'cancelled' && ride.status !== 'canceled')
        .sort((a, b) => new Date(a.rideDate) - new Date(b.rideDate));
      setHostedRides(rides);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching hosted rides:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }

    // Fetch all rides and check which ones the user has joined
    const ridesRef = collection(db, 'rides');
    const unsubscribe = onSnapshot(ridesRef, async (snapshot) => {
      try {
        const joinedRidesData = [];

        for (const rideDoc of snapshot.docs) {
          const joinRef = doc(db, 'rides', rideDoc.id, 'joins', currentUser.uid);
          const joinSnap = await getDoc(joinRef);

          if (joinSnap.exists()) {
            joinedRidesData.push({
              id: rideDoc.id,
              ...rideDoc.data(),
            });
          }
        }

        // Sort by ride date (soonest first)
        joinedRidesData.sort((a, b) => {
          const dateA = new Date(a.rideDate || 0);
          const dateB = new Date(b.rideDate || 0);
          return dateA - dateB;
        });

        setJoinedRides(joinedRidesData);
      } catch (error) {
        console.error('Error fetching joined rides:', error);
      }
    }, (error) => {
      console.error('Error listening to rides:', error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setHasVehicleInfo(false);
      setLoadingProfile(false);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setHasVehicleInfo(false);
          setLoadingProfile(false);
          return;
        }
        const data = snapshot.data() || {};
        const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
        const primaryVehicle = vehicles[0] || {};
        const hasVehicle = Boolean(
          primaryVehicle.make &&
            primaryVehicle.make.trim() &&
            primaryVehicle.model &&
            primaryVehicle.model.trim() &&
            primaryVehicle.plate &&
            primaryVehicle.plate.trim()
        );
        setHasVehicleInfo(hasVehicle);
        setLoadingProfile(false);
      },
      (error) => {
        console.error('Error loading user profile:', error);
        setHasVehicleInfo(false);
        setLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <View style={commonStyles.container}>
      {/* Floating notifications bell */}
      <Pressable
        onPress={() => router.push("/(tabs)/home/notificationspage")}
        style={styles.bellButton}
        accessibilityLabel="Open notifications"
        hitSlop={10}
      >
        <Ionicons name="notifications-outline" size={22} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/cs148_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>UCSB Rideshare</Text>
        </View>

        <View 
          style={[
            commonStyles.contentBox,
            { flex: 1 },
          ]}
        >
          {/* Joined Rides Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Joined Rides</Text>

            <View style={styles.card}>
              <RideList
                rides={joinedRides}
                emptyText={"No joined rides yet.\nTap Join to find a ride."}
                isHosted={false}
                onViewDetails={async (ride) => {
                  setSelectedRide(ride);
                  setDetailsModalVisible(true);

                  // Fetch driver's vehicle information and profile from users/{ownerId}.
                  // The DB stores vehicles as a field (e.g. `vehicles` array) on the user doc,
                  // not as a subcollection. Read the doc and normalize the first vehicle.
                  try {
                    const driverRef = doc(db, 'users', ride.ownerId);
                    const driverSnap = await getDoc(driverRef);
                    if (driverSnap.exists()) {
                      const driverData = driverSnap.data() || {};
                      setDriverInfo(driverData);

                      // Support legacy `vehicle` field or `vehicles` array
                      let firstVehicle = null;
                      if (driverData.vehicle) {
                        firstVehicle = driverData.vehicle;
                      } else if (Array.isArray(driverData.vehicles) && driverData.vehicles.length > 0) {
                        firstVehicle = driverData.vehicles[0];
                      }

                      if (firstVehicle) {
                        const licensePlate = firstVehicle.licensePlate || firstVehicle.plate || firstVehicle.license_plate || '';
                        setDriverVehicle({
                          make: firstVehicle.make || firstVehicle.manufacturer || '',
                          model: firstVehicle.model || firstVehicle.trim || '',
                          licensePlate: licensePlate,
                        });
                      } else {
                        setDriverVehicle(null);
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching driver vehicle info:', error);
                    setDriverVehicle(null);
                  }
                }}
              />
            </View>

            <TouchableOpacity 
              style={commonStyles.primaryButton}
              onPress={() => router.push("/(tabs)/home/joinpage")}
            >
              <Text style={commonStyles.primaryButtonText}>Join</Text>
            </TouchableOpacity>
          </View>

          {/* Hosted Rides Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted Rides</Text>

            <View style={styles.card}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <RideList
                  rides={hostedRides}
                  emptyText={"No hosted rides yet.\nTap Host to create a ride."}
                  isHosted={true}
                  onViewDetails={async (ride) => {
                    setSelectedRide(ride);
                    setDetailsModalVisible(true);

                    // Fetch driver's vehicle information and profile (which is the current user's vehicle)
                    try {
                      const driverRef = doc(db, 'users', ride.ownerId);
                      const driverSnap = await getDoc(driverRef);
                      if (driverSnap.exists()) {
                        const driverData = driverSnap.data() || {};
                        setDriverInfo(driverData);

                        // Support legacy `vehicle` field or `vehicles` array
                        let firstVehicle = null;
                        if (driverData.vehicle) {
                          firstVehicle = driverData.vehicle;
                        } else if (Array.isArray(driverData.vehicles) && driverData.vehicles.length > 0) {
                          firstVehicle = driverData.vehicles[0];
                        }

                        if (firstVehicle) {
                          const licensePlate = firstVehicle.licensePlate || firstVehicle.plate || firstVehicle.license_plate || '';
                          setDriverVehicle({
                            make: firstVehicle.make || firstVehicle.manufacturer || '',
                            model: firstVehicle.model || firstVehicle.trim || '',
                            licensePlate: licensePlate,
                          });
                        } else {
                          setDriverVehicle(null);
                        }
                      }
                    } catch (error) {
                      console.error('Error fetching driver vehicle info:', error);
                      setDriverVehicle(null);
                    }
                  }}
                />
              )}
            </View>

            <TouchableOpacity 
              style={[
                commonStyles.primaryButton,
                { backgroundColor: colors.accent },
                (!hasVehicleInfo || loadingProfile) && styles.buttonDisabled,
              ]}
              onPress={() => {
                if (hasVehicleInfo) {
                  router.push("/(tabs)/home/hostpage");
                }
              }}
              disabled={!hasVehicleInfo || loadingProfile}
            >
              <Text 
                style={[
                  commonStyles.secondaryButtonText,
                  { fontSize: 18 },
                ]}
              >
                Host
              </Text>
            </TouchableOpacity>
            {!loadingProfile && !hasVehicleInfo && (
              <TouchableOpacity
                style={styles.vehicleNotice}
                onPress={() => router.push('/(tabs)/account/accountpage')}
              >
                <Text style={styles.vehicleNoticeText}>
                  Add vehicle info in your profile to host a ride.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* View Details Modal for Joined Rides */}
      <Modal
        animationType="slide"
        transparent
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedRide && (
              <ScrollView style={styles.modalScrollContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalDriverIcon}>
                    {driverInfo?.photoURL ? (
                      <Image
                        source={{ uri: driverInfo.photoURL }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                      />
                    ) : (
                      <Text style={styles.modalDriverIconText}>👤</Text>
                    )}
                  </View>
                  {selectedRide.ownerId !== auth.currentUser?.uid ? (
                    <TouchableOpacity onPress={() => {
                      setDetailsModalVisible(false);
                      reopenModalRef.current = true;
                      router.push({ pathname: '/(tabs)/account/profilepage', params: { userId: selectedRide.ownerId } });
                    }} activeOpacity={0.7}>
                      <Text style={styles.modalDriverTitle}>{selectedRide.ownerName}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.modalDriverTitle}>{selectedRide.ownerName}</Text>
                  )}
                </View>

                <Text style={styles.modalSectionTitle}>Ride Info</Text>
                <View style={styles.modalSection}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Date:</Text>
                    <Text style={styles.modalInfoValue}>{formatDate(selectedRide.rideDate)}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Time:</Text>
                    <Text style={styles.modalInfoValue}>{formatTime(selectedRide.rideDate)}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>From:</Text>
                    <Text style={styles.modalInfoValue}>{selectedRide.fromAddress}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>To:</Text>
                    <Text style={styles.modalInfoValue}>{selectedRide.toAddress}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Seats Available:</Text>
                    <Text style={styles.modalInfoValue}>
                      {Number(selectedRide.seats)} / {Number(selectedRide.total_seats ?? selectedRide.seats)}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Price:</Text>
                    <Text style={styles.modalInfoValue}>${selectedRide.price}</Text>
                  </View>
                  {selectedRide.tag && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Tag:</Text>
                      <View style={styles.modalTagContent}>
                        <View style={[styles.modalTagDot, { backgroundColor: tagColors[selectedRide.tag] || '#9ca3af' }]} />
                        <Text style={styles.modalTagText}>{selectedRide.tag}</Text>
                      </View>
                    </View>
                  )}
                  {selectedRide.cancellationDeadline && (
                    <View style={styles.cancellationBox}>
                      <Text style={styles.cancellationBoxLabel}>Cancellation Deadline</Text>
                      <Text style={styles.cancellationBoxText}>
                        {formatDate(selectedRide.cancellationDeadline)} at {formatTime(selectedRide.cancellationDeadline)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.sectionDivider} />

                <Text style={styles.modalSectionTitle}>Driver Info</Text>
                <View style={styles.modalSection}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Name:</Text>
                    <Text style={styles.modalInfoValue}>{driverInfo?.name || selectedRide.ownerName}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Pay Handle:</Text>
                    <Text style={styles.modalInfoValue}>{driverInfo?.payHandle || 'Not provided'}</Text>
                  </View>
                  {driverInfo?.role && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Role:</Text>
                      <Text style={styles.modalInfoValue}>{driverInfo.role.charAt(0).toUpperCase() + driverInfo.role.slice(1)}</Text>
                    </View>
                  )}
                  {driverInfo?.yearsAtUCSB && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Years at UCSB:</Text>
                      <Text style={styles.modalInfoValue}>{driverInfo.yearsAtUCSB}</Text>
                    </View>
                  )}
                  {driverInfo?.major && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Major:</Text>
                      <Text style={styles.modalInfoValue}>{driverInfo.major}</Text>
                    </View>
                  )}
                  {driverInfo?.clubs && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Clubs:</Text>
                      <Text style={styles.modalInfoValue}>{driverInfo.clubs}</Text>
                    </View>
                  )}
                </View>

                {selectedRide.driverNotes && (
                  <>
                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Driver Notes</Text>
                    <View style={styles.modalNotes}>
                      <Text style={styles.modalNotesText}>{selectedRide.driverNotes}</Text>
                    </View>
                  </>
                )}

                {driverVehicle && (
                  <>
                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Vehicle Information</Text>
                    <View style={styles.modalSection}>
                      {driverVehicle.make && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Make:</Text>
                          <Text style={styles.modalInfoValue}>{driverVehicle.make}</Text>
                        </View>
                      )}
                      {driverVehicle.model && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Model:</Text>
                          <Text style={styles.modalInfoValue}>{driverVehicle.model}</Text>
                        </View>
                      )}
                      {driverVehicle.licensePlate && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>License Plate:</Text>
                          <Text style={styles.modalInfoValue}>{driverVehicle.licensePlate}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* Cancellation Policy - Only show for joined rides (when user is not the owner) */}
                {selectedRide && selectedRide.ownerId !== auth.currentUser?.uid && (
                  <>
                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Cancellation Deadline</Text>

                    <Text style={styles.cancellationDeadlineText}>
                      {selectedRide.cancellationDeadline
                        ? formatDateTime(selectedRide.cancellationDeadline)
                        : 'No deadline set.'}
                    </Text>

                    <View style={styles.cancellationNotice}>
                      <Text style={styles.cancellationNoticeText}>
                        ⚠️ Warning: Leaving after the cancellation deadline incurs a fee (25% of ride price).
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.leaveRideButton}
                      onPress={() => setLeaveRideModalVisible(true)}
                    >
                      <Text style={styles.leaveRideButtonText}>
                        Leave Ride
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Driver Cancel - Only show for hosted rides (when user is the owner) */}
                {selectedRide && selectedRide.ownerId === auth.currentUser?.uid && (
                  <>
                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Driver Controls</Text>

                    <TouchableOpacity
                      style={styles.cancelRideButton}
                      onPress={() => {
                        setCancelNote('');
                        setCancelNoteError('');
                        setCancelRideModalVisible(true);
                      }}
                    >
                      <Text style={styles.cancelRideButtonText}>Cancel Ride</Text>
                    </TouchableOpacity>
                  </>
                )}

              </ScrollView>
            )}
          </View>

          {/* Leave Ride Confirmation Overlay */}
          {leaveRideModalVisible && (
            <View style={styles.confirmModalOverlay}>
              <View style={styles.confirmModalContent}>
                <Text style={styles.confirmModalTitle}>
                  {isLateCancellation ? 'Late Cancellation Notice' : 'Leave this ride?'}
                </Text>

                {isLateCancellation ? (
                  <>
                    <View style={styles.lateDeadlineBanner}>
                      <Text style={styles.lateDeadlineBannerText}>
                        You are leaving after the cancellation deadline.
                      </Text>
                    </View>

                    <Text style={styles.confirmModalMessage}>
                      <Text>
                        A cancellation fee of <Text style={{ fontWeight: 'bold' }}>{cancellationFeeText}</Text> is due (25% of the ride price).
                      </Text>
                      {'\n\n'}
                      <Text>
                        Please venmo/zelle <Text style={{ fontWeight: 'bold' }}>{paymentRecipientName}</Text>{' '}
                        {paymentHandle
                          ? (
                            <>
                              at <Text style={{ fontWeight: 'bold' }}>{paymentHandle}</Text>
                            </>
                          )
                          : ' using their listed pay handle'}{' '}
                        the cancellation fee of <Text style={{ fontWeight: 'bold' }}>{cancellationFeeText}</Text> now.
                      </Text>
                      {'\n\n'}
                      <Text style={{ fontWeight: 'bold' }}>This action cannot be undone.</Text>
                    </Text>
                  </>
                ) : (
                  <Text style={styles.confirmModalMessage}>
                    <Text style={{ fontWeight: 'bold' }}>Please review our cancellation policy:</Text>
                    {'\n\n'}
                    • Cancellations made after the deadline will incur a fee calculated at 25% of the posted price
                    {'\n\n'}
                    • If a waitlist exists for this ride, you must rejoin through the waitlist
                    {'\n\n'}
                    <Text style={{ fontWeight: 'bold' }}>This action cannot be undone.</Text>
                  </Text>
                )}
                
                <View style={styles.confirmModalButtons}>
                  <TouchableOpacity 
                    style={styles.confirmCancelButton}
                    onPress={() => setLeaveRideModalVisible(false)}
                    disabled={leavingRide}
                  >
                    <Text style={styles.confirmCancelButtonText}>Go Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmLeaveButton, leavingRide && styles.buttonDisabled]}
                    onPress={async () => {
                      if (!selectedRide || leavingRide) return;
                      
                      setLeavingRide(true);
                      try {
                        const currentUser = auth.currentUser;
                        if (!currentUser) return;

                        const rideRef = doc(db, 'rides', selectedRide.id);
                        const joinRef = doc(db, 'rides', selectedRide.id, 'joins', currentUser.uid);

                        await runTransaction(db, async (tx) => {
                          const [rideSnap, joinSnap] = await Promise.all([
                            tx.get(rideRef),
                            tx.get(joinRef),
                          ]);

                          if (!rideSnap.exists()) throw new Error('Ride no longer exists.');
                          if (!joinSnap.exists()) throw new Error('You have not joined this ride.');

                          const rideData = rideSnap.data() || {};
                          const seatsNumRaw = Number(rideData.seats);
                          const seatsNum = Number.isFinite(seatsNumRaw) ? seatsNumRaw : 0;
                          const totalSeatsRaw = Number(rideData.total_seats ?? seatsNum);
                          const totalSeats = Number.isFinite(totalSeatsRaw) ? totalSeatsRaw : null;
                          const nextSeats = totalSeats !== null
                            ? Math.min(seatsNum + 1, totalSeats)
                            : seatsNum + 1;

                          tx.update(rideRef, {
                            seats: nextSeats,
                            total_seats: rideData.total_seats ?? seatsNum,
                          });
                          tx.delete(joinRef);
                        });
                        // Send notifications
                        try {
                          const now = new Date();
                          const deadline = selectedRide.cancellationDeadline
                            ? new Date(selectedRide.cancellationDeadline)
                            : null;
                          const isAfterDeadline = deadline && now > deadline;

                          let riderName = currentUser?.email || "A rider";
                          try {
                            const userSnap = await getDoc(doc(db, "users", currentUser.uid));
                            if (userSnap.exists()) {
                              riderName = userSnap.data().name || riderName;
                            }
                          } catch (e) {}

                          if (isAfterDeadline) {
                            // CASE 1: After deadline → driver only
                            await addDoc(collection(db, "notifications"), {
                              userId: selectedRide.ownerId,
                              type: "late_cancellation",
                              title: "Late Cancellation Notice",
                              body: `${riderName} left your ride after the cancellation deadline.`,

                              driverId: selectedRide.ownerId,
                              rideId: selectedRide.id,
                              fromAddress: selectedRide.fromAddress,
                              toAddress: selectedRide.toAddress,

                              createdAt: serverTimestamp(),
                              readAt: null,
                            });
                          } else {
                            // CASE 2: Before deadline → driver + all remaining riders
                            const joinsSnap = await getDocs(
                              collection(db, "rides", selectedRide.id, "joins")
                            );
                            const notifyIds = new Set([selectedRide.ownerId]);
                            joinsSnap.forEach((d) => {
                              const rid = d.data().riderId || d.id;
                              if (rid !== currentUser.uid) notifyIds.add(rid);
                            });

                            const notifBatch = writeBatch(db);
                            notifyIds.forEach((uid) => {
                              const notifRef = doc(collection(db, "notifications"));
                              notifBatch.set(notifRef, {
                                userId: uid,
                                type: "ride_left",
                                title: "Updates to Your Ride",
                                body: "A rider has left the ride.",

                                driverId: selectedRide.ownerId,
                                rideId: selectedRide.id,
                                fromAddress: selectedRide.fromAddress,
                                toAddress: selectedRide.toAddress,

                                createdAt: serverTimestamp(),
                                readAt: null,
                              });
                            });
                            await notifBatch.commit();
                          }
                        } catch (notifError) {
                          console.warn("Failed to send notification:", notifError);
                        }
                        // Close both modals
                        setLeaveRideModalVisible(false);
                        setDetailsModalVisible(false);
                        
                        // Reset states
                        setSelectedRide(null);
                        setDriverInfo(null);
                        setDriverVehicle(null);
                      } catch (error) {
                        const message = String(error?.message || '').toLowerCase();
                        const isAlreadyLeft = message.includes('not joined');
                        const isRideGone = message.includes('no longer exists');

                        if (isAlreadyLeft || isRideGone) {
                          setLeaveRideModalVisible(false);
                          setDetailsModalVisible(false);
                          setSelectedRide(null);
                          setDriverInfo(null);
                          setDriverVehicle(null);
                          alert('You are no longer in this ride.');
                        } else {
                          console.error('Error leaving ride:', error);
                          alert('Failed to leave ride. Please try again.');
                        }
                      } finally {
                        setLeavingRide(false);
                      }
                    }}
                    disabled={leavingRide}
                  >
                    {leavingRide ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.confirmLeaveButtonText}>Leave Ride</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Cancel Ride Confirmation Overlay (Driver) */}
          {cancelRideModalVisible && (
            <Pressable
              style={styles.confirmModalOverlay}
              onPress={Keyboard.dismiss}
            >
              <KeyboardAvoidingView
                style={{ width: '100%', alignItems: 'center' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
              >
                {/* prevent taps inside the card from dismissing by accident */}
                <Pressable onPress={() => {}} style={styles.confirmModalContent}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 12 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.confirmModalTitle}>Cancel this ride?</Text>

                    <Text style={styles.confirmModalMessage}>
                      Please provide a cancellation note (required). Riders will see this note.
                    </Text>

                    <TextInput
                      style={styles.cancelNoteInput}
                      value={cancelNote}
                      onChangeText={(t) => {
                        setCancelNote(t);
                        if (cancelNoteError) setCancelNoteError('');
                      }}
                      placeholder="E.g., Car trouble / emergency / schedule conflict..."
                      multiline
                      editable={!cancellingRide}
                      returnKeyType="done"
                      submitBehavior="blurAndSubmit"
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {!!cancelNoteError && (
                      <Text style={styles.cancelNoteErrorText}>{cancelNoteError}</Text>
                    )}

                    <View style={styles.confirmModalButtons}>
                      <TouchableOpacity
                        style={styles.confirmCancelButton}
                        onPress={() => setCancelRideModalVisible(false)}
                        disabled={cancellingRide}
                      >
                        <Text style={styles.confirmCancelButtonText}>Go Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.confirmLeaveButton, cancellingRide && styles.buttonDisabled]}
                        disabled={cancellingRide}
                        onPress={async () => {
                          const trimmed = cancelNote.trim();
                          if (!trimmed) {
                            setCancelNoteError('Cancellation note is required.');
                            return;
                          }
                          if (!selectedRide) return;

                          setCancellingRide(true);
                          try {
                            const currentUser = auth.currentUser;
                            if (!currentUser) return;

                            // collect all refs/docs associated with the ride
                            const rideRef = doc(db, 'rides', selectedRide.id);
                            const joinsSnapshot = await getDocs(collection(db, 'rides', selectedRide.id, 'joins'));                            
                            const joinRefs = joinsSnapshot.docs.map((d) => d.ref);
                            const riderUids = joinsSnapshot.docs.map((d) => d.id);

                            // auth check + soft-delete ride
                            await runTransaction(db, async (tx) => {
                              const rideSnap = await tx.get(rideRef);
                              if (!rideSnap.exists()) throw new Error('Ride no longer exists.');
                              if (rideSnap.data().ownerId !== currentUser.uid) throw new Error('Not authorized.');
                              
                              tx.update(rideRef, {
                                status: 'cancelled',
                                cancelNote: trimmed,
                                cancelledAt: new Date().toISOString(),
                                cancelledBy: currentUser.uid,
                              });
                            });

                            // Create notifications for all riders
                            if (riderUids.length > 0) {
                              const notifBatch = writeBatch(db);

                              riderUids.forEach((riderUid) => {
                                const notifRef = doc(collection(db, "notifications")); // auto-id

                                notifBatch.set(notifRef, {
                                  userId: riderUid,
                                  type: "ride_cancelled",
                                  title: `Ride Cancellation Notice`,
                                  body: trimmed,            // cancellation note

                                  driverId: selectedRide.ownerId,
                                  rideId: selectedRide.id,
                                  fromAddress: selectedRide.fromAddress,
                                  toAddress: selectedRide.toAddress,

                                  createdAt: serverTimestamp(),
                                  readAt: null,

                                  // optional, not needed now but might be useful later
                                  cancelledBy: currentUser.uid,
                                  cancelledAt: serverTimestamp(),
                                });
                              });

                              await notifBatch.commit();
                            }

                            // delete join docs
                            const batchSize = 450;
                            for (let i = 0; i < joinRefs.length; i += batchSize) {
                              const batch = writeBatch(db);
                              joinRefs.slice(i, i + batchSize).forEach((ref) => batch.delete(ref));
                              await batch.commit();
                            }

                            // mark conversation associated with deleted ride as "cancelled"
                            const conversationRef = doc(db, 'conversations', selectedRide.id);
                            try {
                              await updateDoc(conversationRef, { cancelled: true });
                            } catch (convoError) {
                              console.warn('Could not mark conversation as cancelled:', convoError);
                            }

                            setCancelRideModalVisible(false);
                            setDetailsModalVisible(false);
                            setSelectedRide(null);
                            setDriverInfo(null);
                            setDriverVehicle(null);
                          } catch (e) {
                            console.error('Error cancelling ride:', e);
                            alert('Failed to cancel ride. Please try again.');
                          } finally {
                            setCancellingRide(false);
                          }
                        }}
                      >
                        {cancellingRide ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Text style={styles.confirmLeaveButtonText}>Cancel Ride</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </Pressable>
              </KeyboardAvoidingView>
            </Pressable>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 70,
  },  
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.accent,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 10,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  rideRow: {
    paddingVertical: 10,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rideSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  vehicleNotice: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  vehicleNoticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  // Joined ride card styles
  joinedRideCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  joinedCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  joinedCardLeft: {
    flex: 1,
  },
  joinedCardRight: {
    flex: 1,
    marginLeft: -32,
  },
  joinedCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  joinedCardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  joinedCardTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  joinedCardDestination: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  joinedViewDetailsButton: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  joinedViewDetailsText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  startRideButtonDisabled: {
    backgroundColor: '#d4d4d4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbb',
    alignItems: 'center',
    opacity: 0.6,
  },
  startRideTextDisabled: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  startRideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  startRideInfoButton: {
    padding: 4,
  },
  startRideButtonActive: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  startRideTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 1,
    width: '88%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalScrollContent: {
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  modalDriverIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 10,
  },
  modalDriverIconText: {
    fontSize: 30,
  },
  modalDriverTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 20,
  },
  modalSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  modalInfoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 120,
  },
  modalInfoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  modalNotesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  modalNotes: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 15,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalNotesText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  modalTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  modalTagText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  cancellationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancellationBoxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancellationBoxText: {
    fontSize: 14,
    color: '#7f1d1d',
    fontWeight: '600',
  },
  cancellationDeadlineText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
    marginTop: 8,
  },
  cancellationNotice: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancellationNoticeText: {
    color: '#991b1b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cancellationDatePlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  leaveRideButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 6,
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  leaveRideButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Confirmation modal styles
  confirmModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  confirmModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.border,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'left',
    lineHeight: 22,
  },
  lateDeadlineBanner: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  lateDeadlineBannerText: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    color: '#991b1b',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  confirmCancelButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmLeaveButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  confirmLeaveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelRideButton: {
  backgroundColor: '#ef4444',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
  marginTop: 6,
  alignItems: 'center',
  alignSelf: 'center',
  borderWidth: 2,
  borderColor: '#dc2626',
  },
  cancelRideButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelNoteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 10,
  },
  cancelNoteErrorText: {
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 12,
  },
  bellButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 22,
    right: 16,
    zIndex: 2000,

    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,
    
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});