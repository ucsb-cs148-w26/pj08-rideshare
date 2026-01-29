import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Messages',
      icon: 'chatbubbles',
      iconOutline: 'chatbubbles-outline',
      route: '/(tabs)/messages',
    },
    {
      name: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
      route: '/(tabs)/home',
    },
    {
      name: 'Profile',
      icon: 'person',
      iconOutline: 'person-outline',
      route: '/(tabs)/account/accountpage',
    },
  ];

  

  const isActive = (route) => {
    // Check for Messages - only active on messages page
    if (route === '/(tabs)/messages') {
      return pathname.includes('/messages');
    }
    
    // Check for Home - ONLY active on home index, NOT on hostpage or joinpage
    if (route === '/(tabs)/home') {
      // Check if we're on the actual home page (not host or join pages)
      const isOnHomePage = (pathname === '/(tabs)/home' || 
                            pathname === '/home' ||
                            pathname === '/(tabs)/home/' ||
                            pathname === '/home/') &&
                           !pathname.includes('hostpage') && 
                           !pathname.includes('joinpage');
      return isOnHomePage;
    }
    
    // Check for Profile/Account
    if (route === '/(tabs)/account/accountpage') {
      return pathname.includes('/account');
    }
    
    return pathname === route;
  };
  
  const handlePress = (route) => {
    // For home, check if we're already there before navigating
    if (route === '/(tabs)/home') {
      // Only navigate if we're NOT already on the home page
      if (!isActive(route)) {
        router.push('/home');
      }
      return;
    }
    
    // For other routes, only navigate if not already there
    if (!isActive(route)) {
      router.push(route);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        {navItems.map((item, index) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={index}
              style={styles.navItem}
              onPress={() => handlePress(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? item.icon : item.iconOutline}
                size={24}
                color={active ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#007AFF',
  },
});