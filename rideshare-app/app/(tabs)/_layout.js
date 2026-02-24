import React from "react";
import { View } from "react-native";
import { Tabs, Redirect, useSegments } from "expo-router";
import { useAuth } from "../../src/auth/AuthProvider";
import NavBar from "../components/nav-bar"
import { commonStyles } from "../../ui/styles/commonStyles";

export default function TabsLayout() {
  const { user, initializing } = useAuth();
  const segments = useSegments();

  if (initializing) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const isChatScreen = segments.includes("messages") && segments.includes("chat");
  const isProfilePage = segments.includes("account") && segments.includes("profilepage");

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.container}>
        <Tabs 
          screenOptions={{ 
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="home" options={{ title: "Home" }} />
          <Tabs.Screen name="account" options={{ title: "Account" }} />
          <Tabs.Screen name="messages" options={{ title: "Messages" }} />
        </Tabs>
      </View>

      {!isChatScreen && !isProfilePage && <NavBar />}
    </View>
  );
}