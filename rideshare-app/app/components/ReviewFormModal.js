import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../ui/styles/colors';
import DefaultAvatar from './DefaultAvatar';

/**
 * Modal for submitting a review with star rating and description
 */
export default function ReviewFormModal({
  visible,
  onClose,
  participant,
  onSubmit,
  isSubmitting,
}) {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a star rating');
      return;
    }
    await onSubmit({ rating, description });
    // Reset form
    setRating(0);
    setDescription('');
  };

  const handleClose = () => {
    setRating(0);
    setDescription('');
    onClose();
  };

  if (!participant) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => {
            Keyboard.dismiss();
            handleClose();
          }}
        >
          <Pressable 
            style={styles.modalContent} 
            onPress={(e) => {
              e.stopPropagation();
              Keyboard.dismiss();
            }}
          >
            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Write Review</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Participant Info */}
              <View style={styles.participantSection}>
                <View style={styles.participantAvatar}>
                  {participant.photoURL ? (
                    <Image source={{ uri: participant.photoURL }} style={styles.avatarImage} />
                  ) : (
                    <DefaultAvatar
                      size={60}
                      bgColor={participant.avatarBgColor || '#4A90E270'}
                      avatarType={participant.avatarPreset || 'default'}
                    />
                  )}
                </View>
                <Text style={styles.participantName}>{participant.name}</Text>
              </View>

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.sectionLabel}>Rating</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>Comment (Optional)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Share your experience..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, (rating === 0 || isSubmitting) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
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
  participantSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  participantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  participantName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ratingSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
