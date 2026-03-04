import React, { useState, useEffect } from 'react';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthProvider';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';

export default function HistoryPage() {
  const { user } = useAuth();
  const { rideId } = useLocalSearchParams();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'hosted', 'joined'
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideParticipants, setRideParticipants] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadRideHistory();
    }, [user])
  );

  // Reopen modal if returning with a rideId parameter
  useEffect(() => {
    if (rideId && rides.length > 0 && !detailsModalVisible) {
      const ride = rides.find(r => r.id === rideId);
      if (ride) {
        handleViewDetails(ride);
      }
    }
  }, [rideId, rides]);

  const loadRideHistory = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Loading ride history for user:', user.uid);
      
      // Query for rides where user was the host
      const hostedQuery = query(
        collection(db, 'rides'),
        where('ownerId', '==', user.uid),
        where('status', '==', 'completed')
      );
      
      const hostedSnapshot = await getDocs(hostedQuery);
      console.log('Found', hostedSnapshot.docs.length, 'hosted completed rides');

      const hostedRides = hostedSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Hosted ride:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          type: 'hosted',
        };
      });

      // Query for all completed rides to check joins
      const allCompletedQuery = query(
        collection(db, 'rides'),
        where('status', '==', 'completed')
      );
      
      const allCompletedSnapshot = await getDocs(allCompletedQuery);
      
      // Check which rides the user joined
      const joinedRides = [];
      for (const rideDoc of allCompletedSnapshot.docs) {
        // Skip rides the user hosted
        if (rideDoc.data().ownerId === user.uid) continue;
        
        // Check if user has a join document
        const joinDoc = await getDoc(doc(db, 'rides', rideDoc.id, 'joins', user.uid));
        if (joinDoc.exists()) {
          joinedRides.push({
            id: rideDoc.id,
            ...rideDoc.data(),
            type: 'joined',
          });
        }
      }

      // Combine and sort by date
      const allRides = [...hostedRides, ...joinedRides].sort((a, b) => {
        const dateA = a.rideDate ? new Date(a.rideDate) : new Date(0);
        const dateB = b.rideDate ? new Date(b.rideDate) : new Date(0);
        return dateB - dateA;
      });

      console.log('Total rides in history:', allRides.length);
      setRides(allRides);
    } catch (error) {
      console.error('Error loading ride history:', error);
      console.error('Error details:', error.code, error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'all') return true;
    return ride.type === filter;
  });

  const handleViewDetails = async (ride) => {
    setSelectedRide(ride);
    
    // Fetch participants for this ride
    try {
      const joinsSnapshot = await getDocs(collection(db, 'rides', ride.id, 'joins'));
      const participantIds = joinsSnapshot.docs.map(doc => doc.id);
      
      // Fetch participant names and photos
      const participants = [];
      for (const participantId of participantIds) {
        const userDoc = await getDoc(doc(db, 'users', participantId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          participants.push({
            id: participantId,
            name: userData.name || 'Unknown',
            photoURL: userData.photoURL || null,
          });
        }
      }
      
      setRideParticipants(participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setRideParticipants([]);
    }
    
    setDetailsModalVisible(true);
  };

  const handleViewProfile = (userId) => {
    setDetailsModalVisible(false);
    // Small delay to ensure modal closes before navigation
    setTimeout(() => {
      router.push({ 
        pathname: '/(tabs)/account/profilepage', 
        params: { 
          userId,
          returnTo: 'history',
          rideId: selectedRide?.id
        } 
      });
    }, 300);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedRide(null);
    setRideParticipants([]);
  };

  const handleReview = (ride) => {
    // TODO: Implement review modal/screen
    console.log('Review ride:', ride.id);
  };

  const renderRideCard = (ride) => {
    const isHost = ride.type === 'hosted';
    const reviewButtonColor = isHost ? colors.accent : colors.secondary;
    const reviewTextColor = isHost ? '#FFFFFF' : colors.primary;
    
    return (
      <View key={ride.id} style={styles.rideCard}>
        <Text style={[styles.cardTitle, { color: reviewButtonColor }]}>
          {isHost ? 'Hosted' : 'Joined'}
        </Text>
        
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardLabel}>When:</Text>
            <Text style={styles.cardDate}>{formatDate(ride.rideDate)}</Text>
            <Text style={styles.cardTime}>{formatTime(ride.rideDate)}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardLabel}>To:</Text>
            <Text style={styles.cardDestination} numberOfLines={2}>
              {ride.fromAddress} → {ride.toAddress}
            </Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.detailsButton, styles.buttonFlex]}
            onPress={() => handleViewDetails(ride)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.reviewButton, 
              styles.buttonFlex,
              { backgroundColor: reviewButtonColor, borderColor: reviewButtonColor }
            ]}
            onPress={() => handleReview(ride)}
          >
            <Text style={[styles.reviewButtonText, { color: reviewTextColor }]}>Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>History</Text>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'hosted' && styles.filterButtonActive]}
          onPress={() => setFilter('hosted')}
        >
          <Text style={[styles.filterText, filter === 'hosted' && styles.filterTextActive]}>
            Hosted
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'joined' && styles.filterButtonActive]}
          onPress={() => setFilter('joined')}
        >
          <Text style={[styles.filterText, filter === 'joined' && styles.filterTextActive]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all'
              ? 'Your completed rides will appear here'
              : filter === 'hosted'
              ? 'Rides you hosted will appear here'
              : 'Rides you joined will appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.ridesList}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredRides.map(renderRideCard)}
        </ScrollView>
      )}

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDetailsModal}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeDetailsModal}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <TouchableOpacity onPress={closeDetailsModal}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedRide && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Route</Text>
                    <View style={styles.modalRow}>
                      <Ionicons name="location" size={18} color={colors.primary} />
                      <Text style={styles.modalText}>{selectedRide.fromAddress}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Ionicons name="flag" size={18} color={colors.secondary} />
                      <Text style={styles.modalText}>{selectedRide.toAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Date & Time</Text>
                    <Text style={styles.modalText}>{formatDate(selectedRide.rideDate)}</Text>
                    <Text style={styles.modalText}>{formatTime(selectedRide.rideDate)}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Price</Text>
                    <Text style={styles.modalText}>
                      ${Number(selectedRide.price || 0).toFixed(2)} per person
                    </Text>
                  </View>

                  {selectedRide.tag && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Category</Text>
                      <Text style={styles.modalText}>{selectedRide.tag}</Text>
                    </View>
                  )}

                  {selectedRide.seatsAvailable && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Seats</Text>
                      <Text style={styles.modalText}>{selectedRide.seatsAvailable} available</Text>
                    </View>
                  )}

                  {rideParticipants.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {selectedRide.type === 'hosted' ? 'Passengers' : 'Riders'}
                      </Text>
                      {rideParticipants.map((participant) => (
                        <TouchableOpacity 
                          key={participant.id} 
                          style={styles.participantRow}
                          onPress={() => handleViewProfile(participant.id)}
                        >
                          {participant.photoURL ? (
                            <Image 
                              source={{ uri: participant.photoURL }} 
                              style={styles.participantAvatar}
                            />
                          ) : (
                            <View style={styles.participantAvatarPlaceholder}>
                              <Text style={styles.participantAvatarText}>
                                {participant.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.participantName}>{participant.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedRide.driverNotes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Driver Notes</Text>
                      <Text style={styles.modalText}>{selectedRide.driverNotes}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  ridesList: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    flex: 1,
    marginLeft: -32,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardDestination: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonFlex: {
    flex: 1,
  },
  detailsButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '88%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  modalBody: {
    maxHeight: '85%',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  modalText: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  participantAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
