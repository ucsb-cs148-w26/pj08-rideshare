import React, { useEffect, useState } from 'react';
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';
import NavBar from '../../../app/components/nav-bar';

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

  if (isHosted) {
    return (
      <FlatList
        data={rides}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <View style={styles.rideRow}>
            <Text style={styles.rideTitle}>
              {`${item.fromAddress} → ${item.toAddress}`}
            </Text>
            {item.rideDate && (
              <Text style={styles.rideSubtitle}>{formatDateTime(item.rideDate)}</Text>
            )}
          </View>
        )}
      />
    );
  }

  // For joined rides, show cards with WHEN/TO and view details button
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
              <Text style={styles.joinedCardLabel}>WHEN:</Text>
              <Text style={styles.joinedCardDate}>{formatDate(item.rideDate)}</Text>
              <Text style={styles.joinedCardTime}>{formatTime(item.rideDate)}</Text>
            </View>
            <View style={styles.joinedCardRight}>
              <Text style={styles.joinedCardLabel}>TO:</Text>
              <Text style={styles.joinedCardDestination} numberOfLines={2}>
                {item.fromAddress} → {item.toAddress}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.joinedViewDetailsButton}
            onPress={() => onViewDetails && onViewDetails(item)}
          >
            <Text style={styles.joinedViewDetailsText}>View Details</Text>
          </TouchableOpacity>
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

export default function Homepage({ user }) {
  const [hostedRides, setHostedRides] = useState([]);
  const [joinedRides, setJoinedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [driverVehicle, setDriverVehicle] = useState(null);

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
      const rides = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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

  return (
    <View style={commonStyles.container}>
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

                  // Fetch driver's vehicle information from users/{ownerId}.
                  // The DB stores vehicles as a field (e.g. `vehicles` array) on the user doc,
                  // not as a subcollection. Read the doc and normalize the first vehicle.
                  try {
                    const driverRef = doc(db, 'users', ride.ownerId);
                    const driverSnap = await getDoc(driverRef);
                    if (driverSnap.exists()) {
                      const driverData = driverSnap.data() || {};

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
                />
              )}
            </View>

            <TouchableOpacity 
              style={[
                commonStyles.primaryButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() => router.push("/(tabs)/home/hostpage")}
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
                    <Text style={styles.modalDriverIconText}>👤</Text>
                  </View>
                  <Text style={styles.modalDriverTitle}>{selectedRide.ownerName}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoRow}> 
                    <Text style={styles.modalInfoLabel}>Email:</Text>
                    <Text style={styles.modalInfoValue}>{selectedRide.ownerEmail}</Text>
                  </View>

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
                    <Text style={styles.modalInfoLabel}>Price:</Text>
                    <Text style={styles.modalInfoValue}>${selectedRide.price}</Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Seats Available:</Text>
                    <Text style={styles.modalInfoValue}>{selectedRide.seats}</Text>
                  </View>
                </View>

                {driverVehicle && (
                  <View style={styles.modalVehicleSection}>
                    <Text style={styles.modalVehicleSectionTitle}>Vehicle Information</Text>
                    <View style={styles.modalInfo}>
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
                  </View>
                )}

                {selectedRide.tag && (
                  <View style={styles.modalTagRow}>
                    <Text style={styles.modalInfoLabel}>Tag:</Text>
                    <View style={styles.modalTagContent}>
                      <View style={[styles.modalTagBox, { backgroundColor: tagColors[selectedRide.tag] || '#9ca3af' }]} />
                      <Text style={styles.modalTagText}>{selectedRide.tag}</Text>
                    </View>
                  </View>
                )}

                {selectedRide.notes && (
                  <>
                    <Text style={styles.modalNotesTitle}>Notes:</Text>
                    <View style={styles.modalNotes}>
                      <Text style={styles.modalNotesText}>{selectedRide.notes}</Text>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <NavBar />
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
    marginLeft: 16,
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
  modalInfo: {
    marginBottom: 20,
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
    width: 80,
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
  modalTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  modalTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTagBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 10,
  },
  modalTagText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalVehicleSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalVehicleSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
});