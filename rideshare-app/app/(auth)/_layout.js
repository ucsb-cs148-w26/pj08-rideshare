import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthProvider";
import { StripeProvider } from "@stripe/stripe-react-native";
import STRIPE_CONFIG from "../../src/stripeConfig";

export default function AuthLayout() {
  const { user, initializing, suppressAuthRedirect } = useAuth();

  if (initializing) return null;

  if (user && !suppressAuthRedirect) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <StripeProvider publishableKey={STRIPE_CONFIG.PUBLISHABLE_KEY}>
      <Stack screenOptions={{ headerShown: false }} />
    </StripeProvider>
  );
}