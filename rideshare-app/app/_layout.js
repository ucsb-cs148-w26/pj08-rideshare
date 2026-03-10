import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/auth/AuthProvider";
import { ActiveRideProvider } from "../src/context/ActiveRideContext";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Asset } from "expo-asset";

const imageAssets = [
  require("../assets/cs148_logo.png"),
  require("../assets/defaulticon_grs (1).png"),
  require("../assets/safari_pfp (1).png"),
  require("../assets/spacesuit_pfp (1).png"),
  require("../assets/sporty.png"),
  require("../assets/scuba.png"),
];

export default function RootLayout() {
  useEffect(() => {
    Asset.loadAsync(imageAssets).catch(() => {});
  }, []);

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
