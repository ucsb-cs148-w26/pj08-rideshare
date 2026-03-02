import { Stack } from "expo-router";
import { AuthProvider } from "../src/auth/AuthProvider";
import { ActiveRideProvider } from "../src/context/ActiveRideContext";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ActiveRideProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ActiveRideProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
