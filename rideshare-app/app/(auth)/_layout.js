import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthProvider";

export default function AuthLayout() {
  const { user, initializing, suppressAuthRedirect } = useAuth();

  if (initializing) return null;

  if (user && !suppressAuthRedirect) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
