import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../ui/styles/colors';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';

/**
 * Modal for displaying all reviews for a user
 */
export default function ReviewsListModal({
  visible,
  onClose,
  userId,
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (visible && userId) {
      loadReviews();
    }
  }, [visible, userId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews for this user
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('reviewedUserId', '==', userId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      
      const loadedReviews = [];
      for (const reviewDoc of reviewsSnap.docs) {
        const reviewData = reviewDoc.data();
        
        // Fetch ride data to determine role
        let role = 'Rider';
        try {
          const rideSnap = await getDoc(doc(db, 'rides', reviewData.rideId));
          if (rideSnap.exists()) {
            const rideData = rideSnap.data();
            if (rideData.ownerId === userId) {
              role = 'Driver';
            }
          }
        } catch (error) {
          console.error('Error fetching ride data:', error);
        }
        
        loadedReviews.push({
          id: reviewDoc.id,
          ...reviewData,
          reviewerName: 'Anonymous',
          reviewerPhotoURL: null,
          reviewerAvatarBgColor: '#9CA3AF',
          reviewerAvatarPreset: 'default',
          role: role,
        });
      }
      
      // Sort by created date (newest first)
      loadedReviews.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setReviews(loadedReviews);
      
      // Calculate average rating
      if (loadedReviews.length > 0) {
        const sum = loadedReviews.reduce((acc, review) => acc + review.rating, 0);
        const avg = sum / loadedReviews.length;
        setAverageRating(avg);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#FBBF24"
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviews</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* Average Rating */}
              {reviews.length > 0 && (
                <View style={styles.averageSection}>
                  <Text style={styles.averageRating}>
                    {averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.averageStars}>
                    {renderStars(Math.round(averageRating))}
                  </View>
                  <Text style={styles.reviewCount}>
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              )}

              {/* Reviews List */}
              <ScrollView style={styles.modalBody}>
                {reviews.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No reviews yet</Text>
                  </View>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      {/* Reviewer Info */}
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <View style={styles.reviewerAvatar}>
                            {review.reviewerPhotoURL ? (
                              <Image
                                source={{ uri: review.reviewerPhotoURL }}
                                style={styles.avatarImage}
                              />
                            ) : (
                              <View style={[styles.avatarPlaceholder, { backgroundColor: review.reviewerAvatarBgColor }]}>
                                <Text style={styles.avatarText}>
                                  {review.reviewerName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.reviewerDetails}>
                            <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                            <View style={styles.roleBadge}>
                              <Ionicons
                                name={review.role === 'Driver' ? 'car' : 'person'}
                                size={12}
                                color={review.role === 'Driver' ? colors.accent : colors.secondary}
                              />
                              <Text style={[
                                styles.roleText,
                                { color: review.role === 'Driver' ? colors.accent : colors.secondary }
                              ]}>
                                Reviewed as {review.role}
                              </Text>
                            </View>
                            <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                          </View>
                        </View>
                        {renderStars(review.rating)}
                      </View>

                      {/* Review Description */}
                      {review.description ? (
                        <Text style={styles.reviewDescription}>{review.description}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  averageSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  averageStars: {
    marginVertical: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalBody: {
    maxHeight: '60%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
