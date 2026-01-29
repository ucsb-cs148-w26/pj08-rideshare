import React, { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { collection, query, getDocs, orderBy, doc, getDoc, onSnapshot,runTransaction, serverTimestamp, setDoc, } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import { useAuth } from '../../../src/auth/AuthProvider';
import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';

export default function JoinPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmRide, setConfirmRide] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();



useEffect(() => {
  setLoading(true);

  const ridesQuery = query(collection(db, "rides"), orderBy("createdAt", "desc"));

  const unsub = onSnapshot(
    ridesQuery,
    (snapshot) => {
      const ridesData = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            ownerName: (data.ownerName ?? "Unknown Driver").toString(),
          };
        })
        .filter((ride) => ride.ownerId !== user?.uid);

      setRides(ridesData);
      setLoading(false);
    },
    (error) => {
      console.error("onSnapshot error:", error);
      setLoading(false);
    }
  );

  return () => unsub();
}, [user?.uid]);


  const fetchRides = async () => {
    try {
      setLoading(true);
      const ridesQuery = query(
        collection(db, 'rides'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(ridesQuery);
      const ridesData = [];
      

      for (const rideDoc of querySnapshot.docs) {
      const ride = { id: rideDoc.id, ...rideDoc.data() };

  if (ride.ownerId !== user?.uid) {
    ridesData.push({
      ...ride,
      ownerName: ride.ownerName || "Unknown Driver", // use saved name if present
    });
  }
}

      
      setRides(ridesData);
    } catch (error) {
      console.error('Error fetching rides:', error);
      Alert.alert('Error', 'Failed to load available rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleRidePress = (ride) => {
    setSelectedRide(ride);
    setModalVisible(true);
  };

  const openJoinConfirm = (ride) => {
  setConfirmRide(ride);
  setConfirmVisible(true);
};

const closeJoinConfirm = () => {
  setConfirmVisible(false);
  setConfirmRide(null);
};

const toNumber = (v) => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};


const handleConfirmJoin = async () => {
  if (!confirmRide) return;
  if (!user?.uid) {
    Alert.alert("Not signed in", "Please sign in to join a ride.");
    return;
  }

  try {
    setIsJoining(true);

    const rideRef = doc(db, "rides", confirmRide.id);
    const joinRef = doc(db, "rides", confirmRide.id, "joins", user.uid);

    await runTransaction(db, async (tx) => {
      const [rideSnap, joinSnap] = await Promise.all([
        tx.get(rideRef),
        tx.get(joinRef),
      ]);

      if (!rideSnap.exists()) throw new Error("This ride no longer exists.");
      if (joinSnap.exists()) throw new Error("You already joined this ride.");

      const rideData = rideSnap.data();
      const seatsNum = Number(rideData.seats);

      if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
        throw new Error("No seats left for this ride.");
      }

      tx.update(rideRef, { seats: seatsNum - 1 });
      tx.set(joinRef, {
        riderId: user.uid,
        riderEmail: user.email ?? "",
        joinedAt: serverTimestamp(),
        pricePaid: Number(rideData.price) || 0,
      });
    });

    closeJoinConfirm();

    // 👇 go to landing/home page
    router.replace("/(tabs)/home");

  } catch (e) {
    console.error("join error:", e);
    Alert.alert("Error", e?.message ?? "Could not join ride.");
  } finally {
    setIsJoining(false);
  }
};



  const renderRideCard = ({ item }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
    >
        <View style={styles.cardTopRow}>
        <View style={styles.driverNameSection}>
          <View style={styles.driverIcon}>
            <Text style={styles.driverIconText}>👤</Text>
          </View>
          <Text style={styles.driverName}>{item.ownerName}</Text>
        </View>
        <Text style={styles.ridePrice}>${item.price}</Text>
      </View>
            {/* Main content row */}
      <View style={styles.cardMainRow}>
        {/* Left side: When and Cap */}
        <View style={styles.leftInfo}>
          <View style={styles.whenSection}>
            <Text style={styles.label}>WHEN:</Text>
            <Text style={styles.dateText}>{formatDate(item.rideDate)}</Text>
            <Text style={styles.timeText}>{formatTime(item.rideDate)}</Text>
          </View>
          <Text style={styles.capacityText}>CAP: {Number(item.seats)} seats</Text>
        </View>

        {/* Right side: To and From */}
        <View style={styles.rightInfo}>
          <View style={styles.destinationRow}>
            <Text style={styles.destinationLabel}>TO:</Text>
            <Text style={styles.destinationValue}>{item.toAddress}</Text>
          </View>
          <View style={styles.destinationRow}>
            <Text style={styles.destinationLabel}>FROM:</Text>
            <Text style={styles.destinationValue}>{item.fromAddress}</Text>
          </View>
        </View>
      </View>

      {/* Bottom row: more info and JOIN button */}
      <View style={styles.cardBottomRow}>
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => handleRidePress(item)}
        >
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinButton} onPress={() => openJoinConfirm(item)}>
          <Text style={styles.joinButtonText}>JOIN</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No available rides at the moment</Text>
      <Text style={styles.emptyStateSubtext}>Check back later or host a ride!</Text>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AVAILABLE RIDES</Text>
      </View>

      {/* Search Bar (Placeholder) */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Location"
          placeholderTextColor={colors.textSecondary}
          editable={false}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filter Button (Placeholder) */}
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>FILTER ▾</Text>
      </TouchableOpacity>

      {/* Rides List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Loading available rides...</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshing={loading}
          onRefresh={fetchRides}
        />
      )}


  <Modal
  animationType="fade"
  transparent={true}
  visible={confirmVisible}
  onRequestClose={closeJoinConfirm}
>
  <View style={styles.modalOverlay}>
    <View style={styles.confirmCard}>
      <Text style={styles.confirmTitle}>Confirm your ride</Text>

      {confirmRide && (
        <>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Driver</Text>
            <Text style={styles.confirmValue}>{confirmRide.ownerName}</Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>When</Text>
            <Text style={styles.confirmValue}>
              {formatDate(confirmRide.rideDate)} • {formatTime(confirmRide.rideDate)}
            </Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>From</Text>
            <Text style={styles.confirmValue} numberOfLines={2}>
              {confirmRide.fromAddress}
            </Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>To</Text>
            <Text style={styles.confirmValue} numberOfLines={2}>
              {confirmRide.toAddress}
            </Text>
          </View>

          <View style={styles.confirmDivider} />

          {/* Payment summary */}
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Ride price</Text>
            <Text style={styles.confirmValue}>${toNumber(confirmRide.price).toFixed(2)}</Text>
          </View>

          {/* If you want a fee line, uncomment:
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Service fee</Text>
            <Text style={styles.confirmValue}>$0.00</Text>
          </View>
          */}

          <View style={styles.confirmRow}>
            <Text style={styles.confirmTotalLabel}>Total</Text>
            <Text style={styles.confirmTotalValue}>
              ${toNumber(confirmRide.price).toFixed(2)}
            </Text>
          </View>

          <Text style={styles.confirmTinyNote}>
            By confirming, you agree to pay the total amount shown.
          </Text>
        </>
      )}

      <View style={styles.confirmActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={closeJoinConfirm} disabled={isJoining}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payBtn, isJoining && { opacity: 0.7 }]}
          onPress={handleConfirmJoin}
          disabled={isJoining}
          >
            <Text style={styles.payBtnText}>
              {isJoining ? "Confirming..." : "Confirm & Pay"}
            </Text>
          </TouchableOpacity>
            </View>
          </View>
      </View>
    </Modal>



      {/* Modal for Ride Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedRide && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalDriverIcon}>
                    <Text style={styles.modalDriverIconText}>👤</Text>
                  </View>
                  <Text style={styles.modalDriverTitle}>{selectedRide.ownerName}</Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoText}>
                    Email: {selectedRide.ownerEmail}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Date: {formatDate(selectedRide.rideDate)}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Time: {formatTime(selectedRide.rideDate)}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    From: {selectedRide.fromAddress}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    To: {selectedRide.toAddress}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Seats Available: {selectedRide.seats}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Price: ${selectedRide.price}
                  </Text>
                </View>

                <Text style={styles.modalNotesTitle}>Notes:</Text>
                <View style={styles.modalNotes}>
                  <Text style={styles.modalNotesPlaceholder}>
                    (Driver notes will be displayed here)
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-end',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  listContainer: {
    padding: 20,
    paddingTop: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.white,
  },
  rideCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  driverIconText: {
    fontSize: 22,
  },
  rideInfo: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
   ridePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  leftInfo: {
    flex: 1,
  },
  whenSection: {
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
   dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  capacityText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  rightInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  destinationRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  destinationLabel: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  destinationValue: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#b8baba',
  },
  viewDetailsButtonText: {
    color: '#b8baba',
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 10,
  },
  joinButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 35,
    borderRadius: 6,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
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
    width: '85%',
    maxHeight: '70%',
    borderWidth: 2,
    borderColor: colors.text,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.text,
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
    backgroundColor: colors.backgroundLight,
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
    color: colors.text,
  },
  modalInfo: {
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  modalNotes: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalNotesPlaceholder: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  confirmCard: {
  backgroundColor: colors.white,
  borderRadius: 14,
  padding: 18,
  width: "88%",
  borderWidth: 2,
  borderColor: colors.text,
},
confirmTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: colors.text,
  marginBottom: 12,
},
confirmRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 10,
  gap: 12,
},
confirmLabel: {
  width: 80,
  fontSize: 13,
  fontWeight: "700",
  color: colors.textSecondary,
},
confirmValue: {
  flex: 1,
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
  textAlign: "right",
},
confirmDivider: {
  height: 1,
  backgroundColor: colors.border,
  marginVertical: 10,
},
confirmTotalLabel: {
  width: 80,
  fontSize: 14,
  fontWeight: "900",
  color: colors.text,
},
confirmTotalValue: {
  flex: 1,
  fontSize: 16,
  fontWeight: "900",
  color: colors.primary,
  textAlign: "right",
},
confirmTinyNote: {
  marginTop: 6,
  fontSize: 12,
  color: colors.textSecondary,
  lineHeight: 16,
},
confirmActions: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 16,
},
cancelBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: colors.border,
  backgroundColor: colors.backgroundLight,
  marginRight: 10,
  alignItems: "center",
},
cancelBtnText: {
  fontSize: 14,
  fontWeight: "800",
  color: colors.text,
},
payBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 10,
  backgroundColor: colors.accent,
  alignItems: "center",
},
payBtnText: {
  fontSize: 14,
  fontWeight: "800",
  color: colors.white,
},

});