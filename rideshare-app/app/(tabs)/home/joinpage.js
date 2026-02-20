import React, { useEffect, useState } from "react";
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
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../src/firebase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { colors } from "../../../ui/styles/colors";
import { commonStyles } from "../../../ui/styles/commonStyles";
import NavBar from '../../../app/components/nav-bar';
import { getOrCreateRideConversation } from '../../../src/utils/messaging';

export default function JoinPage() {
  const { user } = useAuth();
  const router = useRouter();

  const tagOptions = [
    "Groceries/Shopping",
    "Downtown",
    "Going Home/Far",
    "SBA",
    "LAX",
    "Amtrak Station",
    "Other",
  ];
  
  const tagColors = {
    "Downtown": "#e11d48",
    "Groceries/Shopping": "#f97316",
    "SBA": "#efdf70",
    "LAX": "#10b981",
    "Amtrak Station": "#0ea5e9",
    "Going Home/Far": "#6366f1",
    "Other": "#ff1493",
  };

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRide, setSelectedRide] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmRide, setConfirmRide] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const [joinedRideIds, setJoinedRideIds] = useState(new Set());
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState(new Set());

  useEffect(() => {
    if (!user?.uid) return;

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
          .filter(
            (ride) =>
              ride.ownerId !== user.uid &&
              ride.status !== "cancelled" &&
              ride.status !== "canceled"
          );

        setRides(ridesData);
        setLoading(false);
      },
      (err) => {
        console.error("rides onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setJoinedRideIds(new Set());
      return;
    }

    const unsub = onSnapshot(collection(db, "rides"), async (snap) => {
      try {
        const ids = new Set();

        await Promise.all(
          snap.docs.map(async (rideDoc) => {
            const rideId = rideDoc.id;
            const joinSnap = await getDoc(doc(db, "rides", rideId, "joins", user.uid));
            if (joinSnap.exists()) ids.add(rideId);
          })
        );

        setJoinedRideIds(ids);
      } catch (e) {
        console.warn("Failed to compute joinedRideIds:", e?.message ?? e);
        setJoinedRideIds(new Set());
      }
    });

    return () => unsub();
  }, [user?.uid]);

  const fetchRides = async () => {
    try {
      setLoading(true);

      const ridesQuery = query(collection(db, "rides"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(ridesQuery);

      const ridesData = [];
      for (const rideDoc of querySnapshot.docs) {
        const ride = { id: rideDoc.id, ...rideDoc.data() };
        if (
          ride.ownerId !== user?.uid &&
          ride.status !== "cancelled" &&
          ride.status !== "canceled"
        ) {
          ridesData.push({
            ...ride,
            ownerName: (ride.ownerName ?? "Unknown Driver").toString(),
          });
        }
      }

      setRides(ridesData);
    } catch (error) {
      console.error("Error fetching rides:", error);
      Alert.alert("Error", "Failed to load available rides. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "Not provided";
    const cleaned = String(phoneNumber).replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  };

  const handleRidePress = async (ride) => {
    setSelectedRide(ride);
    setModalVisible(true);
    
    // Fetch driver info from Firestore
    try {
      const driverDoc = await getDoc(doc(db, "users", ride.ownerId));
      if (driverDoc.exists()) {
        setDriverInfo(driverDoc.data());
      }
    } catch (error) {
      console.error("Error fetching driver info:", error);
    }
  };

  const closeJoinConfirm = () => {
    setConfirmVisible(false);
    setConfirmRide(null);
  };

  const toggleTagFilter = (tag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSelectedTags(new Set());
  };

  const getFilteredRides = () => {
    if (selectedTags.size === 0) {
      return rides;
    }
    return rides.filter((ride) => selectedTags.has(ride.tag));
  };

  const toNumber = (v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
  };

  const openJoinConfirm = (ride) => {
    const alreadyJoined = joinedRideIds.has(ride.id);
    const soldOut = Number(ride.seats) <= 0;

    if (alreadyJoined) {
      Alert.alert("Already joined", "You already joined this ride.");
      return;
    }
    if (soldOut) {
      Alert.alert("Sold out", "No seats left for this ride.");
      return;
    }

    setConfirmRide(ride);
    setConfirmVisible(true);
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
        const [rideSnap, joinSnap] = await Promise.all([tx.get(rideRef), tx.get(joinRef)]);

        if (!rideSnap.exists()) throw new Error("This ride no longer exists.");
        if (joinSnap.exists()) throw new Error("You already joined this ride.");

        const rideData = rideSnap.data();
        const seatsNum = Number(rideData.seats);

        if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
          throw new Error("No seats left for this ride.");
        }

        tx.update(rideRef, {
          seats: seatsNum - 1,
          total_seats: rideData.total_seats ?? seatsNum, // ensures field exists
        });
        tx.set(joinRef, {
          riderId: user.uid,
          riderEmail: user.email ?? "",
          joinedAt: serverTimestamp(),
          pricePaid: Number(rideData.price) || 0,
        });
      });

      // Create conversation with the host after successful join
      try {
        await getOrCreateRideConversation({
          rideId: confirmRide.id,
          ownerId: confirmRide.ownerId,
          rideInfo: `${confirmRide.fromAddress} → ${confirmRide.toAddress}`,
          rideDate: confirmRide.rideDate,
        });
      } catch (convoError) {
        console.error("Error creating conversation:", convoError);
        // Don't block the join flow if conversation creation fails
      }

      closeJoinConfirm();
      Alert.alert(
        "Ride Joined!",
        "You can now message everyone in this ride from your Messages tab.",
        [{ text: "OK", onPress: () => router.push("/(tabs)/home") }]
      );
    } catch (e) {
      const msg = e?.message ?? "";
      if (msg.toLowerCase().includes("already joined")) {
        closeJoinConfirm();
        Alert.alert("Already joined", "You already joined this ride.");
        return;
      }
      console.error("join error:", e);
      Alert.alert("Error", msg || "Could not join ride.");
    } finally {
      setIsJoining(false);
    }
  };

  const renderRideCard = ({ item }) => {
    const alreadyJoined = joinedRideIds.has(item.id);
    const soldOut = Number(item.seats) <= 0;
    const disabled = alreadyJoined || soldOut;
    const tagColor = item.tag ? tagColors[item.tag] : null;

    return (
      <TouchableOpacity
        style={[styles.rideCard, disabled && styles.rideCardDisabled]}
        onPress={() => handleRidePress(item)}
        activeOpacity={0.85}
      >
        {/* Tag Color Box and Top row: Driver name and Price */}
        <View style={styles.cardTopRow}>
          <View style={styles.driverNameSection}>
            {tagColor && (
              <View style={[styles.tagBox, { backgroundColor: tagColor }]} />
            )}
            <View style={[styles.driverIcon, disabled && styles.driverIconDisabled]}>
              <Text style={[styles.driverIconText, disabled && styles.textDisabled]}>👤</Text>
            </View>
            <Text style={[styles.driverName, disabled && styles.textDisabled]}>
              {item.ownerName}
            </Text>
          </View>
          <Text style={[styles.ridePrice, disabled && styles.priceDisabled]}>${item.price}</Text>
        </View>

        {/* Main content row */}
        <View style={styles.cardMainRow}>
          {/* Left side: When and Cap */}
          <View style={styles.leftInfo}>
            <View style={styles.whenSection}>
              <Text style={[styles.label, disabled && styles.textDisabled]}>When:</Text>
              <Text style={[styles.dateText, disabled && styles.textDisabled]}>
                {formatDate(item.rideDate)}
              </Text>
              <Text style={[styles.timeText, disabled && styles.textDisabled]}>
                {formatTime(item.rideDate)}
              </Text>
            </View>
            <Text style={[styles.capacityText, disabled && styles.textDisabled]}>
              {Number(item.total_seats ?? item.seats) - Number(item.seats)}/{Number(item.total_seats ?? item.seats)} seats taken
            </Text>
          </View>

          {/* Right side: To and From */}
          <View style={styles.rightInfo}>
            <View style={styles.destinationRow}>
              <Text style={[styles.destinationLabel, disabled && styles.textDisabled]}>To:</Text>
              <Text style={[styles.destinationValue, disabled && styles.textDisabled]}>
                {item.toAddress}
              </Text>
            </View>
            <View style={styles.destinationRow}>
              <Text style={[styles.destinationLabel, disabled && styles.textDisabled]}>From:</Text>
              <Text style={[styles.destinationValue, disabled && styles.textDisabled]}>
                {item.fromAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom row: View details and JOIN/JOINED/SOLD OUT button */}
        <View style={styles.cardBottomRow}>
          <TouchableOpacity
            style={[styles.viewDetailsButton, disabled && styles.viewDetailsButtonDisabled]}
            onPress={() => handleRidePress(item)}
            activeOpacity={0.85}
          >
            <Text style={[styles.viewDetailsButtonText, disabled && styles.textDisabled]}>
              View Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.joinButton, disabled && styles.joinButtonDisabled]}
            onPress={() => openJoinConfirm(item)}
            disabled={disabled}
            activeOpacity={0.85}
          >
            <Text style={[styles.joinButtonText, disabled && styles.joinButtonTextDisabled]}>
              {alreadyJoined ? "Joined" : soldOut ? "Sold Out" : "Join"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No available rides at the moment</Text>
      <Text style={styles.emptyStateSubtext}>Check back later or host a ride!</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Available Rides</Text>
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
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterButtonText}>Filter ▾</Text>
        </TouchableOpacity>

        {/* Rides List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading available rides...</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredRides()}
            renderItem={renderRideCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshing={loading}
            onRefresh={fetchRides}
          />
        )}

        {/* Filter Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={showFilterModal}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalOverlay}>
            <View style={styles.filterModalContent}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Filter by Tags</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Text style={styles.filterModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterTagList}>
                {tagOptions.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.filterTagOption}
                    onPress={() => toggleTagFilter(tag)}
                  >
                    <View style={styles.filterTagCheckbox}>
                      {selectedTags.has(tag) && (
                        <Text style={styles.filterTagCheckmark}>✓</Text>
                      )}
                    </View>
                    <View style={[styles.filterTagDot, { backgroundColor: tagColors[tag] || "#9ca3af" }]} />
                    <Text style={styles.filterTagOptionText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.filterModalActions}>
                <TouchableOpacity
                  style={styles.filterClearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.filterClearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterDoneButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.filterDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirm modal */}
        <Modal
          animationType="fade"
          transparent
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

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Ride price</Text>
                    <Text style={styles.confirmValue}>
                      ${toNumber(confirmRide.price).toFixed(2)}
                    </Text>
                  </View>

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
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeJoinConfirm}
                  disabled={isJoining}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payBtn, isJoining && { opacity: 0.7 }]}
                  onPress={handleConfirmJoin}
                  disabled={isJoining}
                >
                  <Text style={styles.payBtnText}>
                    {isJoining ? "Confirming..." : "Confirm"} 
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal for Ride Details */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedRide && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalDriverIcon}>
                        <Text style={styles.modalDriverIconText}>👤</Text>
                      </View>
                      <Text style={styles.modalDriverTitle}>{selectedRide.ownerName}</Text>
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
                        <Text style={styles.modalInfoValue}>{driverInfo?.payHandle || "Not provided"}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Bio:</Text>
                        <Text style={styles.modalInfoValue}>{driverInfo?.bio || "Not provided"}</Text>
                      </View>
                    </View>

                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Driver Notes</Text>
                    <View style={styles.modalNotes}>
                      {selectedRide.driverNotes ? (
                        <Text style={styles.modalNotesText}>{selectedRide.driverNotes}</Text>
                      ) : (
                        <Text style={styles.modalNotesPlaceholder}>No notes provided</Text>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // header
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 1,
  },

// search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    alignSelf: "flex-end",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  // list
  listContainer: {
    padding: 20,
    paddingTop: 15,
  },

  // loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.white,
  },

  // ride card
  rideCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  driverNameSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  driverIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  driverIconText: {
    fontSize: 22,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  ridePrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },

  cardMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  leftInfo: {
    flex: 1,
  },
  whenSection: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  capacityText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  rightInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  destinationRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  destinationLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    marginRight: 8,
  },
  destinationValue: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewDetailsButton: {
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewDetailsButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
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
    fontWeight: "bold",
  },
// empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
// modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 1,
    width: "88%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: colors.border,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  modalDriverIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 10,
  },
  modalDriverIconText: {
    fontSize: 30,
  },
  modalDriverTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  modalInfoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    width: 120,
  },
  modalInfoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
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
  modalNotesPlaceholder: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
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
// confirm modal
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    width: "88%",
    borderWidth: 2,
    borderColor: colors.border,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
  // Disabled (for JOINED / SOLD OUT) 
  rideCardDisabled: {
    backgroundColor: "#B8B8B8",
    borderColor: "#B8B8B8",
    borderWidth: 2,
    },
  driverIconDisabled: {
    backgroundColor: "#D3D3D3",
    borderColor: "#4A4A4A",
  },
  viewDetailsButtonDisabled: {
    backgroundColor: "#DADADA",
    borderColor: "#4A4A4A",
  },
  joinButtonDisabled: {
    backgroundColor: "#9E9E9E",
  },
  textDisabled: {
    color: "#2B2B2B",
  },
  priceDisabled: {
    color: "#1F1F1F",
  },
  joinButtonTextDisabled: {
    color: "#111111",
  },
  
  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  filterModalClose: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  filterTagList: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTagOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTagCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: colors.background,
  },
  filterTagCheckmark: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  filterTagDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  filterTagOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  filterModalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  filterClearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  filterClearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterDoneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  filterDoneButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
});