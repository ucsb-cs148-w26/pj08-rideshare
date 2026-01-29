import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthProvider";

export default function TabsLayout() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
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
  );
}