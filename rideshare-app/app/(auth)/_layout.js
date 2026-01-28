import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthProvider";

export default function AuthLayout() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
