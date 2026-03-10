import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../ui/styles/colors';
import { useAuth } from '../../../src/auth/AuthProvider';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import ReviewSelectionModal from '../../components/ReviewSelectionModal';
import ReviewFormModal from '../../components/ReviewFormModal';
import { Alert } from 'react-native';
import DefaultAvatar from '../../components/DefaultAvatar';

// ── Status config ───────────────────────────────────────────
const STATUS_OPTIONS = [
  { key: 'all',        label: 'All Statuses' },
  { key: 'completed',  label: 'Completed',    color: '#22c55e', icon: 'checkmark-circle' },
  { key: 'cancelled',  label: 'Cancelled',    color: '#ef4444', icon: 'close-circle' },
  { key: 'no_show',    label: 'No-Show',      color: '#f59e0b', icon: 'alert-circle' },
];

const TIME_OPTIONS = [
  { key: 'all',       label: 'All Time' },
  { key: 'week',      label: 'Past Week' },
  { key: 'month',     label: 'Past Month' },
  { key: '3months',   label: 'Past 3 Months' },
  { key: 'year',      label: 'Past Year' },
];

const getStatusStyle = (status) => {
  const match = STATUS_OPTIONS.find((s) => s.key === status);
  return match || { label: status || 'Unknown', color: '#8E8E93', icon: 'help-circle' };
};

const ENDED_STATUSES = ['completed', 'cancelled', 'no_show'];

// Module-level cache — survives tab switches, cleared on user change
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const rideHistoryCache = {}; // { [uid]: { rides, timestamp } }

