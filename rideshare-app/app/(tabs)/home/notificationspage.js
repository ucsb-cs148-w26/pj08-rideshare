import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../src/firebase";
import { colors } from "../../../ui/styles/colors";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const myUid = auth.currentUser?.uid;

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

  const iconForType = (type) => {
    switch (type) {
      case "ride_cancelled":
        return "close-circle-outline";
      case "ride_left":
        return "refresh-outline";
      case "ride_joined":
        return "person-add-outline";
      default:
        return "notifications-outline";
    }
  };

  const onPressNotification = async (item) => {
    // Mark read (best-effort)
    try {
      if (item?.id && !item.readAt) {
        await updateDoc(doc(db, "notifications", item.id), {
          readAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Failed to mark notification read:", e);
    }

    // if notification has rideId -> open some ride details screen
    // (this will need to be adjusted)
    if (item.rideId) {
      router.push({
        pathname: "/(tabs)/home/index",
        params: { highlightRideId: item.rideId },
      });
      return;
    }

  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.readAt;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPressNotification(item)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
          <Ionicons
            name={iconForType(item.type)}
            size={22}
            color={colors.white}
          />
        </View>

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

          {!!item.body && (
            <Text
              style={[styles.bodyText, isUnread && styles.unreadText]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
          )}

          {/* car outline placeholder */}
          {item.rideInfo && (
            <View style={styles.badge}>
              <Ionicons name="car-outline" size={12} color={colors.accent} />
              <Text style={styles.badgeText}>{item.rideInfo}</Text>
            </View>
          )}
        </View>

        {/* Unread dot */}
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
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

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarUnread: {
    borderWidth: 2,
    borderColor: colors.accent,
  },

  content: { flex: 1 },

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
    color: colors.textPrimary,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    color: colors.accent,
    marginLeft: 4,
    fontWeight: "500",
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
});