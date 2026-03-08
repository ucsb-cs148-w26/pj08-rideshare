import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../ui/styles/colors';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../src/firebase';
import { Ionicons } from '@expo/vector-icons';
import DefaultAvatar from '../../components/DefaultAvatar';
import ReviewsListModal from '../../components/ReviewsListModal';

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const cleaned = String(phoneNumber).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phoneNumber;
};

export default function ProfileViewPage() {
  const { userId, conversationId, returnRideId } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', userId));
        if (snapshot.exists()) {
          const data = snapshot.data();
          const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
          const primaryVehicle = vehicles[0] || {};
          setProfile({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || '',
            yearsAtUCSB: data.yearsAtUCSB || '',
            major: data.major || '',
            clubs: data.clubs || '',
            bio: data.bio || '',
            payHandle: data.payHandle || '',
            photoURL: data.photoURL || null,
            avatarBgColor: data.avatarBgColor || '#FFFFFF',
            avatarPreset: data.avatarPreset || 'default',
            vehicleMake: primaryVehicle.make || '',
            vehicleModel: primaryVehicle.model || '',
            vehiclePlate: primaryVehicle.plate || '',
          });
        }
        
        // Load reviews and calculate average rating
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('reviewedUserId', '==', userId)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        
        if (!reviewsSnap.empty) {
          const reviews = reviewsSnap.docs.map(doc => doc.data());
          const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
          const avg = sum / reviews.length;
          setAverageRating(avg);
          setReviewCount(reviews.length);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const initials = useMemo(() => {
    const source = profile?.name || '';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [profile?.name]);

  const handleGoBack = () => {
    if (conversationId) {
      router.push({
        pathname: '/(tabs)/messages/chat',
        params: { conversationId },
      });
    } else if (returnRideId) {
      router.push({
        pathname: '/(tabs)/history',
        params: { returnRideId },
      });
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>Profile not found</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={handleGoBack}>
            <Text style={styles.backButtonLargeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.card}>
          {/* Avatar + Name */}
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              {profile.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
              ) : (
                <DefaultAvatar size={64} bgColor={profile.avatarBgColor || '#FFFFFF'} avatarType={profile.avatarPreset || 'default'} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name}>{profile.name}</Text>
              
              {/* Rating Display */}
              {reviewCount > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text style={styles.ratingText}>
                    {averageRating.toFixed(1)} ({reviewCount})
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Reviews Button */}
          {reviewCount > 0 && (
            <TouchableOpacity
              style={styles.reviewsButton}
              onPress={() => setReviewsModalVisible(true)}
            >
              <Ionicons name="star-outline" size={18} color={colors.accent} />
              <Text style={styles.reviewsButtonText}>View Reviews</Text>
            </TouchableOpacity>
          )}

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{profile.name || '—'}</Text>
            </View>

            {profile.role ? (
              <View style={styles.field}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</Text>
              </View>
            ) : null}

            {profile.yearsAtUCSB ? (
              <View style={styles.field}>
                <Text style={styles.label}>Years at UCSB</Text>
                <Text style={styles.value}>{profile.yearsAtUCSB}</Text>
              </View>
            ) : null}

            {profile.major ? (
              <View style={styles.field}>
                <Text style={styles.label}>Major</Text>
                <Text style={styles.value}>{profile.major}</Text>
              </View>
            ) : null}

            {profile.payHandle ? (
              <View style={styles.field}>
                <Text style={styles.label}>Pay Handle</Text>
                <Text style={styles.value}>{profile.payHandle}</Text>
              </View>
            ) : null}
          </View>

          {/* Clubs */}
          {profile.clubs ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clubs & Interests</Text>
              <View style={styles.field}>
                <Text style={styles.bioValue}>{profile.clubs}</Text>
              </View>
            </View>
          ) : null}

          {/* Fun Fact */}
          {profile.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fun Fact</Text>
              <View style={styles.field}>
                <Text style={styles.bioValue}>{profile.bio}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      
      {/* Reviews List Modal */}
      <ReviewsListModal
        visible={reviewsModalVisible}
        onClose={() => setReviewsModalVisible(false)}
        userId={userId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 88 : 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
},
  backButtonLarge: {
    backgroundColor: colors.accent || '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonLargeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent || '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.secondary || '#1A1A1A',
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary || '#666666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  reviewsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary || '#1A1A1A',
    marginBottom: 10,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary || '#666666',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: colors.textSecondary || '#666666', // changed to gray for profile popups
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  bioValue: {
    fontSize: 15,
    color: colors.textSecondary || '#666666', // changed to gray for profile popups
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    lineHeight: 22,
    overflow: 'hidden',
  },
});