import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
  Image,
} from "react-native";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../src/firebase";
import { useStripe } from "@stripe/stripe-react-native";
import { db } from "../../../src/firebase";
import { useAuth } from "../../../src/auth/AuthProvider";
import { colors } from "../../../ui/styles/colors";
import { commonStyles } from "../../../ui/styles/commonStyles";
import { getOrCreateRideConversation } from '../../../src/utils/messaging';
import STRIPE_CONFIG from "../../../src/stripeConfig";
import AddressAutocomplete from "../../components/AddressAutocomplete";
import DefaultAvatar from "../../components/DefaultAvatar";

export default function JoinPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const tagOptions = [
    "Groceries/Shopping",
    "Downtown",
    "Going Home/Far",
    "SBA",
    "LAX",
    "Amtrak Station",
    "Other",
  ];
  
  const tagColors = {
    "Downtown": "#e11d48",
    "Groceries/Shopping": "#f97316",
    "SBA": "#efdf70",
    "LAX": "#10b981",
    "Amtrak Station": "#0ea5e9",
    "Going Home/Far": "#6366f1",
    "Other": "#ff1493",
  };

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRide, setSelectedRide] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmRide, setConfirmRide] = useState(null);
  const [showCancellationWarning, setShowCancellationWarning] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [joinedRideIds, setJoinedRideIds] = useState(new Set());
  const [joinedLoaded, setJoinedLoaded] = useState(false);
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [locationQuery, setLocationQuery] = useState("");
  const [submittedLocationQuery, setSubmittedLocationQuery] = useState("");
  const [searchInputVersion, setSearchInputVersion] = useState(0);
  const reopenModalRef = useRef(false);

  const [ownerPhotos, setOwnerPhotos] = useState({});
  const [ownerBgColors, setOwnerBgColors] = useState({});
  const [ownerAvatarPresets, setOwnerAvatarPresets] = useState({});
  const ownerCacheRef = useRef(new Set());
  const [waitlistedRideIds, setWaitlistedRideIds] = useState(new Set());
  const [waitlistPositions, setWaitlistPositions] = useState({});
  const [waitlistModalVisible, setWaitlistModalVisible] = useState(false);
  const [waitlistModalRide, setWaitlistModalRide] = useState(null);
  const [waitlistConfirmVisible, setWaitlistConfirmVisible] = useState(false);
  const [waitlistConfirmRide, setWaitlistConfirmRide] = useState(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  const openWaitlistModal = (ride) => {
    setWaitlistModalRide(ride);
    setWaitlistModalVisible(true);
  };

  const closeWaitlistModal = () => {
    setWaitlistModalVisible(false);
    setTimeout(() => setWaitlistModalRide(null), 300);
  };

  const openWaitlistConfirm = (ride) => {
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to join the waitlist.");
      return;
    }
    if (joinedRideIds.has(ride.id)) return;
    if (isDepartureTooSoon(ride)) {
      Alert.alert("Too Late", "You cannot join the waitlist within 24 hours of departure.");
      return;
    }
    setWaitlistConfirmRide(ride);
    setWaitlistConfirmVisible(true);
  };

  const closeWaitlistConfirm = () => {
    setWaitlistConfirmVisible(false);
    setWaitlistConfirmRide(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (reopenModalRef.current) {
        reopenModalRef.current = false;
        setModalVisible(true);
      }
    }, [])
  );

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const ridesQuery = query(collection(db, "rides"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      ridesQuery,
      (snapshot) => {
        const ridesData = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              ownerName: (data.ownerName ?? "Unknown Driver").toString(),
            };
          })
          .filter(
            (ride) =>
              ride.ownerId !== user.uid &&
              ride.status !== "cancelled" &&
              ride.status !== "canceled" &&
              ride.status !== "started" &&
              ride.status !== "completed" &&
              new Date(ride.rideDate).getTime() > Date.now()
          );

        setRides(ridesData);

        const uncachedIds = [
          ...new Set(
            ridesData
              .map((r) => r.ownerId)
              .filter((id) => id && !ownerCacheRef.current.has(id))
          ),
        ];

        if (uncachedIds.length > 0) {
          uncachedIds.forEach((id) => ownerCacheRef.current.add(id));

          Promise.all(
            uncachedIds.map((id) => getDoc(doc(db, 'users', id)))
          ).then((snapshots) => {
            const photos = {};
            const bgColors = {};
            const presets = {};
            snapshots.forEach((snap, i) => {
              if (snap.exists()) {
                const d = snap.data();
                photos[uncachedIds[i]] = d.photoURL || null;
                bgColors[uncachedIds[i]] = d.avatarBgColor || '#FFFFFF';
                presets[uncachedIds[i]] = d.avatarPreset || 'default';
              }
            });
            setOwnerPhotos((prev) => ({ ...prev, ...photos }));
            setOwnerBgColors((prev) => ({ ...prev, ...bgColors }));
            setOwnerAvatarPresets((prev) => ({ ...prev, ...presets }));
          });
        }

        setLoading(false);
      },
      (err) => {
        console.error("rides onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setJoinedRideIds(new Set());
      setJoinedLoaded(true);
      return;
    }

    const unsub = onSnapshot(collection(db, "rides"), async (snap) => {
      try {
        const ids = new Set();

        await Promise.all(
          snap.docs.map(async (rideDoc) => {
            const rideId = rideDoc.id;
            const joinSnap = await getDoc(doc(db, "rides", rideId, "joins", user.uid));
            if (joinSnap.exists()) ids.add(rideId);
          })
        );

        setJoinedRideIds(ids);
      } catch (e) {
        console.warn("Failed to compute joinedRideIds:", e?.message ?? e);
        setJoinedRideIds(new Set());
      } finally {
        setJoinedLoaded(true);
      }
    });

    return () => unsub();
  }, [user?.uid]);

  // Track waitlisted rides and positions
  useEffect(() => {
    if (!user?.uid) {
      setWaitlistedRideIds(new Set());
      setWaitlistPositions({});
      return;
    }

    const unsub2 = onSnapshot(collection(db, "rides"), async (snap) => {
      try {
        const ids = new Set();
        const positions = {};

        await Promise.all(
          snap.docs.map(async (rideDoc) => {
            const rideId = rideDoc.id;
            const waitlistSnap = await getDoc(doc(db, "rides", rideId, "waitlist", user.uid));
            if (waitlistSnap.exists()) {
              ids.add(rideId);
              // Compute position by counting how many waitlist entries have an earlier joinedAt
              const allWaitlistSnap = await getDocs(
                query(collection(db, "rides", rideId, "waitlist"), orderBy("joinedAt", "asc"))
              );
              const allWaitlist = allWaitlistSnap.docs.map((d) => d.id);
              const pos = allWaitlist.indexOf(user.uid);
              positions[rideId] = pos >= 0 ? pos + 1 : null;
            }
          })
        );

        setWaitlistedRideIds(ids);
        setWaitlistPositions(positions);
      } catch (e) {
        console.warn("Failed to compute waitlist info:", e?.message ?? e);
      }
    });

    return () => unsub2();
  }, [user?.uid]);

  const fetchRides = async () => {
    try {
      setLoading(true);

      const ridesQuery = query(collection(db, "rides"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(ridesQuery);

      const ridesData = [];
      for (const rideDoc of querySnapshot.docs) {
        const ride = { id: rideDoc.id, ...rideDoc.data() };
        if (
          ride.ownerId !== user?.uid &&
          ride.status !== "cancelled" &&
          ride.status !== "canceled" &&
          ride.status !== "started" &&
          ride.status !== "completed" &&
          new Date(ride.rideDate).getTime() > Date.now()
        ) {
          ridesData.push({
            ...ride,
            ownerName: (ride.ownerName ?? "Unknown Driver").toString(),
          });
        }
      }

      setRides(ridesData);
    } catch (error) {
      console.error("Error fetching rides:", error);
      Alert.alert("Error", "Failed to load available rides. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "Not provided";
    const cleaned = String(phoneNumber).replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  };

  const handleRidePress = async (ride) => {
    setSelectedRide(ride);
    setModalVisible(true);
    
    // Fetch driver info from Firestore
    try {
      const driverDoc = await getDoc(doc(db, "users", ride.ownerId));
      if (driverDoc.exists()) {
        setDriverInfo(driverDoc.data());
      }
    } catch (error) {
      console.error("Error fetching driver info:", error);
    }
  };

  const closeJoinConfirm = () => {
    setConfirmVisible(false);
    setConfirmRide(null);
    setShowCancellationWarning(false);
  };

  const toggleTagFilter = (tag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSelectedTags(new Set());
    setLocationQuery("");
    setSubmittedLocationQuery("");
    setSearchInputVersion((prev) => prev + 1);
  };

  const normalizeAddress = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const applyLocationSearch = () => {
    setSubmittedLocationQuery(locationQuery.trim());
  };

  const handleLocationSelected = (selectedAddress) => {
    const fullAddress = String(
      selectedAddress?.fullAddress || selectedAddress || ""
    );
    setLocationQuery(fullAddress);
    setSubmittedLocationQuery(fullAddress.trim());
  };

  const getRideLocationLabel = (ride, field) => {
    if (field === "to") {
      return String(ride?.toLabel || ride?.toAddress || "");
    }
    return String(ride?.fromLabel || ride?.fromAddress || "");
  };

  const getFilteredRides = () => {
    const normalizedSearch = normalizeAddress(submittedLocationQuery);

    return rides.filter((ride) => {
      const matchesTag =
        selectedTags.size === 0 || selectedTags.has(ride.tag);

      if (!matchesTag) return false;
      if (!normalizedSearch) return true;

      const normalizedToAddress = normalizeAddress(ride.toAddress);
      return normalizedToAddress.includes(normalizedSearch);
    });
  };

  const isFilteringActive =
    selectedTags.size > 0 || normalizeAddress(submittedLocationQuery).length > 0;

  const toNumber = (v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
  };

  const isDepartureTooSoon = (ride) => {
    if (!ride?.rideDate) return false;
    const departure = new Date(ride.rideDate).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return departure - now < twentyFourHours;
  };

  const handleJoinWaitlist = async (ride) => {
    if (!user?.uid) return;
    try {
      setIsJoiningWaitlist(true);

      const waitlistRef = doc(db, "rides", ride.id, "waitlist", user.uid);
      const existing = await getDoc(waitlistRef);
      if (existing.exists()) {
        closeWaitlistConfirm();
        return;
      }

      const createWaitlistHold = httpsCallable(functions, "createWaitlistHold");
      const { data } = await createWaitlistHold({
        amount: Math.round(Number(ride.price) * 100),
        rideId: ride.id,
      });
      const { clientSecret, paymentIntentId } = data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: STRIPE_CONFIG.MERCHANT_NAME,
        paymentIntentClientSecret: clientSecret,
      });

      if (initError) throw new Error(initError.message);

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === "Canceled") {
          setIsJoiningWaitlist(false);
          return;
        }
        throw new Error(paymentError.message);
      }

      await setDoc(waitlistRef, {
        riderId: user.uid,
        riderEmail: user.email ?? "",
        joinedAt: serverTimestamp(),
        paymentIntentId: paymentIntentId,
      });
      setWaitlistedRideIds((prev) => new Set(prev).add(ride.id));
      const allWaitlistSnap = await getDocs(collection(db, "rides", ride.id, "waitlist"));
      const sorted = allWaitlistSnap.docs
        .sort((a, b) => (a.data().joinedAt?.toMillis?.() ?? 0) - (b.data().joinedAt?.toMillis?.() ?? 0))
        .map((d) => d.id);
      const pos = sorted.indexOf(user.uid);
      setWaitlistPositions((prev) => ({ ...prev, [ride.id]: pos >= 0 ? pos + 1 : 1 }));
      closeWaitlistConfirm();
    } catch (e) {
      console.error("waitlist error:", e);
      Alert.alert("Error", e?.message || "Could not join waitlist.");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const handleLeaveWaitlist = async (ride) => {
    try {
      const waitlistRef = doc(db, "rides", ride.id, "waitlist", user.uid);
      const waitlistSnap = await getDoc(waitlistRef);
      const paymentIntentId = waitlistSnap.exists() ? waitlistSnap.data().paymentIntentId : null;

      await deleteDoc(waitlistRef);

      if (paymentIntentId) {
        try {
          const cancelWaitlistHold = httpsCallable(functions, "cancelWaitlistHold");
          await cancelWaitlistHold({ paymentIntentId });
        } catch (cancelErr) {
          console.warn("Failed to cancel hold:", cancelErr?.message);
        }
      }

      setWaitlistedRideIds((prev) => {
        const next = new Set(prev);
        next.delete(ride.id);
        return next;
      });
      setWaitlistPositions((prev) => {
        const next = { ...prev };
        delete next[ride.id];
        return next;
      });
    } catch (e) {
      console.error("leave waitlist error:", e);
      Alert.alert("Error", e?.message || "Could not leave waitlist.");
    }
  };

  const openJoinConfirm = (ride) => {
    const alreadyJoined = joinedRideIds.has(ride.id);
    const soldOut = Number(ride.seats) <= 0;

    if (alreadyJoined) {
      Alert.alert("Already joined", "You already joined this ride.");
      return;
    }
    if (soldOut) {
      // Don't show "Sold out" alert — waitlist button handles this
      return;
    }

    setConfirmRide(ride);
    setShowCancellationWarning(false);
    setConfirmVisible(true);
  };

  const openCancellationWarning = () => {
    setShowCancellationWarning(true);
  };

  const backToConfirmDetails = () => {
    setShowCancellationWarning(false);
  };

  const handleConfirmJoin = async () => {
    if (!confirmRide) return;
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please sign in to join a ride.");
      return;
    }

    try {
      setIsJoining(true);
      await user.getIdToken(true);

      const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
      const { data } = await createPaymentIntent({
        amount: Math.round(Number(confirmRide.price) * 100), // convert dollars to cents
        rideId: confirmRide.id,
      });
      const { clientSecret, paymentIntentId } = data;

      // Initialize the Stripe Payment Sheet 
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: STRIPE_CONFIG.MERCHANT_NAME,
        paymentIntentClientSecret: clientSecret,

        // enable apple pay and google pay later when app is deployed
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present the Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // User cancelled or payment failed — don't join the ride
        if (paymentError.code === "Canceled") {
          // User tapped outside or pressed "X" — silent cancel
          setIsJoining(false);
          return;
        }
        throw new Error(paymentError.message);
      }

      // Payment succeeded - call Cloud Function to securely handle the DB writes and PIN generation
      const finalizeJoinRide = httpsCallable(functions, "finalizeJoinRide");
      await finalizeJoinRide({
        rideId: confirmRide.id,
        paymentIntentId: paymentIntentId,
      });

      // Create conversation with the host after successful join
      try {
        await getOrCreateRideConversation({
          rideId: confirmRide.id,
          ownerId: confirmRide.ownerId,
          rideInfo: `${confirmRide.fromAddress} → ${confirmRide.toAddress}`,
          rideDate: confirmRide.rideDate,
        });
      } catch (convoError) {
        console.error("Error creating conversation:", convoError);
        // Don't block the join flow if conversation creation fails
      }

      closeJoinConfirm();
      Alert.alert(
        "Ride Joined!",
        "Payment successful! You can now message everyone in this ride from your Messages tab.",
        [{ text: "OK", onPress: () => router.push("/(tabs)/home") }]
      );
    } catch (e) {
      const msg = e?.message ?? "";
      if (msg.toLowerCase().includes("already joined")) {
        closeJoinConfirm();
        Alert.alert("Already joined", "You already joined this ride.");
        return;
      }
      if (msg.toLowerCase().includes("unauthenticated") || e?.code === "functions/unauthenticated") {
        closeJoinConfirm();
        Alert.alert("Session Expired", "Please sign in again to join a ride.");
        return;
      }
      console.error("join error:", e);
      Alert.alert("Error", msg || "Could not join ride.");
    } finally {
      setIsJoining(false);
    }
  };

  const renderRideCard = ({ item }) => {
    const alreadyJoined = joinedRideIds.has(item.id);
    const soldOut = Number(item.seats) <= 0;
    const onWaitlist = waitlistedRideIds.has(item.id);
    const disabled = alreadyJoined || (soldOut && !onWaitlist);
    const tagColor = item.tag ? tagColors[item.tag] : null;
    const tooSoon = isDepartureTooSoon(item);

    return (
      <TouchableOpacity
        style={[styles.rideCard, (alreadyJoined || soldOut) && styles.rideCardDisabled]}
        onPress={() => handleRidePress(item)}
        activeOpacity={0.85}
      >
        {/* Tag Color Box and Top row: Driver name and Price */}
        <View style={styles.cardTopRow}>
          <View style={styles.driverNameSection}>
            {tagColor && (
              <View style={[styles.tagBox, { backgroundColor: tagColor }]} />
            )}
            <View style={[styles.driverIcon, disabled && styles.driverIconDisabled]}>
              {ownerPhotos[item.ownerId] ? (
                <Image
                  source={{ uri: ownerPhotos[item.ownerId] }}
                  style={{ width: 45, height: 45, borderRadius: 22.5 }}
                />
              ) : (
                <DefaultAvatar size={45} bgColor={ownerBgColors[item.ownerId] || '#FFFFFF'} avatarType={ownerAvatarPresets[item.ownerId] || 'default'} />
              )}
            </View>
            <Text 
              style={[styles.driverName, disabled && styles.textDisabled]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.ownerName}
            </Text>
          </View>
          <Text style={[styles.ridePrice, disabled && styles.priceDisabled]}>${item.price}</Text>
        </View>

        {/* Main content row */}
        <View style={styles.cardMainRow}>
          {/* Left side: When and Cap */}
          <View style={styles.leftInfo}>
            <View style={styles.whenSection}>
              <Text style={[styles.label, disabled && styles.textDisabled]}>When:</Text>
              <Text style={[styles.dateText, disabled && styles.textDisabled]}>
                {formatDate(item.rideDate)}
              </Text>
              <Text style={[styles.timeText, disabled && styles.textDisabled]}>
                {formatTime(item.rideDate)}
              </Text>
            </View>
            <Text style={[styles.capacityText, disabled && styles.textDisabled]}>
              {Number(item.total_seats ?? item.seats) - Number(item.seats)}/{Number(item.total_seats ?? item.seats)} seats taken
            </Text>
          </View>

          {/* Right side: To and From */}
          <View style={styles.rightInfo}>
            <View style={styles.destinationRow}>
              <Text style={[styles.destinationLabel, disabled && styles.textDisabled]}>To:</Text>
              <Text style={[styles.destinationValue, disabled && styles.textDisabled]}>
                {getRideLocationLabel(item, "to")}
              </Text>
            </View>
            <View style={styles.destinationRow}>
              <Text style={[styles.destinationLabel, disabled && styles.textDisabled]}>From:</Text>
              <Text style={[styles.destinationValue, disabled && styles.textDisabled]}>
                {getRideLocationLabel(item, "from")}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom row: View details and JOIN/JOINED/WAITLIST button */}
        <View style={styles.cardBottomRow}>
          <TouchableOpacity
            style={[styles.viewDetailsButton, (alreadyJoined) && styles.viewDetailsButtonDisabled]}
            onPress={() => handleRidePress(item)}
            activeOpacity={0.85}
          >
            <Text style={[styles.viewDetailsButtonText, (alreadyJoined) && styles.textDisabled]}>
              View Details
            </Text>
          </TouchableOpacity>

          <View style={styles.waitlistButtonGroup}>
            {alreadyJoined ? (
              <TouchableOpacity
                style={[styles.joinButton, styles.joinButtonDisabled]}
                disabled
                activeOpacity={0.85}
              >
                <Text style={[styles.joinButtonText, styles.joinButtonTextDisabled]}>Joined</Text>
              </TouchableOpacity>
            ) : soldOut && joinedLoaded ? (
              onWaitlist ? (
                <TouchableOpacity
                  style={[styles.joinButton, styles.waitlistActiveButton]}
                  onPress={() => openWaitlistModal(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.waitlistedInner}>
                    <Text style={styles.waitlistActiveButtonText}>Waitlisted</Text>
                    <Text style={styles.waitlistInlineInfo}>ⓘ</Text>
                  </View>
                </TouchableOpacity>
              ) : !tooSoon ? (
                <TouchableOpacity
                  style={[styles.joinButton, styles.waitlistButton]}
                  onPress={() => openWaitlistConfirm(item)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.joinButtonText, styles.waitlistButtonText]}>
                    Join Waitlist
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.joinButton, styles.joinButtonDisabled]}
                  disabled
                  activeOpacity={0.85}
                >
                  <Text style={[styles.joinButtonText, styles.joinButtonTextDisabled]}>Sold Out</Text>
                </TouchableOpacity>
              )
            ) : soldOut && !joinedLoaded ? (
              <TouchableOpacity
                style={[styles.joinButton, styles.joinButtonDisabled]}
                disabled
                activeOpacity={0.85}
              >
                <Text style={[styles.joinButtonText, styles.joinButtonTextDisabled]}>...</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => openJoinConfirm(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No available rides at the moment</Text>
      <Text style={styles.emptyStateSubtext}>Check back later or host a ride!</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={{ paddingRight: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '600', color: colors.white }}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center' }]}>Available Rides</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchAutocompleteWrap}>
            <AddressAutocomplete
              key={`join-search-${searchInputVersion}`}
              value={locationQuery}
              onChangeText={setLocationQuery}
              placeholder="Enter destination"
              inputStyle={styles.searchInput}
              onSubmitEditing={applyLocationSearch}
              onAddressSelected={handleLocationSelected}
            />
          </View>
        </View>

        <View style={styles.controlsRow}>
          {isFilteringActive ? (
            <TouchableOpacity style={[styles.controlButton, styles.viewAllButton]} onPress={clearFilters}>
              <Text style={styles.viewAllButtonText}>View all rides</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity style={[styles.controlButton, styles.filterButton]} onPress={() => setShowFilterModal(true)}>
            <Text style={styles.filterButtonText}>Filter ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Rides List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading available rides...</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredRides()}
            renderItem={renderRideCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshing={loading}
            onRefresh={fetchRides}
          />
        )}

        {/* Waitlist Confirm Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={waitlistConfirmVisible}
          onRequestClose={closeWaitlistConfirm}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Join Waitlist</Text>

              {waitlistConfirmRide && (
                <>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Driver</Text>
                    <Text style={styles.confirmValue}>{waitlistConfirmRide.ownerName}</Text>
                  </View>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>When</Text>
                    <Text style={styles.confirmValue}>
                      {formatDate(waitlistConfirmRide.rideDate)} • {formatTime(waitlistConfirmRide.rideDate)}
                    </Text>
                  </View>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>From</Text>
                    <Text style={styles.confirmValue} numberOfLines={2}>
                      {waitlistConfirmRide.fromAddress}
                    </Text>
                  </View>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>To</Text>
                    <Text style={styles.confirmValue} numberOfLines={2}>
                      {waitlistConfirmRide.toAddress}
                    </Text>
                  </View>

                  <View style={styles.confirmDivider} />

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Hold amount</Text>
                    <Text style={styles.confirmValue}>
                      ${toNumber(waitlistConfirmRide.price).toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.confirmTinyNote}>
                    Your card will be authorized but not charged. The hold will be released if you leave the waitlist.
                  </Text>
                </>
              )}

              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeWaitlistConfirm}
                  disabled={isJoiningWaitlist}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payBtn, isJoiningWaitlist && { opacity: 0.7 }]}
                  onPress={() => handleJoinWaitlist(waitlistConfirmRide)}
                  disabled={isJoiningWaitlist}
                >
                  <Text style={styles.payBtnText}>
                    {isJoiningWaitlist ? "Processing..." : "Hold & Join Waitlist"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Waitlist Position Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={waitlistModalVisible}
          onRequestClose={closeWaitlistModal}
        >
          <View style={styles.waitlistModalOverlay}>
            <View style={styles.waitlistModalCard}>
              <Text style={styles.waitlistModalTitle}>Waitlist Position</Text>
              <Text style={styles.waitlistModalPosition}>
                #{waitlistModalRide ? (waitlistPositions[waitlistModalRide.id] ?? "—") : ""}
              </Text>
              <Text style={styles.waitlistModalDesc}>
                You are #{waitlistModalRide ? (waitlistPositions[waitlistModalRide.id] ?? "—") : ""} on the waitlist for this ride.
              </Text>
              <View style={styles.waitlistModalActions}>
                <TouchableOpacity
                  style={styles.waitlistModalCloseBtn}
                  onPress={closeWaitlistModal}
                >
                  <Text style={styles.waitlistModalCloseBtnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waitlistModalLeaveBtn}
                  onPress={() => {
                    const ride = waitlistModalRide;
                    closeWaitlistModal();
                    handleLeaveWaitlist(ride);
                  }}
                >
                  <Text style={styles.waitlistModalLeaveBtnText}>Leave Waitlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={showFilterModal}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalOverlay}>
            <View style={styles.filterModalContent}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Filter by Tags</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Text style={styles.filterModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterTagList}>
                {tagOptions.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.filterTagOption}
                    onPress={() => toggleTagFilter(tag)}
                  >
                    <View style={styles.filterTagCheckbox}>
                      {selectedTags.has(tag) && (
                        <Text style={styles.filterTagCheckmark}>✓</Text>
                      )}
                    </View>
                    <View style={[styles.filterTagDot, { backgroundColor: tagColors[tag] || "#9ca3af" }]} />
                    <Text style={styles.filterTagOptionText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.filterModalActions}>
                <TouchableOpacity
                  style={styles.filterClearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.filterClearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterDoneButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.filterDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirm modal */}
        <Modal
          animationType="fade"
          transparent
          visible={confirmVisible}
          onRequestClose={closeJoinConfirm}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmCard}>
              {!showCancellationWarning ? (
                <>
                  <Text style={styles.confirmTitle}>Confirm your ride</Text>

                  {confirmRide && (
                    <>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Driver</Text>
                        <Text style={styles.confirmValue}>{confirmRide.ownerName}</Text>
                      </View>

                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>When</Text>
                        <Text style={styles.confirmValue}>
                          {formatDate(confirmRide.rideDate)} • {formatTime(confirmRide.rideDate)}
                        </Text>
                      </View>

                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>From</Text>
                        <Text style={styles.confirmValue} numberOfLines={2}>
                          {confirmRide.fromAddress}
                        </Text>
                      </View>

                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>To</Text>
                        <Text style={styles.confirmValue} numberOfLines={2}>
                          {confirmRide.toAddress}
                        </Text>
                      </View>

                      <View style={styles.confirmDivider} />

                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Ride price</Text>
                        <Text style={styles.confirmValue}>
                          ${toNumber(confirmRide.price).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmTotalLabel}>Total</Text>
                        <Text style={styles.confirmTotalValue}>
                          ${toNumber(confirmRide.price).toFixed(2)}
                        </Text>
                      </View>

                      <Text style={styles.confirmTinyNote}>
                        By confirming, you agree to pay the total amount shown.
                      </Text>
                    </>
                  )}

                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={closeJoinConfirm}
                      disabled={isJoining}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.payBtn, isJoining && { opacity: 0.7 }]}
                      onPress={openCancellationWarning}
                      disabled={isJoining}
                    >
                      <Text style={styles.payBtnText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {confirmRide && (
                    <>
                      <Text style={styles.policyInfoText}>
                        Additional fees may incur if you leave this ride after the cancellation deadline.
                      </Text>

                      <View style={styles.policyDeadlineBox}>
                        <Text style={styles.policyDeadlineLabel}>Cancellation Deadline</Text>
                        <Text style={styles.policyDeadlineText}>
                          {confirmRide.cancellationDeadline
                            ? `${formatDate(confirmRide.cancellationDeadline)} • ${formatTime(confirmRide.cancellationDeadline)}`
                            : "No deadline set for this ride."}
                        </Text>
                      </View>

                    </>
                  )}

                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={backToConfirmDetails}
                      disabled={isJoining}
                    >
                      <Text style={styles.cancelBtnText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.payBtn, isJoining && { opacity: 0.7 }]}
                      onPress={handleConfirmJoin}
                      disabled={isJoining}
                    >
                      <Text style={styles.payBtnText}>
                        {isJoining ? "Processing..." : "Pay & Join"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal for Ride Details */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedRide && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalDriverIcon}>
                        {driverInfo?.photoURL ? (
                          <Image
                            source={{ uri: driverInfo.photoURL }}
                            style={{ width: 56, height: 56, borderRadius: 28 }}
                          />
                        ) : (
                          <DefaultAvatar size={56} bgColor={driverInfo?.avatarBgColor || '#FFFFFF'} avatarType={driverInfo?.avatarPreset || 'default'} />
                        )}
                      </View>
                      <TouchableOpacity onPress={() => {
                        setModalVisible(false);
                        reopenModalRef.current = true;
                        router.push({ pathname: '/(tabs)/account/profilepage', params: { userId: selectedRide.ownerId } });
                      }} activeOpacity={0.7}>
                        <Text style={styles.modalDriverTitle}>{selectedRide.ownerName}</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSectionTitle}>Ride Info</Text>
                    <View style={styles.modalSection}>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Date:</Text>
                        <Text style={styles.modalInfoValue}>{formatDate(selectedRide.rideDate)}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Time:</Text>
                        <Text style={styles.modalInfoValue}>{formatTime(selectedRide.rideDate)}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>From:</Text>
                        <Text style={styles.modalInfoValue}>{selectedRide.fromAddress}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>To:</Text>
                        <Text style={styles.modalInfoValue}>{selectedRide.toAddress}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Seats Available:</Text>
                        <Text style={styles.modalInfoValue}>
                          {Number(selectedRide.seats)} / {Number(selectedRide.total_seats ?? selectedRide.seats)}
                        </Text> 
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Price:</Text>
                        <Text style={styles.modalInfoValue}>${selectedRide.price}</Text>
                      </View>
                      {selectedRide.tag && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Tag:</Text>
                          <View style={styles.modalTagContent}>
                            <View style={[styles.modalTagDot, { backgroundColor: tagColors[selectedRide.tag] || '#9ca3af' }]} />
                            <Text style={styles.modalTagText}>{selectedRide.tag}</Text>
                          </View>
                        </View>
                      )}
                      {selectedRide.cancellationDeadline && (
                        <View style={styles.cancellationBox}>
                          <Text style={styles.cancellationBoxLabel}>Cancellation Deadline</Text>
                          <Text style={styles.cancellationBoxText}>
                            {formatDate(selectedRide.cancellationDeadline)} at {formatTime(selectedRide.cancellationDeadline)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Driver Info</Text>
                    <View style={styles.modalSection}>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Name:</Text>
                        <Text style={styles.modalInfoValue}>{driverInfo?.name || selectedRide.ownerName}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Pay Handle:</Text>
                        <Text style={styles.modalInfoValue}>{driverInfo?.payHandle || "Not provided"}</Text>
                      </View>
                      {driverInfo?.role && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Role:</Text>
                          <Text style={styles.modalInfoValue}>{driverInfo.role.charAt(0).toUpperCase() + driverInfo.role.slice(1)}</Text>
                        </View>
                      )}
                      {driverInfo?.yearsAtUCSB && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Years at UCSB:</Text>
                          <Text style={styles.modalInfoValue}>{driverInfo.yearsAtUCSB}</Text>
                        </View>
                      )}
                      {driverInfo?.major && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Major:</Text>
                          <Text style={styles.modalInfoValue}>{driverInfo.major}</Text>
                        </View>
                      )}
                      {driverInfo?.clubs && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Clubs:</Text>
                          <Text style={styles.modalInfoValue}>{driverInfo.clubs}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.sectionDivider} />

                    <Text style={styles.modalSectionTitle}>Driver Notes</Text>
                    <View style={styles.modalNotes}>
                      {selectedRide.driverNotes ? (
                        <Text style={styles.modalNotesText}>{selectedRide.driverNotes}</Text>
                      ) : (
                        <Text style={styles.modalNotesPlaceholder}>No notes provided</Text>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // header
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: "row", 
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 1,
  },

// search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    zIndex: 30,
  },
  searchAutocompleteWrap: {
    flex: 1,
  },
  searchInput: {
    borderRadius: 8,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 16,
    color: colors.text,
  },
  controlsRow: {
    marginHorizontal: 20,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  filterButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  viewAllButton: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 10,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
  },

  // list
  listContainer: {
    padding: 20,
    paddingTop: 15,
  },

  // loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.white,
  },

  // ride card
  rideCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  driverNameSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  tagBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  driverIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  driverIconText: {
    fontSize: 22,
  },
  driverName: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  ridePrice: {
    flexShrink: 0,
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },

  cardMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  leftInfo: {
    flex: 1,
  },
  whenSection: {
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  capacityText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  rightInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  destinationRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  destinationLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    marginRight: 8,
  },
  destinationValue: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  viewDetailsButton: {
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewDetailsButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "bold",
  },
  joinButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 35,
    borderRadius: 6,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
// empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
// modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 1,
    width: "88%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: colors.border,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  modalDriverIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 10,
  },
  modalDriverIconText: {
    fontSize: 30,
  },
  modalDriverTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 20,
  },
  modalSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  modalInfoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    width: 120,
  },
  modalInfoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
  modalNotes: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 15,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalNotesText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  modalNotesPlaceholder: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  modalTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  modalTagText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  cancellationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancellationBoxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancellationBoxText: {
    fontSize: 14,
    color: '#7f1d1d',
    fontWeight: '600',
  },
// confirm modal
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    width: "88%",
    borderWidth: 2,
    borderColor: colors.border,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  confirmLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  confirmValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "right",
  },
  confirmDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  confirmTotalLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  confirmTotalValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "right",
  },
  confirmTinyNote: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  policyInfoText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primary,
    fontWeight: "700",
  },
  policyDeadlineBox: {
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.errorBg,
    borderWidth: 2,
    borderColor: colors.error,
  },
  policyDeadlineLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.error,
    marginBottom: 4,
  },
  policyDeadlineText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.error,
  },
  confirmPromptText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    marginRight: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  payBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  // Disabled (for JOINED / SOLD OUT) 
  rideCardDisabled: {
    backgroundColor: "#B8B8B8",
    borderColor: "#B8B8B8",
    borderWidth: 2,
    },
  driverIconDisabled: {
    backgroundColor: "#D3D3D3",
    borderColor: "#4A4A4A",
  },
  viewDetailsButtonDisabled: {
    backgroundColor: "#DADADA",
    borderColor: "#4A4A4A",
  },
  joinButtonDisabled: {
    backgroundColor: "#9E9E9E",
  },
  textDisabled: {
    color: "#2B2B2B",
  },
  priceDisabled: {
    color: "#1F1F1F",
  },
  joinButtonTextDisabled: {
    color: "#111111",
  },
  waitlistButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  soldOutStack: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 6,
  },
  waitlistedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waitlistedInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  waitlistInlineInfo: {
    fontSize: 17,
    position: "absolute",
    right: 0,
  },
  waitlistButton: {
    backgroundColor: "#f59e0b",
  },
  waitlistButtonText: {
    color: colors.white,
  },
  waitlistActiveButton: {
    backgroundColor: "#fbbf24",
    borderWidth: 1,
    borderColor: "#d97706",
    paddingHorizontal: 10,
    marginLeft: 50,
  },
  waitlistActiveButtonText: {
    color: "#78350f",
    fontSize: 14,
    fontWeight: "bold",
  },
  waitlistModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  waitlistModalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  waitlistModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  waitlistModalPosition: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#d97706",
    marginBottom: 8,
  },
  waitlistModalDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  waitlistModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  waitlistModalCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  waitlistModalCloseBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  waitlistModalLeaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },
  waitlistModalLeaveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  waitlistInfoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  waitlistInfoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  waitlistPositionText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#92400e",
  },
  
  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  filterModalClose: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  filterTagList: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTagOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTagCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: colors.background,
  },
  filterTagCheckmark: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  filterTagDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  filterTagOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  filterModalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  filterClearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  filterClearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterDoneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  filterDoneButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
});