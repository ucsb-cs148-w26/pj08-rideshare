import React from "react";
import { View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthProvider";
import NavBar from "../components/nav-bar"
import { commonStyles } from "../../ui/styles/commonStyles";

export default function TabsLayout() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

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

      <NavBar />
    </View>
  );
}