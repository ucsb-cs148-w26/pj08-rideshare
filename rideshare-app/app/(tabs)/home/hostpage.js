import { useState } from "react";
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
} from "react-native";
import { colors } from "../../../ui/styles/colors";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../../src/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function HostPage() {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [rideDate, setRideDate] = useState(null);
  const [seats, setSeats] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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

  const handleSubmit = async () => {
    if (!price || !toAddress || !fromAddress || !rideDate || !seats) {
      Alert.alert("Missing info", "Please fill out all fields.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "Please sign in to post a ride.");
      return;
    }

    try {
      setIsSaving(true);
      const ridesRef = doc(collection(db, "rides"));
      const userRideRef = doc(collection(db, "users", user.uid, "rides"));
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const u = userSnap.exists() ? userSnap.data() : null;
      const ownerName =
        u?.name ||
        u?.displayName ||
        u?.fullName ||
        (auth.currentUser?.displayName ?? "Unknown Driver");

      const ridePayload = {
        price: price.trim(),
        toAddress: toAddress.trim(),
        fromAddress: fromAddress.trim(),
        rideDate: rideDate.toISOString(),
        seats: seats.trim(),
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
      setSeats("");
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Error", error?.message || "Could not save ride. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Host a Ride</Text>

      <View style={[styles.fieldGroup, styles.firstFieldGroup]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#fff",
    paddingTop: 45,
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
    marginTop: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.primary,
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
