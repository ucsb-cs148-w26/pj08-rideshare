import React, { useState, useEffect } from 'react';
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
import { collection, query, getDocs, orderBy, doc, getDoc, onSnapshot } from 'firebase/firestore';
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

//   useEffect(() => {
//   setLoading(true);

//   const ridesQuery = query(collection(db, "rides"), orderBy("createdAt", "desc"));

//   const unsub = onSnapshot(
//     ridesQuery,
//     (snapshot) => {
//       const ridesData = snapshot.docs
//         .map((d) => ({ id: d.id, ...d.data() }))
//         .filter((ride) => ride.ownerId !== user?.uid); // keep if you still want to hide your own

//       setRides(ridesData);
//       setLoading(false);
//     },
//     (error) => {
//       console.error("onSnapshot error:", error);
//       setLoading(false);
//     }
//   );

//   return () => unsub();
// }, [user?.uid]);

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

  const renderRideCard = ({ item }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
    >
      <View style={styles.rideHeader}>
        <View style={styles.driverIcon}>
          <Text style={styles.driverIconText}>👤</Text>
        </View>
        <View style={styles.rideInfo}>
          <Text style={styles.driverName}>{item.ownerName}</Text>
          <Text style={styles.rideDate}>WHEN: {formatDate(item.rideDate)}</Text>
          <Text style={styles.rideCapacity}>CAP: {item.seats} seats</Text>
        </View>
        <View style={styles.rideDestinations}>
          <Text style={styles.destinationLabel}>TO: {item.toAddress}</Text>
          <Text style={styles.destinationLabel}>FROM: {item.fromAddress}</Text>
        </View>
        <Text style={styles.ridePrice}>${item.price}</Text>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>JOIN</Text>
      </TouchableOpacity>
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
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  driverIconText: {
    fontSize: 20,
  },
  rideInfo: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  rideCapacity: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rideDestinations: {
    flex: 2,
    marginLeft: 10,
  },
  destinationLabel: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 2,
  },
  ridePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 10,
  },
  joinButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
    alignSelf: 'flex-end',
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
});