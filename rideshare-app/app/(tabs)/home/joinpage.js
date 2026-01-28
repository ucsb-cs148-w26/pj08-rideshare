import { View, Text, StyleSheet } from "react-native";

export default function JoinPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Join Page (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
  },
});
