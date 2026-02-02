import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  getTitle,
  getSubtitle,
} from '../../../src/utils/messaging'
import { auth, db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';
import { Ionicons } from '@expo/vector-icons';
import NavBar from '../../../app/components/nav-bar';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatRideDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderConversation = ({ item }) => {
    const hasMessages = item.hasMessages || item.lastMessage;

    const myUid = auth.currentUser?.uid;
    const lastReadAt = myUid ? item.lastReadAt?.[myUid] : null;

    const lastReadDate = lastReadAt?.toDate ? lastReadAt.toDate() : (lastReadAt ? new Date(lastReadAt) : null);
    const lastMsgDate = item.lastMessageTime?.toDate ? item.lastMessageTime.toDate() : (item.lastMessageTime ? new Date(item.lastMessageTime) : null);

    const title = getTitle(item, myUid);
    const subtitle = getSubtitle(item);

    const isUnread =
      !!item.lastMessage &&
      item.lastMessageSenderId !== myUid &&
      (!lastReadDate || (lastMsgDate && lastMsgDate > lastReadDate));

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/messages/chat',
            params: { conversationId: item.id },
          })
        }
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {title.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, isUnread && styles.unreadText]}>
              {title}
            </Text>
            {hasMessages && (
              <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>
            )}
          </View>

          {subtitle ? (
            <Text style={styles.groupSubtitle}>{subtitle}</Text>
          ) : null}

          {/* Ride info badge */}
          {item.rideInfo && (
            <View style={styles.rideBadge}>
              <Ionicons name="car-outline" size={12} color={colors.accent} />
              <Text style={styles.rideBadgeText}>
                {item.rideInfo} • {formatRideDate(item.rideDate)}
              </Text>
            </View>
          )}

          {/* Message preview or prompt */}
          {hasMessages ? (
            <Text
              style={[styles.lastMessage, isUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessageSenderId === auth.currentUser?.uid ? 'You: ' : ''}
              {item.lastMessage}
            </Text>
          ) : (
            <View style={styles.startChatPrompt}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.accent} />
              <Text style={styles.startChatText}>Tap to start a conversation</Text>
            </View>
          )}
        </View>

        {/* Unread indicator */}
        {isUnread && <View style={styles.unreadDot} />}
        
        {/* Arrow for new conversations */}
        {!hasMessages && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <NavBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={60} color={colors.border} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Join a ride to start messaging with hosts
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }
          ]}
        />
      )}

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  groupSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rideBadgeText: {
    fontSize: 12,
    color: colors.accent,
    marginLeft: 4,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unreadText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  startChatPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  startChatText: {
    fontSize: 14,
    color: colors.accent,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 88,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});