import React from "react";
import { View, Text, Button } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../Service/firebase";

export default function LoginScreen() {
  const handleLogin = () => {
    signInWithEmailAndPassword(auth, "test@test.com", "123456");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login Screen</Text>
      <Button title="Login Dummy User" onPress={handleLogin} />
    </View>
  );
}
