import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../Service/firebase";
import { doc, setDoc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Ask Permission + Create Notification Channel
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      alert("Must use physical device for Push Notifications!");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Push Notification permission not granted!");
      return;
    }

    // Android Channel for high priority notifications
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  };

  // Save Push Token in Firestore as an array
  const savePushToken = async (uid: string) => {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo Push Token:", token);

      // Store token as an array to support multiple devices
      await setDoc(
        doc(db, "fcmtokens", uid),
        {
          uid,
          expoPushTokens: arrayUnion(token), // Add token to array without duplicates
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Token saved successfully to array");
    } catch (error) {
      console.log("Error saving token:", error);
    }
  };

  // Login Function
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      await savePushToken(response.user.uid);
      alert("Login Successful!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F7FD" />
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.heroWrapper}>
            <View style={styles.gradientBlob} />
            <View style={styles.heroContent}>
              <Image
                style={styles.brandLogo}
                source={require("../../assets/icon.png")}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>Project</Text>
              <Text style={styles.brandSubtitle}>
                Welcome back! Please sign in to stay updated.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Parent Login</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Continue"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Having trouble signing in? Contact the teacher.
            </Text>
          </View>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              Need help? Contact School
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

// ------------------------------------------------------------------
// STYLES REMAIN THE SAME (your original styles)
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F7FD" },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  heroWrapper: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    overflow: "hidden",
  },
  gradientBlob: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#BFDBFE",
    opacity: 0.4,
  },
  heroContent: { alignItems: "center" },
  brandLogo: { width: 90, height: 90, marginBottom: 12 },
  brandTitle: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  brandSubtitle: { marginTop: 8, fontSize: 14, color: "#64748B", textAlign: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 6 },
  inputLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  forgotText: { fontSize: 13, color: "#4C74FF", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  button: {
    backgroundColor: "#4C74FF",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  helperText: { marginTop: 16, fontSize: 13, color: "#94A3B8", textAlign: "center" },
  secondaryButton: { marginTop: 24, alignSelf: "center" },
  secondaryButtonText: { fontSize: 15, color: "#1E40AF", fontWeight: "600" },
});
