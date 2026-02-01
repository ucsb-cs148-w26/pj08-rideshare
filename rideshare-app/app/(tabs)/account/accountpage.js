import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../ui/styles/colors';
import NavBar from '../../components/nav-bar';
import { useAuth } from '../../../src/auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../src/firebase';
import { Ionicons } from '@expo/vector-icons';

const emptyAccount = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  payHandle: '',
  vehicleMake: '',
  vehicleModel: '',
  vehiclePlate: '',
};

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const cleaned = String(phoneNumber).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phoneNumber;
};

export default function AccountPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(emptyAccount);
  const [saved, setSaved] = useState(emptyAccount);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setSaved(emptyAccount);
        setDraft(emptyAccount);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', user.uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
        const primaryVehicle = vehicles[0] || {};
        const next = {
          ...emptyAccount,
          name: data.name || user.displayName || '',
          email: data.email || user.email || '',
          phone: data.phone || user.phoneNumber || '',
          bio: data.bio || '',
          payHandle: data.payHandle || '',
          vehicleMake: primaryVehicle.make || '',
          vehicleModel: primaryVehicle.model || '',
          vehiclePlate: primaryVehicle.plate || '',
        };
        setSaved(next);
        setDraft(next);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const initials = useMemo(() => {
    const source = saved.name || user?.email || '';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [saved.name, user?.email]);

  const handleChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setDraft(saved);
    setIsEditing(false);
  };
  const handleSave = async () => {
    if (!user?.uid) return;
    const trimmed = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      bio: draft.bio.trim(),
      payHandle: draft.payHandle.trim(),
      vehicleMake: draft.vehicleMake.trim(),
      vehicleModel: draft.vehicleModel.trim(),
      vehiclePlate: draft.vehiclePlate.trim(),
    };

    const vehicles =
      trimmed.vehicleMake || trimmed.vehicleModel || trimmed.vehiclePlate
        ? [
            {
              make: trimmed.vehicleMake,
              model: trimmed.vehicleModel,
              plate: trimmed.vehiclePlate,
            },
          ]
        : [];

    const payload = {
      name: trimmed.name,
      email: trimmed.email,
      phone: trimmed.phone,
      bio: trimmed.bio,
      payHandle: trimmed.payHandle,
      vehicles,
    };

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      setSaved((prev) => ({ ...prev, ...trimmed }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name}>{saved.name}</Text>
              <Text style={styles.meta}>{saved.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.name}
                onChangeText={(value) => handleChange('name', value)}
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.email}
                onChangeText={(value) => handleChange('email', value)}
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? draft.phone : formatPhoneNumber(draft.phone)}
                onChangeText={(value) => handleChange('phone', value)}
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Pay Handle</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.payHandle}
                onChangeText={(value) => handleChange('payHandle', value)}
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
                value={draft.bio}
                onChangeText={(value) => handleChange('bio', value)}
                editable={isEditing}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Vehicle Make</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.vehicleMake}
                onChangeText={(value) => handleChange('vehicleMake', value)}
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Vehicle Model</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.vehicleModel}
                onChangeText={(value) => handleChange('vehicleModel', value)}
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.vehiclePlate}
                onChangeText={(value) => handleChange('vehiclePlate', value)}
                editable={isEditing}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            {isEditing ? (
              <>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.logoutRow}>
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#B91C1C" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 88 : 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary || '#1A1A1A',
    marginTop: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent || '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.secondary || '#1A1A1A',
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary || '#666666',
    marginTop: 2,
  },
  section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary || '#1A1A1A',
    marginBottom: 10,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary || '#666666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.secondary || '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: colors.textSecondary || '#666666',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: colors.accent || '#007AFF',
    alignSelf: 'flex-start',
  },
  editText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: colors.accent || '#007AFF',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelText: {
    color: colors.secondary || '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 14,
  },
});