import React, { useMemo, useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../../ui/styles/colors';
import { useAuth } from '../../../src/auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch, } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, db, storage } from '../../../src/firebase';
import { Ionicons } from '@expo/vector-icons';

const MAX_NAME_LENGTH = 30;

const emptyAccount = {
  name: '',
  email: '',
  phone: '',
  role: '',
  yearsAtUCSB: '',
  major: '',
  clubs: '',
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
  const [photoURL, setPhotoURL] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [nameError, setNameError] = useState('');


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
          role: data.role || '',
          yearsAtUCSB: data.yearsAtUCSB || '',
          major: data.major || '',
          clubs: data.clubs || '',
          bio: data.bio || '',
          payHandle: data.payHandle || '',
          vehicleMake: primaryVehicle.make || '',
          vehicleModel: primaryVehicle.model || '',
          vehiclePlate: primaryVehicle.plate || '',
        };
        setPhotoURL(data.photoURL || null);
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
    if (key === 'name') {
      const trimmed = value.trim();
      if (trimmed.length > MAX_NAME_LENGTH) {
        setNameError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
      } else {
        setNameError('');
      }
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setDraft(saved);
    setIsEditing(false);
  };
  const syncNameEverywhere = async (uid, newName) => {
    // conversations
    const convSnap = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', uid)));
    for (const convo of convSnap.docs) {
      await updateDoc(doc(db, 'conversations', convo.id), {
        [`participantNames.${uid}`]: newName,
      });

      const msgSnap = await getDocs(query(collection(db, 'conversations', convo.id, 'messages'), where('senderId', '==', uid)));
      for (const msg of msgSnap.docs) {
        await updateDoc(doc(db, 'conversations', convo.id, 'messages', msg.id), {
          senderName: newName,
        });
      }
    }

    // rides collection
    const ridesSnap = await getDocs(query(collection(db, 'rides'), where('ownerId', '==', uid)));
    for (const ride of ridesSnap.docs) {
      await updateDoc(doc(db, 'rides', ride.id), { ownerName: newName });
    }

    // users/{uid}/rides subcollection
    const userRidesSnap = await getDocs(collection(db, 'users', uid, 'rides'));
    for (const ride of userRidesSnap.docs) {
      await updateDoc(doc(db, 'users', uid, 'rides', ride.id), { ownerName: newName });
    }
  };
  const handleSave = async () => {
    if (!user?.uid) return;

    const trimmedName = draft.name.trim();
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setNameError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
      return;
    }

    const trimmed = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      role: draft.role.trim(),
      yearsAtUCSB: draft.yearsAtUCSB.trim(),
      major: draft.major.trim(),
      clubs: draft.clubs.trim(),
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
      role: trimmed.role,
      yearsAtUCSB: trimmed.yearsAtUCSB,
      major: trimmed.major,
      clubs: trimmed.clubs,
      bio: trimmed.bio,
      payHandle: trimmed.payHandle,
      vehicles,
    };

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      try {
        await syncNameEverywhere(user.uid, trimmed.name);
      } catch (e) {
        console.error('Name sync failed:', e);
      }
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

  const isIosSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV && Platform.constants == null;  




const pickImage = async () => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Please allow photo library access.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    await uploadImage(result.assets[0].uri);
  }
};

const takePhoto = async () => {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  } catch (err) {
    console.error('takePhoto error:', err);

    Alert.alert(
      'Camera not available here',
      'Camera doesn’t work on simulator. Use Upload instead.',
      [{ text: 'Upload', onPress: pickImage }, { text: 'OK' }]
    );
  }
};

const uploadImage = async (uri) => {
  if (!user?.uid) return;

  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 256 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: 'base64',
    });

    const dataUrl = `data:image/jpeg;base64,${base64}`;

    await setDoc(
      doc(db, 'users', user.uid),
      { photoURL: dataUrl },
      { merge: true }
    );

    setPhotoURL(dataUrl);
  } catch (err) {
    console.error('Upload failed:', err);
    Alert.alert('Upload failed', 'Image too large or could not save.');
  }
};

const chooseImageSource = () => {
  const isIosSimulator = Platform.OS === 'ios' && !Device.isDevice;

  if (isIosSimulator) {
    Alert.alert('Profile Photo', 'Choose a source', [
      { text: 'Upload', onPress: pickImage },
      ...(photoURL ? [{ text: 'Remove Photo', style: 'destructive', onPress: handleRemovePhoto }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  Alert.alert('Profile Photo', 'Choose a source', [
    { text: 'Camera', onPress: takePhoto },
    { text: 'Upload', onPress: pickImage },
    ...(photoURL ? [{ text: 'Remove Photo', style: 'destructive', onPress: handleRemovePhoto }] : []),
    { text: 'Cancel', style: 'cancel' },
  ]);
};

const handleRemovePhoto = async () => {
  if (!user?.uid) return;
  try {
    await setDoc(doc(db, 'users', user.uid), { photoURL: null }, { merge: true });
    setPhotoURL(null);
  } catch (err) {
    console.error('Remove photo failed:', err);
    Alert.alert('Error', 'Could not remove photo.');
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Account</Text>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <TouchableOpacity onPress={chooseImageSource} activeOpacity={0.8}>
                <View style={styles.avatar}>
                  {photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                </View>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity onPress={chooseImageSource} style={{ marginTop: 6 }}>
                  <Text
                    style={{
                      color: colors.accent || '#007AFF',
                      fontWeight: '600',
                      fontSize: 9,
                      textAlign: 'center',
                    }}
                  >
                    Change Photo
                  </Text>
                </TouchableOpacity>
              )}
              
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
                maxLength={MAX_NAME_LENGTH}
              />
              <Text style={styles.charHint}>
                {draft.name.trim().length}/{MAX_NAME_LENGTH}
              </Text>
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
                maxLength={10}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Role</Text>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    style={[styles.input, styles.dropdownButton]}
                    onPress={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  >
                    <Text style={draft.role ? styles.dropdownText : styles.dropdownPlaceholder}>
                      {draft.role ? draft.role.charAt(0).toUpperCase() + draft.role.slice(1) : "Select your role..."}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {roleDropdownOpen && (
                    <View style={styles.dropdownOptions}>
                      <TouchableOpacity 
                        style={styles.dropdownOption}
                        onPress={() => {
                          handleChange('role', 'undergraduate');
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>Undergraduate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.dropdownOption}
                        onPress={() => {
                          handleChange('role', 'graduate');
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>Graduate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.dropdownOption}
                        onPress={() => {
                          handleChange('role', 'faculty');
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>Faculty</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={draft.role ? draft.role.charAt(0).toUpperCase() + draft.role.slice(1) : ''}
                  editable={false}
                />
              )}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Years at UCSB</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.yearsAtUCSB}
                onChangeText={(value) => handleChange('yearsAtUCSB', value)}
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Major</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={draft.major}
                onChangeText={(value) => handleChange('major', value)}
                editable={isEditing}
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
            <Text style={styles.sectionTitle}>Clubs & Interests</Text>
            <View style={styles.field}>
              <TextInput
                style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
                value={draft.clubs}
                onChangeText={(value) => handleChange('clubs', value)}
                editable={isEditing}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fun Fact</Text>
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
      </KeyboardAvoidingView>
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
  avatarImage: {
  width: 64,
  height: 64,
  borderRadius: 32,
},
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: colors.secondary || '#1A1A1A',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  dropdownArrow: {
    color: colors.accent || '#007AFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#E5E7EB',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: colors.secondary || '#1A1A1A',
  },
  charHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: '#B91C1C',
  },
  inputError: {
    borderColor: '#B91C1C',
  },

});