export default function HistoryPage() {
  const { user } = useAuth();
  const { returnRideId } = useLocalSearchParams();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'hosted' | 'joined'
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  
  // Review modals state
  const [reviewSelectionVisible, setReviewSelectionVisible] = useState(false);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [reviewRideParticipants, setReviewRideParticipants] = useState([]);
  const [currentReviewRide, setCurrentReviewRide] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ── load ride history on focus ─────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      const cached = rideHistoryCache[user.uid];
      if (cached) {
        // Show cached data immediately
        setRides(cached.rides);
        setLoading(false);
        // Background-refresh if stale
        if (Date.now() - cached.timestamp >= CACHE_TTL) {
          loadRideHistory(user.uid);
        }
      } else {
        loadRideHistory(user.uid);
      }
    }, [user])
  );

  const loadRideHistory = async (uid) => {
    try {
      setLoading(true);

      // 1) Fetch hosted rides and all ended rides in parallel
      const [hostedSnap, allEndedSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'rides'),
          where('ownerId', '==', uid),
          where('status', 'in', ENDED_STATUSES)
        )),
        getDocs(query(
          collection(db, 'rides'),
          where('status', 'in', ENDED_STATUSES)
        )),
      ]);

      const hostedRides = hostedSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        type: 'hosted',
      }));

      // 2) Check join membership for non-owned rides in parallel
      const otherEndedDocs = allEndedSnap.docs.filter(
        (d) => d.data().ownerId !== uid
      );
      const joinResults = await Promise.all(
        otherEndedDocs.map((rideDoc) =>
          getDoc(doc(db, 'rides', rideDoc.id, 'joins', uid)).then((joinSnap) => ({
            rideDoc,
            joined: joinSnap.exists(),
            joinData: joinSnap.exists() ? joinSnap.data() : null,
          }))
        )
      );
      const joinedRides = joinResults
        .filter(({ joined }) => joined)
        .map(({ rideDoc, joinData }) => {
          const rideData = rideDoc.data();
          // If this rider was marked as no-show, override the displayed status
          const displayStatus = joinData?.no_show ? 'no_show' : rideData.status;
          return {
            id: rideDoc.id,
            ...rideData,
            status: displayStatus,
            actualStatus: rideData.status, // Keep original status for reference
            type: 'joined',
          };
        });

      // Combine & sort newest first
      const all = [...hostedRides, ...joinedRides].sort((a, b) => {
        const da = a.completedAt || a.rideDate || '';
        const db2 = b.completedAt || b.rideDate || '';
        return new Date(db2) - new Date(da);
      });

      rideHistoryCache[uid] = { rides: all, timestamp: Date.now() };
      setRides(all);
    } catch (err) {
      console.error('Error loading ride history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check for returnRideId param and reopen details modal
  useEffect(() => {
    if (returnRideId && rides.length > 0 && !loading) {
      const ride = rides.find(r => r.id === returnRideId);
      if (ride) {
        openDetails(ride);
        // Clear the param to prevent reopening on subsequent navigations
        router.setParams({ returnRideId: undefined });
      }
    }
  }, [returnRideId, rides, loading]);

  // ── helpers ──────────────────────────────────────────────────
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

  const isReviewExpired = (ride) => {
    const endTime = new Date(ride.completedAt || ride.rideDate || 0).getTime();
    return Date.now() - endTime > FORTY_EIGHT_HOURS;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ── filtering ──────────────────────────────────────────────
  const filteredRides = rides.filter((r) => {
    // role filter
    if (filter !== 'all' && r.type !== filter) return false;
    // status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    // time filter
    if (timeFilter !== 'all') {
      const rideTime = new Date(r.completedAt || r.rideDate || 0).getTime();
      const now = Date.now();
      const cutoffs = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        '3months': 90 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      };
      if (now - rideTime > (cutoffs[timeFilter] || Infinity)) return false;
    }
    return true;
  });

  // ── event handlers ─────────────────────────────────────────
  const openDetails = async (ride) => {
    // If participants already cached on this ride, show immediately
    if (ride.participants) {
      setSelectedRide(ride);
      setDetailsModalVisible(true);
      return;
    }

    setSelectedRide({ ...ride, participants: [], driver: null });
    setDetailsModalVisible(true);
    
    // Fetch driver/owner info
    try {
      const fetchDriver = getDoc(doc(db, 'users', ride.ownerId)).then(ownerSnap => {
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          return {
            id: ride.ownerId,
            name: ownerData.name || 'Unknown',
            photoURL: ownerData.photoURL || null,
            avatarBgColor: ownerData.avatarBgColor || '#4A90E270',
            avatarPreset: ownerData.avatarPreset || 'default',
          };
        }
        return null;
      });
      
      // Fetch participants from joins subcollection in parallel
      const joinsSnap = await getDocs(collection(db, 'rides', ride.id, 'joins'));
      const fetchParticipants = Promise.all(
        joinsSnap.docs.map(async (joinDoc) => {
          const userSnap = await getDoc(doc(db, 'users', joinDoc.id));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            return {
              id: joinDoc.id,
              name: userData.name || 'Unknown',
              photoURL: userData.photoURL || null,
              avatarBgColor: userData.avatarBgColor || '#4A90E270',
              avatarPreset: userData.avatarPreset || 'default',
            };
          }
          return { id: joinDoc.id, name: 'Unknown' };
        })
      );

      // Execute both fetches in parallel
      const [driver, participants] = await Promise.all([fetchDriver, fetchParticipants]);

      // Cache driver and participants on the ride object in state and in the module-level cache
      setRides((prev) =>
        prev.map((r) => (r.id === ride.id ? { ...r, participants, driver } : r))
      );
      
      if (rideHistoryCache[user?.uid]) {
        rideHistoryCache[user.uid].rides = rideHistoryCache[user.uid].rides.map(
          (r) => (r.id === ride.id ? { ...r, participants, driver } : r)
        );
      }

      // Update the modal with the loaded data
      setSelectedRide((prev) => (prev ? { ...prev, participants, driver } : prev));
    } catch (err) {
      console.error('Error fetching ride details:', err);
    }
  };

  const closeDetails = () => {
    setDetailsModalVisible(false);
    setSelectedRide(null);
  };

  // ── review flow handlers ───────────────────────────────────
  const openReviewFlow = async (ride) => {
    try {
      setCurrentReviewRide(ride);
      
      // Fetch all participants including the host
      const allParticipants = [];
      
      // Add host
      const hostSnap = await getDoc(doc(db, 'users', ride.ownerId));
      if (hostSnap.exists()) {
        const hostData = hostSnap.data();
        allParticipants.push({
          id: ride.ownerId,
          name: hostData.name || 'Unknown',
          photoURL: hostData.photoURL || null,
          avatarBgColor: hostData.avatarBgColor || '#4A90E270',
          avatarPreset: hostData.avatarPreset || 'default',
        });
      }
      
      // Add riders from joins subcollection
      const joinsSnap = await getDocs(collection(db, 'rides', ride.id, 'joins'));
      for (const joinDoc of joinsSnap.docs) {
        if (joinDoc.id === user.uid) continue; // Skip current user
        
        const userSnap = await getDoc(doc(db, 'users', joinDoc.id));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          allParticipants.push({
            id: joinDoc.id,
            name: userData.name || 'Unknown',
            photoURL: userData.photoURL || null,
            avatarBgColor: userData.avatarBgColor || '#4A90E270',
            avatarPreset: userData.avatarPreset || 'default',
          });
        }
      }
      
      // Remove current user from the list
      const filteredParticipants = allParticipants.filter(p => p.id !== user.uid);
      
      setReviewRideParticipants(filteredParticipants);
      setReviewSelectionVisible(true);
    } catch (error) {
      console.error('Error loading participants for review:', error);
      Alert.alert('Error', 'Failed to load participants');
    }
  };

  const handleSelectParticipant = (participant) => {
    setSelectedParticipant(participant);
    setReviewSelectionVisible(false);
    setReviewFormVisible(true);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      setIsSubmittingReview(true);
      
      // Check if user already reviewed this person for this ride
      const existingReviewQuery = query(
        collection(db, 'reviews'),
        where('rideId', '==', currentReviewRide.id),
        where('reviewerId', '==', user.uid),
        where('reviewedUserId', '==', selectedParticipant.id)
      );
      const existingReviewSnap = await getDocs(existingReviewQuery);
      
      if (!existingReviewSnap.empty) {
        Alert.alert('Already Reviewed', 'You have already reviewed this person for this ride.');
        setIsSubmittingReview(false);
        setReviewFormVisible(false);
        return;
      }
      
      // Save review to Firestore
      await addDoc(collection(db, 'reviews'), {
        rideId: currentReviewRide.id,
        reviewerId: user.uid,
        reviewedUserId: selectedParticipant.id,
        rating: reviewData.rating,
        description: reviewData.description || '',
        createdAt: serverTimestamp(),
      });
      
      Alert.alert('Success', 'Review submitted successfully!');
      setReviewFormVisible(false);
      setSelectedParticipant(null);
      setCurrentReviewRide(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const closeReviewModals = () => {
    setReviewSelectionVisible(false);
    setReviewFormVisible(false);
    setSelectedParticipant(null);
    setReviewRideParticipants([]);
    setCurrentReviewRide(null);
  };

  // ── ride card ──────────────────────────────────────────────
  const renderRideCard = (ride) => {
    const isHost = ride.type === 'hosted';
    const accentColor = isHost ? colors.accent : colors.secondary;
    const reviewTextColor = isHost ? '#FFFFFF' : colors.primary;

    const status = getStatusStyle(ride.status);

    return (
      <View key={ride.id} style={styles.rideCard}>
        {/* top row: role badge + status label */}
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardBadge, { color: accentColor }]}>
            {isHost ? 'Hosted' : 'Joined'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusBadgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* info row */}
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardLabel}>When</Text>
            <Text style={styles.cardDate}>{formatDate(ride.rideDate)}</Text>
            <Text style={styles.cardTime}>{formatTime(ride.rideDate)}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardLabel}>Route</Text>
            <Text style={styles.cardDestination} numberOfLines={2}>
              {ride.fromAddress} → {ride.toAddress}
            </Text>
          </View>
        </View>

        {/* buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.detailsButton, styles.buttonFlex]}
            onPress={() => openDetails(ride)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reviewPlaceholder,
              styles.buttonFlex,
              isReviewExpired(ride) && styles.reviewExpired,
            ]}
            onPress={() => openReviewFlow(ride)}
            disabled={isReviewExpired(ride)}
          >
            <Ionicons
              name="star-outline"
              size={16}
              color={isReviewExpired(ride) ? '#C7C7CC' : colors.secondary}
            />
            <Text
              style={[
                styles.reviewPlaceholderText,
                isReviewExpired(ride) && styles.reviewExpiredText,
              ]}
            >
              {isReviewExpired(ride) ? 'Expired' : 'Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── main render ────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <Text style={styles.title}>History</Text>

      {/* role filter pills */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'hosted' && styles.filterHostedActive]}
          onPress={() => setFilter('hosted')}
        >
          <Text style={[styles.filterText, filter === 'hosted' && styles.filterHostedTextActive]}>Hosted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'joined' && styles.filterJoinedActive]}
          onPress={() => setFilter('joined')}
        >
          <Text style={[styles.filterText, filter === 'joined' && styles.filterJoinedTextActive]}>Joined</Text>
        </TouchableOpacity>
      </View>

      {/* dropdown filters row */}
      <View style={styles.dropdownRow}>
        {/* ── Status dropdown ── */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setStatusDropdownOpen(!statusDropdownOpen);
              setTimeDropdownOpen(false);
            }}
          >
            {(() => {
              const sel = STATUS_OPTIONS.find((o) => o.key === statusFilter);
              return sel?.icon
                ? <Ionicons name={sel.icon} size={16} color={sel.color} />
                : <Ionicons name="filter" size={16} color={colors.textPrimary} />;
            })()}
            <Text style={styles.dropdownButtonText} numberOfLines={1}>
              {STATUS_OPTIONS.find((o) => o.key === statusFilter)?.label}
            </Text>
            <Ionicons
              name={statusDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {statusDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.dropdownItem,
                    statusFilter === opt.key && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setStatusFilter(opt.key);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {opt.icon && (
                    <Ionicons name={opt.icon} size={16} color={opt.color} style={{ marginRight: 8 }} />
                  )}
                  <Text
                    style={[
                      styles.dropdownItemText,
                      statusFilter === opt.key && styles.dropdownItemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Time dropdown ── */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setTimeDropdownOpen(!timeDropdownOpen);
              setStatusDropdownOpen(false);
            }}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.dropdownButtonText} numberOfLines={1}>
              {TIME_OPTIONS.find((o) => o.key === timeFilter)?.label}
            </Text>
            <Ionicons
              name={timeDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {timeDropdownOpen && (
            <View style={[styles.dropdownMenu, { right: 0, left: undefined }]}>
              {TIME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.dropdownItem,
                    timeFilter === opt.key && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setTimeFilter(opt.key);
                    setTimeDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      timeFilter === opt.key && styles.dropdownItemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 48-hour review notice */}
      <View style={styles.reviewNoticeBanner}>
        <Ionicons name="time-outline" size={16} color="#D97706" />
        <Text style={styles.reviewNoticeText}>
          Reviews must be submitted within 48 hours of ride completion.
        </Text>
      </View>

      {/* ride list */}
      {loading ? (
        <View style={styles.emptyContainer}>
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
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 80 }}
        >
          {filteredRides.map(renderRideCard)}
        </ScrollView>
      )}

      {/* ── Details Modal ─────────────────────────────────── */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDetails}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDetails}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <TouchableOpacity onPress={closeDetails}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* modal body */}
            <ScrollView style={styles.modalBody}>
              {selectedRide && (
                <>
                  {/* Status Badge */}
                  <View style={styles.modalSection}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(selectedRide.status).color + '18' }]}>
                      <Ionicons name={getStatusStyle(selectedRide.status).icon} size={18} color={getStatusStyle(selectedRide.status).color} />
                      <Text style={[styles.statusBadgeText, { color: getStatusStyle(selectedRide.status).color }]}>
                        {getStatusStyle(selectedRide.status).label}
                      </Text>
                    </View>
                  </View>
                  {/* route */}
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

                  {/* date & time */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Date & Time</Text>
                    <Text style={styles.modalText}>
                      {formatDate(selectedRide.rideDate)}
                    </Text>
                    <Text style={styles.modalText}>
                      {formatTime(selectedRide.rideDate)}
                    </Text>
                  </View>

                  {/* price */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Price</Text>
                    <Text style={styles.modalText}>
                      ${Number(selectedRide.price || 0).toFixed(2)} per person
                    </Text>
                  </View>

                  {/* seats */}
                  {selectedRide.seatsAvailable && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Seats</Text>
                      <Text style={styles.modalText}>
                        {selectedRide.seatsAvailable} available
                      </Text>
                    </View>
                  )}

                  {/* Driver */}
                  {selectedRide.driver && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Driver</Text>
                      <TouchableOpacity 
                        style={styles.participantRow}
                        onPress={() => {
                          setDetailsModalVisible(false);
                          setTimeout(() => {
                            router.push({ 
                              pathname: '/(tabs)/account/profilepage', 
                              params: { 
                                userId: selectedRide.driver.id,
                                returnRideId: selectedRide.id 
                              } 
                            });
                          }, 100);
                        }}
                      >
                        <View style={styles.participantAvatar}>
                          {selectedRide.driver.photoURL ? (
                            <Image source={{ uri: selectedRide.driver.photoURL }} style={styles.participantAvatarImage} />
                          ) : (
                            <DefaultAvatar 
                              size={40} 
                              bgColor={selectedRide.driver.avatarBgColor} 
                              avatarType={selectedRide.driver.avatarPreset} 
                            />
                          )}
                        </View>
                        <Text style={styles.participantName}>{selectedRide.driver.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* participants */}
                  {selectedRide.participants?.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {selectedRide.type === 'hosted' ? 'Passengers' : 'Riders'}
                      </Text>
                      {selectedRide.participants.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={styles.participantRow}
                          onPress={() => {
                            setDetailsModalVisible(false);
                            setTimeout(() => {
                              router.push({ 
                                pathname: '/(tabs)/account/profilepage', 
                                params: { 
                                  userId: p.id,
                                  returnRideId: selectedRide.id 
                                } 
                              });
                            }, 100);
                          }}
                        >
                          <View style={styles.participantAvatar}>
                            {p.photoURL ? (
                              <Image source={{ uri: p.photoURL }} style={styles.participantAvatarImage} />
                            ) : (
                              <DefaultAvatar 
                                size={40} 
                                bgColor={p.avatarBgColor} 
                                avatarType={p.avatarPreset} 
                              />
                            )}
                          </View>
                          <Text style={styles.participantName}>{p.name}</Text>
                          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Review Selection Modal ──────────────────────────── */}
      <ReviewSelectionModal
        visible={reviewSelectionVisible}
        onClose={closeReviewModals}
        participants={reviewRideParticipants}
        hostId={currentReviewRide?.ownerId}
        onSelectParticipant={handleSelectParticipant}
      />

      {/* ── Review Form Modal ───────────────────────────────── */}
      <ReviewFormModal
        visible={reviewFormVisible}
        onClose={() => {
          setReviewFormVisible(false);
          setSelectedParticipant(null);
        }}
        participant={selectedParticipant}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
      />
    </SafeAreaView>
  );
}

// ── styles ──────────────────────────────────────────────────────
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
  },

  /* filter pills */
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
  filterHostedActive: {
    backgroundColor: colors.accent,
  },
  filterJoinedActive: {
    backgroundColor: colors.secondary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterHostedTextActive: {
    color: '#FFFFFF',
  },
  filterJoinedTextActive: {
    color: colors.primary,
  },

  /* dropdown filters */
  dropdownRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  dropdownWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemActive: {
    backgroundColor: colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },

  /* empty state */
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

  /* ride list */
  ridesList: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
  },

  /* ride card */
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBadge: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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

  /* card buttons */
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
  reviewPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  reviewPlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewExpired: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  reviewExpiredText: {
    color: '#8E8E93',
  },
  reviewComingSoon: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  reviewNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  reviewNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },

  /* details modal */
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
    paddingVertical: 4,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  participantAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    flex: 1,
  },
});
