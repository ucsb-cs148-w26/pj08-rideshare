import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../src/firebase";
import { colors } from "../../../ui/styles/colors";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNotifications(items);
        setLoading(false);
      },
      (err) => {
        console.error("notifications onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const onPressNotification = async (item) => {
    // mark as read
    try {
      if (item?.id && !item.readAt) {
        await updateDoc(doc(db, "notifications", item.id), {
          readAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Failed to mark notification read:", e);
    }

    // always shows modal, contents will depend on why type of notif
    setSelectedNotif(item);
    setDetailsModalVisible(true);

  };

  const renderNotifDetails = (n) => {
    if (!n) return null;

    switch (n.type) {
      // riders ride was cancelled
      case "ride_cancelled":
        return (
          <>
            <Text style={styles.modalSectionTitle}>Ride Details</Text>

            <View style={styles.modalSection}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>From:</Text>
                <Text style={styles.modalInfoValue}>
                  {n.fromAddress || "Not available"}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>To:</Text>
                <Text style={styles.modalInfoValue}>
                  {n.toAddress || "Not available"}
                </Text>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>Cancellation Note</Text>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                {n.body?.trim() || "No cancellation note provided."}
              </Text>
            </View>
          </>
        );

      // rider left ride (semi-placeholder, this will likely be edited once this notification type is implemented)
      case "ride_left":
        return (
          <>
            <Text style={styles.modalSectionTitle}>Update</Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{n.body || "A rider left the ride."}</Text>
            </View>
          </>
        );

      // rider joined ride (semi-placeholder, this will likely be edited once this notification type is implemented)
      case "ride_joined":
        return (
          <>
            <Text style={styles.modalSectionTitle}>Update</Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{n.body || "A rider joined the ride."}</Text>
            </View>
          </>
        );

      default:
        // fallback for any future notification
        return (
          <>
            <Text style={styles.modalSectionTitle}>Message</Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                {n.body?.trim() ? n.body : "No additional details."}
              </Text>
            </View>
          </>
        );
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.readAt;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.swipeContainer}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => onPressNotification(item)}
            activeOpacity={0.8}
          >

            {/* Blue strip on the left of notif box*/}
            <View style={styles.leftStrip}/>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={[styles.titleText, isUnread && styles.unreadText]} numberOfLines={1}>
                  {item.title || "Notification"}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>

              <Text
                style={[
                  styles.bodyText,
                  styles.linkText
                ]}
              >
                Click to view more details
              </Text>
            </View>

            {/* Unread dot */}
            {isUnread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  const renderRightActions = (item) => {
    return (
      <View style={styles.rightActions}>
        <RectButton
          style={styles.deleteAction}
          onPress={() => deleteNotification(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </RectButton>
      </View>
    );
  };

  const deleteNotification = async (id) => {
    if (!id) return;

    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Notifications</Text>
      {/* Notification Details Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedNotif && (
              <ScrollView style={styles.modalScrollContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>
                      {selectedNotif.title || "Notification"}
                    </Text>
                  </View>
                </View>

                {/* Type-specific content */}
                {renderNotifDetails(selectedNotif)}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={60} color={colors.border} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            Ride updates like cancellations and changes will show up here
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === "ios" ? 108 : 80 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  content: { 
    flex: 1 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    gap: 12,
  },
  titleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadText: {
    fontWeight: "700",
    color: colors.primary,
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
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  linkText: {
    color: colors.accent,
    fontWeight: "500",
  },
  swipeContainer: {
    backgroundColor: "#fff",
  },
  row: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rightActions: {
    width: 96,
    justifyContent: "center",
    alignItems: "stretch",
  },
  deleteAction: {
    flex: 1,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  // modal styles, similar to ones used in homepage - might want to move to commonStyles later for better practice
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    marginTop: 28,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  noteBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontWeight: "700",
    color: colors.textPrimary,
    marginRight: 8,
    flexShrink: 0,
  },
  modalInfoValue: {
    flex: 1,
    textAlign: "right",
    color: colors.textSecondary,
  },
  leftStrip: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    marginRight: 12,
    borderRadius: 2,
  },
});