import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../Service/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Handle notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // 🚀 Request Notification Permission + Register Device
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      alert("Push notifications require a physical device!");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permission for notifications not granted!");
      return;
    }
  };

  // 📌 Save Expo Token After Login
  const saveExpoPushToken = async (uid: string) => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      await setDoc(
        doc(db, "expoTokens", uid),
        {
          uid,
          expoPushToken: token,
          platform: Platform.OS,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Expo Token saved:", token);
    } catch (error) {
      console.log("Error saving token:", error);
    }
  };

  // 🔐 Login + Token Save
  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await saveExpoPushToken(res.user.uid);

      alert("Login Success + Token Stored");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7a7a7a"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7a7a7a"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#007aff",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
