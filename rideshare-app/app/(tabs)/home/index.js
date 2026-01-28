import React from 'react';
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';

import { colors } from '../../../ui/styles/colors';
import { commonStyles } from '../../../ui/styles/commonStyles';

// Placeholder data (will be replaced with backend data later)
const MOCK_JOINED_RIDES = [
  { id: '1', title: 'UCSB → Downtown SB' },
  { id: '2', title: 'IV → LAX' },
];

const MOCK_HOSTED_RIDES = [
  { id: '3', title: 'UCSB → SFO' },
  { id: '4', title: 'UCSB → SF4' },
  { id: '5', title: 'UCSB → SF8' },
];


function RideList({ rides, emptyText }) {
  if (!rides || rides.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{emptyText}</Text>
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
          <Text style={styles.rideTitle}>{item.title}</Text>
          {!!item.subtitle && <Text style={styles.rideSubtitle}>{item.subtitle}</Text>}
        </View>
      )}
    />
  );
}

export default function Homepage({ user }) {
  return (
    <View style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          {/* can add image here later if wanted */}
        </View>

        {/* Main Content Box */}
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
              <RideList
                rides={MOCK_HOSTED_RIDES}
                emptyText={"No hosted rides yet.\nTap Host to create a ride."}
              />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // List styles
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
});
