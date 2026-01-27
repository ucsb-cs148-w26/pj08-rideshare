import { useMemo, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../src/firebase";

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, } from "react-native";

const emailLooksValid = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const digitsOnly = (s) => s.replace(/[^\d]/g, "");

const formatPhone = (value) => {
  const d = value.replace(/\D/g, "").slice(0, 10); // max 10 digits
  const len = d.length;

  if (len === 0) return "";
  if (len < 4) return `(${d}`;
  if (len < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};


export default function Register({ onBack }) {
  // Required fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [payHandle, setPayHandle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [vehicles, setVehicles] = useState([{ make: "", model: "", plate: "" }]);

  const [touched, setTouched] = useState({});

  const passwordHasMinLength = password.trim().length >= 8;
  const passwordHasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordHasUppercase = /[A-Z]/.test(password);

  const errors = useMemo(() => {
    const e = {};

    if (!name.trim() || name.trim().length < 2) e.name = "Enter your name.";
    if (!bio.trim() || bio.trim().length < 5)
      e.bio = "Add a short fun fact (min 5 chars).";

    if (!payHandle.trim()) e.payHandle = "Venmo/Zelle is required.";

    const phoneDigits = digitsOnly(phone);
    if (!phoneDigits) e.phone = "Phone number is required.";
    else if (phoneDigits.length < 10) e.phone = "Enter a valid phone number.";

    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!emailLooksValid(email)) {
      e.email = "Enter a valid email.";
    } else if (!email.toLowerCase().endsWith("@ucsb.edu")) {
      e.email = "Use your @ucsb.edu email.";
    }

    if (!password.trim()) {
      e.password = "Password is required.";
    } else if (!passwordHasMinLength) {
      e.password = "Password must be at least 7 characters.";
    } else if (!passwordHasSpecial) {
      e.password = "Password must include at least one special character.";
    } else if (!passwordHasUppercase) {
      e.password = "Password must include at least one uppercase letter.";
    }

    if (!confirmPassword.trim()) {
      e.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      e.confirmPassword = "Passwords do not match.";
    }



    vehicles.forEach((v, idx) => {
      const anyFilled = v.make.trim() || v.model.trim() || v.plate.trim();
      if (anyFilled) {
        if (!v.make.trim()) e[`vehicle_${idx}_make`] = "Make required.";
        if (!v.model.trim()) e[`vehicle_${idx}_model`] = "Model required.";
        if (!v.plate.trim()) e[`vehicle_${idx}_plate`] = "Plate required.";
      }
    });

    return e;
  }, [name, bio, payHandle, phone, email, password, confirmPassword, passwordHasMinLength, passwordHasSpecial, passwordHasUppercase, vehicles]);

  const isValid = Object.keys(errors).length === 0;

  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));
  const showError = (key) => touched[key] && errors[key];

  const updateVehicle = (idx, field, value) => {
    setVehicles((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addVehicle = () => {
    setVehicles((prev) => [...prev, { make: "", model: "", plate: "" }]);
  };

  const removeVehicle = (idx) => {
    setVehicles((prev) => prev.filter((_, i) => i !== idx));
  };

  //
  const handleSubmit = async () => {
    const payload = {
      name: name.trim(),
      bio: bio.trim(),
      payHandle: payHandle.trim(),
      phone: digitsOnly(phone),
      email: email.trim().toLowerCase(),
      password: password,
      vehicles: vehicles
        .map((v) => ({
          make: v.make.trim(),
          model: v.model.trim(),
          plate: v.plate.trim(),
        }))
        .filter((v) => v.make || v.model || v.plate),
    };

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        name: payload.name,
        bio: payload.bio,
        payHandle: payload.payHandle,
        phone: payload.phone,
        email: payload.email,
        vehicles: payload.vehicles,
        createdAt: serverTimestamp(),
      });

      alert("Account created! Now go log in.");
      onBack(); // go back to login screen
    } catch (err) {
      alert(err?.message ?? "Sign up failed");
    }
  };

  //

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <Text style={styles.header}>Create Account</Text>
      <Text style={styles.subheader}>
        Enter your details to join UCSB Rideshare
      </Text>

      {/* White Card */}
      <View style={styles.card}>
        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, showError("name") && styles.inputError]}
          value={name}
          onChangeText={setName}
          onBlur={() => markTouched("name")}
          placeholder="Your full name"
          placeholderTextColor="#999"
        />
        {showError("name") ? <Text style={styles.error}>{errors.name}</Text> : null}

        <Text style={styles.label}>Fun facts UCSB (Bio)</Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            showError("bio") && styles.inputError,
          ]}
          value={bio}
          onChangeText={setBio}
          onBlur={() => markTouched("bio")}
          placeholder="Ex: 3rd year CS, love hikes, coffee addict…"
          placeholderTextColor="#999"
          multiline
        />
        {showError("bio") ? <Text style={styles.error}>{errors.bio}</Text> : null}

        <Text style={styles.label}>Venmo / Zelle</Text>
        <TextInput
          style={[styles.input, showError("payHandle") && styles.inputError]}
          value={payHandle}
          onChangeText={setPayHandle}
          onBlur={() => markTouched("payHandle")}
          placeholder="Ex: @johndoe (or phone/email for Zelle)"
          placeholderTextColor="#999"
        />
        {showError("payHandle") ? (
          <Text style={styles.error}>{errors.payHandle}</Text>
        ) : null}

        <Text style={styles.label}>Phone Number</Text>
        
        <TextInput
        style={[styles.input, showError("phone") && styles.inputError]}
        value={phone}
        onChangeText={(t) => setPhone(formatPhone(t))}
        onBlur={() => markTouched("phone")}
        placeholder="Ex: (###) ###-####"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        />


        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, showError("email") && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          onBlur={() => markTouched("email")}
          placeholder="you@ucsb.edu"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {showError("email") ? <Text style={styles.error}>{errors.email}</Text> : null}

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, showError("password") && styles.inputError]}
          value={password}
          onChangeText={setPassword}
          onBlur={() => markTouched("password")}
          placeholder="Create a password"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
        />
        <View style={styles.passwordChecklist}>
          <View style={styles.checklistItem}>
            <Text
              style={
                passwordHasMinLength
                  ? [styles.checklistIcon, styles.checklistIconOk]
                  : [styles.checklistIcon, styles.checklistIconError]
              }
            >
              {passwordHasMinLength ? "✓" : "✗"}
            </Text>
            <Text
              style={
                passwordHasMinLength
                  ? [styles.checklistText, styles.checklistTextOk]
                  : [styles.checklistText, styles.checklistTextError]
              }
            >
              At least 8 characters
            </Text>
          </View>
          <View style={styles.checklistItem}>
            <Text
              style={
                passwordHasSpecial
                  ? [styles.checklistIcon, styles.checklistIconOk]
                  : [styles.checklistIcon, styles.checklistIconError]
              }
            >
              {passwordHasSpecial ? "✓" : "✗"}
            </Text>
            <Text
              style={
                passwordHasSpecial
                  ? [styles.checklistText, styles.checklistTextOk]
                  : [styles.checklistText, styles.checklistTextError]
              }
            >
              At least 1 special character
            </Text>
          </View>
          <View style={styles.checklistItem}>
            <Text
              style={
                passwordHasUppercase
                  ? [styles.checklistIcon, styles.checklistIconOk]
                  : [styles.checklistIcon, styles.checklistIconError]
              }
            >
              {passwordHasUppercase ? "✓" : "✗"}
            </Text>
            <Text
              style={
                passwordHasUppercase
                  ? [styles.checklistText, styles.checklistTextOk]
                  : [styles.checklistText, styles.checklistTextError]
              }
            >
              At least 1 uppercase letter
            </Text>
          </View>
        </View>
        {showError("password") ? (
          <Text style={styles.error}>{errors.password}</Text>
        ) : null}

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, showError("confirmPassword") && styles.inputError]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onBlur={() => markTouched("confirmPassword")}
          placeholder="Re-enter your password"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
        />
        {showError("confirmPassword") ? (
          <Text style={styles.error}>{errors.confirmPassword}</Text>
        ) : null}

        {/* Vehicles Section */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
          Vehicles (optional)
        </Text>
        <Text style={styles.helperText}>
          Add your car info if you plan to drive. You can add multiple vehicles.
        </Text>

        {vehicles.map((v, idx) => (
          <View key={idx} style={styles.vehicleCard}>
            <View style={styles.vehicleHeaderRow}>
              <Text style={styles.vehicleTitle}>Vehicle {idx + 1}</Text>

              {vehicles.length > 1 ? (
                <TouchableOpacity onPress={() => removeVehicle(idx)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TextInput
              style={[
                styles.input,
                showError(`vehicle_${idx}_make`) && styles.inputError,
              ]}
              value={v.make}
              onChangeText={(val) => updateVehicle(idx, "make", val)}
              onBlur={() => markTouched(`vehicle_${idx}_make`)}
              placeholder="Make (e.g., Toyota)"
              placeholderTextColor="#999"
            />
            {showError(`vehicle_${idx}_make`) ? (
              <Text style={styles.error}>{errors[`vehicle_${idx}_make`]}</Text>
            ) : null}

            <TextInput
              style={[
                styles.input,
                showError(`vehicle_${idx}_model`) && styles.inputError,
              ]}
              value={v.model}
              onChangeText={(val) => updateVehicle(idx, "model", val)}
              onBlur={() => markTouched(`vehicle_${idx}_model`)}
              placeholder="Model (e.g., Camry)"
              placeholderTextColor="#999"
            />
            {showError(`vehicle_${idx}_model`) ? (
              <Text style={styles.error}>{errors[`vehicle_${idx}_model`]}</Text>
            ) : null}

            <TextInput
              style={[
                styles.input,
                showError(`vehicle_${idx}_plate`) && styles.inputError,
              ]}
              value={v.plate}
              onChangeText={(val) => updateVehicle(idx, "plate", val)}
              onBlur={() => markTouched(`vehicle_${idx}_plate`)}
              placeholder="License plate"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            {showError(`vehicle_${idx}_plate`) ? (
              <Text style={styles.error}>{errors[`vehicle_${idx}_plate`]}</Text>
            ) : null}
          </View>
        ))}

        <TouchableOpacity onPress={addVehicle} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>+ Add another vehicle</Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Text style={styles.submitText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      {/* Back */}
      <TouchableOpacity onPress={onBack} style={{ marginTop: 18 }}>
        <Text style={styles.back}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#003660",
    justifyContent: "center",
  },

  header: {
    fontSize: 30,
    fontWeight: "900",
    color: "#febc11",
    textAlign: "center",
    marginTop: 30,
  },
  subheader: {
    color: "#0ba89a",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
    fontStyle: "italic",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#003660",
    marginBottom: 10,
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 10,
    marginTop: -6,
  },

  label: {
    color: "#003660",
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
    fontSize: 13,
  },

  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 6,
    fontSize: 15,
  },

  multiline: {
    minHeight: 84,
    textAlignVertical: "top",
  },

  inputError: {
    borderWidth: 1,
    borderColor: "#d11a2a",
  },

  error: {
    color: "#d11a2a",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 2,
  },

  passwordChecklist: {
    marginTop: 6,
    marginBottom: 6,
    gap: 6,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checklistIcon: {
    width: 18,
    fontSize: 13,
    fontWeight: "900",
    marginRight: 6,
    textAlign: "center",
  },
  checklistText: {
    fontSize: 12,
  },
  checklistIconOk: {
    color: "#0ba89a",
  },
  checklistIconError: {
    color: "#d11a2a",
  },
  checklistTextOk: {
    color: "#0ba89a",
    fontWeight: "700",
  },
  checklistTextError: {
    color: "#d11a2a",
    fontWeight: "700",
  },

  vehicleCard: {
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  vehicleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  vehicleTitle: {
    color: "#003660",
    fontWeight: "900",
  },
  removeText: {
    color: "#d11a2a",
    fontWeight: "800",
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#0ba89a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  secondaryBtnText: {
    color: "#0ba89a",
    fontWeight: "900",
  },

  submitBtn: {
    backgroundColor: "#febc11",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: "#003660",
    fontWeight: "900",
    fontSize: 16,
  },

  back: {
    color: "white",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});
