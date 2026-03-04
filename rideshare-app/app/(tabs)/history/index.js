import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthProvider';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';

export default function HistoryPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'hosted', 'joined'

  useEffect(() => {
    loadRideHistory();
  }, [user]);

  const loadRideHistory = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // TODO: Enable Firebase queries when ready
    setLoading(false);
    return;

    /* try {
      setLoading(true);
      
      // Query for rides where user was the host
      const hostedQuery = query(
        collection(db, 'rides'),
        where('hostId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
      
      // Query for rides where user was a passenger
      const joinedQuery = query(
        collection(db, 'rides'),
        where('passengerIds', 'array-contains', user.uid),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );

      const [hostedSnapshot, joinedSnapshot] = await Promise.all([
        getDocs(hostedQuery),
        getDocs(joinedQuery),
      ]);

      const hostedRides = hostedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'hosted',
      }));

      const joinedRides = joinedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'joined',
      }));

      // Combine and sort by date
      const allRides = [...hostedRides, ...joinedRides].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setRides(allRides);
    } catch (error) {
      console.error('Error loading ride history:', error);
    } finally {
      setLoading(false);
    } */
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date unavailable';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'all') return true;
    return ride.type === filter;
  });

  const renderRideCard = (ride) => {
    const isHost = ride.type === 'hosted';
    
    return (
      <View key={ride.id} style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.rideTypeContainer}>
            <Ionicons
              name={isHost ? 'car-sport' : 'person'}
              size={20}
              color={isHost ? colors.primary : colors.secondary}
            />
            <Text style={[styles.rideType, { color: isHost ? colors.primary : colors.secondary }]}>
              {isHost ? 'You Hosted' : 'You Joined'}
            </Text>
          </View>
          <Text style={styles.rideDate}>
            {formatDate(ride.createdAt)}
          </Text>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.origin?.address || 'Origin not specified'}
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={16} color="#8E8E93" />
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="flag" size={18} color={colors.secondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.destination?.address || 'Destination not specified'}
            </Text>
          </View>
        </View>

        {ride.departureTime && (
          <Text style={styles.timeText}>
            Departure: {formatTime(ride.departureTime)}
          </Text>
        )}

        {isHost && (
          <Text style={styles.passengersText}>
            Passengers: {ride.passengerIds?.length || 0} / {ride.seats || 0}
          </Text>
        )}
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
        <ScrollView style={styles.ridesList}>
          {filteredRides.map(renderRideCard)}
        </ScrollView>
      )}
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
    marginBottom: 20,
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
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideType: {
    fontSize: 16,
    fontWeight: '600',
  },
  rideDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 15,
    color: '#000000',
    flex: 1,
  },
  arrowContainer: {
    paddingLeft: 5,
    paddingVertical: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  passengersText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
});
