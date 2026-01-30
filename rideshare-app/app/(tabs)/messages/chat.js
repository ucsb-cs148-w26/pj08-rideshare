import { useRef, useCallback, useEffect, useState } from 'react';
import { setTypingStatus } from '../../../src/utils/messaging';
import TypingIndicator from '../../../app/components/typingIndicator';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationData, setConversationData] = useState(null);
  const [otherUserName, setOtherUserName] = useState('');
  const flatListRef = useRef(null);
  const [otherUserId, setOtherUserId] = useState('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const safetyTimeoutRef = useRef(null);

  useEffect(() => {
        if (!conversationId) return;

        const convoRef = doc(db, 'conversations', conversationId);
        const unsubscribeConvo = onSnapshot(convoRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setConversationData(data);

                const otherUid = data.participants.find(
                    (id) => id !== auth.currentUser?.uid
                );
                setOtherUserId(otherUid);
                setOtherUserName(data.participantNames?.[otherUid] || 'Unknown');

                setIsOtherUserTyping(data.typing?.[otherUid] || false);
            }
        });

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(msgs);
            setLoading(false);
            markMessagesAsRead();
        });

        return () => {
            unsubscribeConvo();
            unsubscribeMessages();

            if (safetyTimeoutRef.current) {
                clearTimeout(safetyTimeoutRef.current);
            }

            setTypingStatus(conversationId, false);
            isTypingRef.current = false;
        };
    }, [conversationId]);


    const handleTextChange = useCallback((text) => {
        setNewMessage(text);

        const hasText = text.trim().length > 0;

        if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
        }

        if (hasText) {
            if (!isTypingRef.current) {
                setTypingStatus(conversationId, true);
                isTypingRef.current = true;
            }

            safetyTimeoutRef.current = setTimeout(() => {
                setTypingStatus(conversationId, false);
                isTypingRef.current = false;
            }, 1000); 

        } else {
            if (isTypingRef.current) {
                setTypingStatus(conversationId, false);
                isTypingRef.current = false;
            }
        }
    }, [conversationId]);

  const markMessagesAsRead = async () => {
    try {
      const convoRef = doc(db, 'conversations', conversationId);
      const convoDoc = await getDoc(convoRef);
      if (convoDoc.exists()) {
        const data = convoDoc.data();
        if (data.lastMessageSenderId !== auth.currentUser?.uid) {
          await updateDoc(convoRef, { lastMessageRead: true });
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      setSending(true);
      setTypingStatus(conversationId, false);
      const trimmedMessage = newMessage.trim();
      setNewMessage('');

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : 'Unknown';

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        text: trimmedMessage,
        senderId: user.uid,
        senderName: userName,
        createdAt: serverTimestamp(),
        read: false,
      });

      const convoRef = doc(db, 'conversations', conversationId);
      await updateDoc(convoRef, {
        lastMessage: trimmedMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: user.uid,
        lastMessageRead: false,
        hasMessages: true,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(newMessage);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRideDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === auth.currentUser?.uid;
    const showDate = shouldShowDate(index);

    return (
      <>
        {showDate && (
          <Text style={styles.dateHeader}>{formatDateHeader(item.createdAt)}</Text>
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </>
    );
  };

  const shouldShowDate = (index) => {
    if (index === 0) return true;
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    if (!currentMsg.createdAt || !prevMsg.createdAt) return false;

    const currentDate = currentMsg.createdAt.toDate
      ? currentMsg.createdAt.toDate()
      : new Date(currentMsg.createdAt);
    const prevDate = prevMsg.createdAt.toDate
      ? prevMsg.createdAt.toDate()
      : new Date(prevMsg.createdAt);

    return currentDate.toDateString() !== prevDate.toDateString();
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <View style={styles.emptyChatCard}>
        <View style={styles.emptyChatAvatar}>
          <Text style={styles.emptyChatAvatarText}>
            {otherUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.emptyChatName}>{otherUserName}</Text>
        
        {conversationData?.rideInfo && (
          <View style={styles.rideInfoCard}>
            <Ionicons name="car" size={20} color={colors.primary} />
            <View style={styles.rideInfoContent}>
              <Text style={styles.rideInfoRoute}>{conversationData.rideInfo}</Text>
              <Text style={styles.rideInfoDate}>
                {formatRideDate(conversationData.rideDate)}
              </Text>
            </View>
          </View>
        )}
        
        <Text style={styles.emptyChatPrompt}>
          Say hello and coordinate your ride details! 👋
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {otherUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUserName}</Text>
          {conversationData?.rideInfo && (
            <Text style={styles.headerRide} numberOfLines={1}>
              {conversationData.rideInfo}
            </Text>
          )}
        </View>
      </View>

      {/* Messages or Empty State */}
      {messages.length === 0 ? (
        renderEmptyChat()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isOtherUserTyping ? <TypingIndicator userName={otherUserName} /> : null
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          value={newMessage}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() && !sending ? '#fff' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRide: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeader: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginVertical: 16,
  },
  messageContainer: {
    maxWidth: '75%',
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: colors.textSecondary,
  },
  // Empty chat styles
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyChatCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyChatAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChatAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  emptyChatName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  rideInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  rideInfoContent: {
    marginLeft: 12,
  },
  rideInfoRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rideInfoDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyChatPrompt: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Input styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});