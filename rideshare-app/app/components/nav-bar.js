import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useActiveRide } from '../../src/context/ActiveRideContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../src/firebase';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeRide } = useActiveRide();

  // ✅ hooks at the top level of the component, NOT inside map
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.cancelled) return;
        const lastReadAt = data.lastReadAt?.[user.uid];
        const lastReadDate = lastReadAt?.toDate ? lastReadAt.toDate() : (lastReadAt ? new Date(lastReadAt) : null);
        const lastMsgDate = data.lastMessageTime?.toDate ? data.lastMessageTime.toDate() : (data.lastMessageTime ? new Date(data.lastMessageTime) : null);
        const isUnread =
          !!data.lastMessage &&
          data.lastMessageSenderId !== user.uid &&
          (!lastReadDate || (lastMsgDate && lastMsgDate > lastReadDate));
        if (isUnread) count++;
      });
      setUnreadCount(count);
    });

    return () => unsub();
  }, []);

  // ✅ navItems defined after hooks, uses unreadCount
  const navItems = [
    {
      name: 'Messages',
      icon: 'chatbubbles',
      iconOutline: 'chatbubbles-outline',
      route: '/(tabs)/messages',
      badge: unreadCount,
    },
    {
      name: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
      route: '/(tabs)/home',
    },
    ...(activeRide
      ? [
          {
            name: 'Ride',
            icon: 'car-sport',
            iconOutline: 'car-sport-outline',
            route: '/(tabs)/home/duringride',
            accentColor: '#22c55e',
          },
        ]
      : []),
    {
      name: 'History',
      icon: 'time',
      iconOutline: 'time-outline',
      route: '/(tabs)/history',
    },
    {
      name: 'Profile',
      icon: 'person',
      iconOutline: 'person-outline',
      route: '/(tabs)/account/accountpage',
    },
  ];

  const isActive = (route) => {
    if (route === '/(tabs)/messages') {
      return pathname.includes('/messages');
    }
    if (route === '/(tabs)/home/duringride') {
      return pathname.includes('duringride');
    }
    if (route === '/(tabs)/home') {
      return (
        (pathname === '/(tabs)/home' ||
          pathname === '/home' ||
          pathname === '/(tabs)/home/' ||
          pathname === '/home/') &&
        !pathname.includes('hostpage') &&
        !pathname.includes('joinpage') &&
        !pathname.includes('duringride')
      );
    }
    if (route === '/(tabs)/history') {
      return pathname.includes('/history');
    }
    if (route === '/(tabs)/account/accountpage') {
      return pathname.includes('/account');
    }
    return pathname === route;
  };

  const handlePress = (route) => {
    if (route === '/(tabs)/home/duringride') {
      if (!isActive(route) && activeRide) {
        router.push({ pathname: '/(tabs)/home/duringride', params: activeRide });
      }
      return;
    }
    if (route === '/(tabs)/home') {
      if (!isActive(route)) router.push('/home');
      return;
    }
    if (!isActive(route)) router.push(route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        {navItems.map((item, index) => {
          const active = isActive(item.route);
          const activeColor = item.accentColor || '#007AFF';
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
                color={active ? activeColor : '#8E8E93'}
              />
              <Text style={[styles.navLabel, active && { color: activeColor }]}>
                {item.name}
              </Text>
              {/* ✅ unread badge for Messages */}
              {item.badge > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
              {/* live ride badge */}
              {item.accentColor && <View style={styles.liveBadge} />}
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
  liveBadge: {
    position: 'absolute',
    top: 4,
    right: '25%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: '20%',
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
