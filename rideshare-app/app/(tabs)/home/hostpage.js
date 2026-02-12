import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { colors } from "../../../ui/styles/colors";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../../src/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { commonStyles } from "../../../ui/styles/commonStyles";
import NavBar from '../../../app/components/nav-bar';

export default function HostPage() {
  const router = useRouter();
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

  // User profile state
  const [ownerName, setOwnerName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form state
  const [price, setPrice] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [rideDate, setRideDate] = useState(null);
  const [seats, setSeats] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [driverNotes, setDriverNotes] = useState("");
  const [cancellationDeadline, setCancellationDeadline] = useState(null);
  const [showCancelDatePicker, setShowCancelDatePicker] = useState(false);
  const [showCancelTimePicker, setShowCancelTimePicker] = useState(false);
  const [cancelTempDate, setCancelTempDate] = useState(new Date());

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOwnerName(data.name || "");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString([], {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCancelDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString([], {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCancelTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenDatePicker = () => {
    const baseDate = rideDate || new Date();
    setTempDate(baseDate);
    setShowDatePicker(true);
  };

  const handleOpenTimePicker = () => {
    const baseDate = rideDate || new Date();
    setTempDate(baseDate);
    setShowTimePicker(true);
  };

  const handleOpenCancelDatePicker = () => {
    const baseDate = cancellationDeadline || new Date();
    setCancelTempDate(baseDate);
    setShowCancelDatePicker(true);
  };

  const handleOpenCancelTimePicker = () => {
    const baseDate = cancellationDeadline || new Date();
    setCancelTempDate(baseDate);
    setShowCancelTimePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
      if (event?.type === "dismissed") return;
      const nextDate = selectedDate || rideDate || new Date();
      setRideDate(nextDate);
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS !== "ios") {
      setShowTimePicker(false);
      if (event?.type === "dismissed") return;
      const baseDate = rideDate || new Date();
      const timeDate = selectedTime || baseDate;
      const combined = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        timeDate.getHours(),
        timeDate.getMinutes()
      );
      setRideDate(combined);
    } else if (selectedTime) {
      setTempDate(selectedTime);
    }
  };

  const handleCancelDateChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") {
      setShowCancelDatePicker(false);
      if (event?.type === "dismissed") return;
      const nextDate = selectedDate || cancellationDeadline || new Date();
      setCancellationDeadline(nextDate);
    } else if (selectedDate) {
      setCancelTempDate(selectedDate);
    }
  };

  const handleCancelTimeChange = (event, selectedTime) => {
    if (Platform.OS !== "ios") {
      setShowCancelTimePicker(false);
      if (event?.type === "dismissed") return;
      const baseDate = cancellationDeadline || new Date();
      const timeDate = selectedTime || baseDate;
      const combined = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        timeDate.getHours(),
        timeDate.getMinutes()
      );
      setCancellationDeadline(combined);
    } else if (selectedTime) {
      setCancelTempDate(selectedTime);
    }
  };

  const handleConfirmDate = () => {
    setRideDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        (rideDate || new Date()).getHours(),
        (rideDate || new Date()).getMinutes()
      )
    );
    setShowDatePicker(false);
  };

  const handleConfirmTime = () => {
    const baseDate = rideDate || new Date();
    setRideDate(
      new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        tempDate.getHours(),
        tempDate.getMinutes()
      )
    );
    setShowTimePicker(false);
  };

  const handleConfirmCancelDate = () => {
    setCancellationDeadline(
      new Date(
        cancelTempDate.getFullYear(),
        cancelTempDate.getMonth(),
        cancelTempDate.getDate(),
        (cancellationDeadline || new Date()).getHours(),
        (cancellationDeadline || new Date()).getMinutes()
      )
    );
    setShowCancelDatePicker(false);
  };

  const handleConfirmCancelTime = () => {
    const baseDate = cancellationDeadline || new Date();
    setCancellationDeadline(
      new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        cancelTempDate.getHours(),
        cancelTempDate.getMinutes()
      )
    );
    setShowCancelTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!price || !toAddress || !fromAddress || !rideDate || !seats || !selectedTag) {
      Alert.alert("Missing info", "Please fill out all required fields.");
      return;
    }

    if (cancellationDeadline && cancellationDeadline > rideDate) {
      Alert.alert(
        "Invalid cancellation deadline",
        "Cancellation deadline must be before or at the ride time."
      );
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "Please sign in to post a ride.");
      return;
    }

    const seatsNum = Number(seats);

    if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
      Alert.alert("Invalid seats", "Seats must be a number greater than 0.");
      return;
    }

    try {
      setIsSaving(true);
      const ridesRef = doc(collection(db, "rides"));
      const userRideRef = doc(collection(db, "users", user.uid, "rides"));
      const ridePayload = {
        price: price.trim(),
        toAddress: toAddress.trim(),
        fromAddress: fromAddress.trim(),
        rideDate: rideDate.toISOString(),
        cancellationDeadline: cancellationDeadline
          ? cancellationDeadline.toISOString()
          : null,
        seats: seatsNum,
        total_seats: seatsNum,
        tag: selectedTag,
        driverNotes: driverNotes.trim(),
        ownerId: user.uid,
        ownerEmail: user.email || "",
        ownerName: ownerName,
        createdAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(ridesRef, ridePayload);
      batch.set(userRideRef, ridePayload);
      await batch.commit();
      Alert.alert("Saved", "Your ride has been posted.");
      setPrice("");
      setToAddress("");
      setFromAddress("");
      setRideDate(null);
      setCancellationDeadline(null);
      setSeats("");
      setSelectedTag("");
      setDriverNotes("");
      router.push("/(tabs)/home");
    } catch (error) {
      Alert.alert("Error", error?.message || "Could not save ride. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: Platform.OS === "ios" ? 108 : 80 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Host a Ride</Text>

        {/* Owner Name (pulled from profile) */}
        <View style={[styles.fieldGroup, styles.firstFieldGroup]}>
          <Text style={styles.label}>Host Name</Text>
          <View style={commonStyles.readOnlyField}>
            <Text style={commonStyles.readOnlyText}>
              {ownerName || "Name not set"}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>To (destination address)</Text>
          <TextInput
            style={styles.input}
            placeholder="Where are you going?"
            value={toAddress}
            onChangeText={setToAddress}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>From (pickup address)</Text>
          <TextInput
            style={styles.input}
            placeholder="Pickup address"
            value={fromAddress}
            onChangeText={setFromAddress}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity onPress={handleOpenDatePicker}>
            <TextInput
              style={styles.input}
              placeholder="Select date"
              value={formatDate(rideDate)}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity onPress={handleOpenTimePicker}>
            <TextInput
              style={styles.input}
              placeholder="Select time"
              value={formatTime(rideDate)}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          Platform.OS === "ios" ? (
            <Modal transparent animationType="slide">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                    themeVariant="light"
                    style={styles.picker}
                  />
                  <View style={styles.modalActions}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.modalActionText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirmDate}>
                      <Text style={styles.modalActionText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={rideDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )
        )}

        {showTimePicker && (
          Platform.OS === "ios" ? (
            <Modal transparent animationType="slide">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    themeVariant="light"
                    style={styles.picker}
                  />
                  <View style={styles.modalActions}>
                    <Pressable onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.modalActionText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirmTime}>
                      <Text style={styles.modalActionText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={rideDate || new Date()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Space in the car</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of seats"
            value={seats}
            onChangeText={setSeats}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Cancellation Deadline</Text>
          <Text style={styles.helperText}>
            Latest time riders can cancel without a fee.
          </Text>
          <TouchableOpacity onPress={handleOpenCancelDatePicker}>
            <TextInput
              style={styles.input}
              placeholder="Select date"
              value={formatCancelDate(cancellationDeadline)}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenCancelTimePicker} style={{ marginTop: 10 }}>
            <TextInput
              style={styles.input}
              placeholder="Select time"
              value={formatCancelTime(cancellationDeadline)}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        {showCancelDatePicker && (
          Platform.OS === "ios" ? (
            <Modal transparent animationType="slide">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <DateTimePicker
                    value={cancelTempDate}
                    mode="date"
                    display="inline"
                    onChange={handleCancelDateChange}
                    themeVariant="light"
                    style={styles.picker}
                  />
                  <View style={styles.modalActions}>
                    <Pressable onPress={() => setShowCancelDatePicker(false)}>
                      <Text style={styles.modalActionText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirmCancelDate}>
                      <Text style={styles.modalActionText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={cancellationDeadline || new Date()}
              mode="date"
              display="default"
              onChange={handleCancelDateChange}
            />
          )
        )}

        {showCancelTimePicker && (
          Platform.OS === "ios" ? (
            <Modal transparent animationType="slide">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <DateTimePicker
                    value={cancelTempDate}
                    mode="time"
                    display="spinner"
                    onChange={handleCancelTimeChange}
                    themeVariant="light"
                    style={styles.picker}
                  />
                  <View style={styles.modalActions}>
                    <Pressable onPress={() => setShowCancelTimePicker(false)}>
                      <Text style={styles.modalActionText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirmCancelTime}>
                      <Text style={styles.modalActionText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={cancellationDeadline || new Date()}
              mode="time"
              display="default"
              onChange={handleCancelTimeChange}
            />
          )
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tags</Text>
          <TouchableOpacity onPress={() => setShowTagPicker(true)}>
            <TextInput
              style={styles.input}
              placeholder="Select a tag"
              value={selectedTag}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>

        {showTagPicker && (
          <Modal transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View style={styles.tagModalCard}>
                <Text style={styles.tagModalTitle}>Popular tags</Text>
                <ScrollView style={styles.tagList}>
                  {tagOptions.map((tag) => (
                    <Pressable
                      key={tag}
                      style={styles.tagOption}
                      onPress={() => {
                        setSelectedTag(tag);
                        setShowTagPicker(false);
                      }}
                    >
                      <View style={styles.tagOptionRow}>
                        <View
                          style={[
                            styles.tagDot,
                            { backgroundColor: tagColors[tag] || "#9ca3af" },
                          ]}
                        />
                        <Text style={styles.tagOptionText}>{tag}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  onPress={() => setShowTagPicker(false)}
                  style={styles.tagCloseButton}
                >
                  <Text style={styles.tagCloseText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Driver Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Any additional info for riders?"
            value={driverNotes}
            onChangeText={setDriverNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          <Text style={styles.submitButtonText}>
            {isSaving ? "Saving..." : "Submit"}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#fff",
    paddingTop: 45,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 20,
    color: colors.primary,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  firstFieldGroup: {
    marginTop: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.primary,
  },
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  multilineInput: {
    minHeight: 80,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#e5e7eb",
  },
  readOnlyText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
  },
  pricePrefix: {
    fontSize: 16,
    color: "#6b7280",
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 12,
    paddingLeft: 35,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tagModalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  tagModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 12,
  },
  tagList: {
    maxHeight: 280,
  },
  tagOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tagOptionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  tagOptionText: {
    fontSize: 16,
    color: "#111827",
  },
  tagCloseButton: {
    alignSelf: "flex-end",
    paddingTop: 12,
  },
  tagCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  picker: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
  },
});