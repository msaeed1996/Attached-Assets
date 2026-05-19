import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { isOnboarded, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isOnboarded) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/(tabs)" />;
}
