import React, { useEffect, useState } from 'react';
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../src/firebase';
import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';
import NavBar from '../../../src/components/nav-bar';

// Placeholder data for joined rides (MUST update later)
const MOCK_JOINED_RIDES = [
  { id: '1', title: 'UCSB → Downtown SB' },
  { id: '2', title: 'IV → LAX' },
];

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RideList({ rides, emptyText, isHosted = false }) {
  if (!rides || rides.length === 0) {
    return (
      <View style={commonStyles.emptyState}>
        <Text style={commonStyles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => String(item.id)}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      renderItem={({ item }) => (
        <View style={styles.rideRow}>
          <Text style={styles.rideTitle}>
            {isHosted ? `${item.fromAddress} → ${item.toAddress}` : item.title}
          </Text>
          {isHosted && item.rideDate && (
            <Text style={styles.rideSubtitle}>{formatDateTime(item.rideDate)}</Text>
          )}
          {!isHosted && !!item.subtitle && (
            <Text style={styles.rideSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      )}
    />
  );
}

export default function Homepage({ user }) {
  const [hostedRides, setHostedRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const ridesRef = collection(db, 'rides');
    const q = query(ridesRef, where('ownerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHostedRides(rides);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching hosted rides:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Platform.OS === 'ios' ? 108 : 80 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/cs148_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>UCSB Rideshare</Text>
        </View>

        <View 
          style={[
            commonStyles.contentBox,
            { flex: 1 },
          ]}
        >
          {/* Joined Rides Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Joined Rides</Text>

            <View style={styles.card}>
              <RideList
                rides={MOCK_JOINED_RIDES}
                emptyText={"No joined rides yet.\nTap Join to find a ride."}
              />
            </View>

            <TouchableOpacity 
              style={commonStyles.primaryButton}
              onPress={() => router.push("/(tabs)/home/joinpage")}
            >
              <Text style={commonStyles.primaryButtonText}>Join</Text>
            </TouchableOpacity>
          </View>

          {/* Hosted Rides Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted Rides</Text>

            <View style={styles.card}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <RideList
                  rides={hostedRides}
                  emptyText={"No hosted rides yet.\nTap Host to create a ride."}
                  isHosted={true}
                />
              )}
            </View>

            <TouchableOpacity 
              style={[
                commonStyles.primaryButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() => router.push("/(tabs)/home/hostpage")}
            >
              <Text 
                style={[
                  commonStyles.secondaryButtonText,
                  { fontSize: 18 },
                ]}
              >
                Host
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 70,
  },  
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.accent,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    paddingVertical: 10,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  rideRow: {
    paddingVertical: 10,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rideSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.8,
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
});