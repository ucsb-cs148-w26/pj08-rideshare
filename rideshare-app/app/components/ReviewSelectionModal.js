import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../ui/styles/colors';
import DefaultAvatar from './DefaultAvatar';

/**
 * Modal for selecting which participant to review
 * Shows list of all participants with their roles (driver/rider)
 */
export default function ReviewSelectionModal({
  visible,
  onClose,
  participants,
  hostId,
  onSelectParticipant,
}) {
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
            <Text style={styles.modalTitle}>Select Person to Review</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Participants List */}
          <ScrollView style={styles.modalBody}>
            {participants.map((participant) => {
              const isDriver = participant.id === hostId;
              return (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.participantCard}
                  onPress={() => onSelectParticipant(participant)}
                >
                  {/* Profile Picture */}
                  <View style={styles.participantAvatar}>
                    {participant.photoURL ? (
                      <Image source={{ uri: participant.photoURL }} style={styles.avatarImage} />
                    ) : (
                      <DefaultAvatar
                        size={50}
                        bgColor={participant.avatarBgColor || '#4A90E270'}
                        avatarType={participant.avatarPreset || 'default'}
                      />
                    )}
                  </View>

                  {/* Participant Info */}
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <View style={styles.roleBadge}>
                      <Ionicons
                        name={isDriver ? 'car' : 'person'}
                        size={14}
                        color={isDriver ? colors.accent : colors.secondary}
                      />
                      <Text style={[
                        styles.roleText,
                        { color: isDriver ? colors.accent : colors.secondary }
                      ]}>
                        {isDriver ? 'Driver' : 'Rider'}
                      </Text>
                    </View>
                  </View>

                  {/* Select Arrow */}
                  <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    maxHeight: '70%',
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
  modalBody: {
    maxHeight: '85%',
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
