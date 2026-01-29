import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { colors } from '../../../ui/styles/colors';
import NavBar from '../../../src/components/nav-bar';

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.placeholder}>Coming Soon!</Text>
        <Text style={styles.subtitle}>
          Chat with your ride matches here
        </Text>
      </View>
      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 88 : 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary || '#1A1A1A',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.accent || '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary || '#666666',
    textAlign: 'center',
  },
});