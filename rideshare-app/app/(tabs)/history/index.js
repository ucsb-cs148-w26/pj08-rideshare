import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../ui/styles/colors';
import { useAuth } from '../../../src/auth/AuthProvider';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../src/firebase';

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
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'hosted' | 'joined'
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);

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
          }))
        )
      );
      const joinedRides = joinResults
        .filter(({ joined }) => joined)
        .map(({ rideDoc }) => ({
          id: rideDoc.id,
          ...rideDoc.data(),
          type: 'joined',
        }));

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

    setSelectedRide({ ...ride, participants: [] });
    setDetailsModalVisible(true);

    // Fetch participants from joins subcollection in parallel
    try {
      const joinsSnap = await getDocs(collection(db, 'rides', ride.id, 'joins'));
      const participants = await Promise.all(
        joinsSnap.docs.map(async (joinDoc) => {
          const userSnap = await getDoc(doc(db, 'users', joinDoc.id));
          return {
            id: joinDoc.id,
            name: userSnap.exists() ? (userSnap.data().name || 'Unknown') : 'Unknown',
          };
        })
      );
      // Cache participants on the ride object in state and in the module-level cache
      setRides((prev) =>
        prev.map((r) => (r.id === ride.id ? { ...r, participants } : r))
      );
      if (rideHistoryCache[user?.uid]) {
        rideHistoryCache[user.uid].rides = rideHistoryCache[user.uid].rides.map(
          (r) => (r.id === ride.id ? { ...r, participants } : r)
        );
      }
      setSelectedRide((prev) => (prev ? { ...prev, participants } : prev));
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const closeDetails = () => {
    setDetailsModalVisible(false);
    setSelectedRide(null);
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
            onPress={() => { /* TODO: review flow */ }}
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
        {['all', 'hosted', 'joined'].map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterButton, filter === key && styles.filterButtonActive]}
            onPress={() => setFilter(key)}
          >
            <Text
              style={[styles.filterText, filter === key && styles.filterTextActive]}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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

                  {/* participants */}
                  {selectedRide.participants?.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {selectedRide.type === 'hosted' ? 'Passengers' : 'Riders'}
                      </Text>
                      {selectedRide.participants.map((p) => (
                        <View key={p.id} style={styles.participantRow}>
                          <View style={styles.participantAvatar}>
                            <Text style={styles.participantAvatarText}>
                              {p.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.participantName}>{p.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* driver notes */}
                  {selectedRide.driverNotes ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Driver Notes</Text>
                      <Text style={styles.modalText}>{selectedRide.driverNotes}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  },
  participantAvatar: {
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
