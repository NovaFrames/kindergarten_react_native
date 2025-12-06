import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { auth } from "../Service/firebase";
import { sendPasswordResetEmail, signOut } from "firebase/auth";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleResetPassword = async () => {
    if (auth.currentUser?.email) {
      try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        Alert.alert("Success", "Reset link sent to your email");
      } catch (err: any) {
        Alert.alert("Error", err.message);
      }
    } else {
      Alert.alert("Error", "No logged-in user.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been signed out!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const SettingItem = ({ icon, title, subtitle, right, onPress }: any) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.row}>
          <Icon name={icon} size={24} color="#4f46e5" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {right}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={darkMode ? ["#0f172a", "#1e293b"] : ["#f8fafc", "#e2e8f0"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>Settings</Text>
        <Text style={styles.emailText}>
          {auth.currentUser?.email ?? "Manage your preferences"}
        </Text>

        {/* 🔐 Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <SettingItem
          icon="key-outline"
          title="Reset Password"
          subtitle="Send reset link to email"
          right={<Icon name="chevron-forward" size={20} color="#6b7280" />}
          onPress={handleResetPassword}
        />
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          subtitle="Sign out from your account"
          right={<Icon name="chevron-forward" size={20} color="#ef4444" />}
          onPress={handleLogout}
        />

        {/* 🎨 Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <SettingItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle={darkMode ? "Enabled" : "Disabled"}
          right={
            <Switch
              value={darkMode}
              onValueChange={toggleTheme}
              trackColor={{ true: "#4f46e5" }}
            />
          }
        />

        {/* 🏫 School Info */}
        <Text style={styles.sectionTitle}>School Info</Text>
        <View style={styles.infoCard}>
          <SettingItem
            icon="call-outline"
            title="Phone"
            subtitle="+91-9876543210"
          />
          <SettingItem
            icon="mail-outline"
            title="Email"
            subtitle="novaframes@gmail.com"
          />
        </View>

        {/* 📱 About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <Text style={styles.subtitle}>App Version</Text>
          <Text style={styles.version}>1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  header: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 6,
    color: "#3b82f6",
  },
  emailText: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  subtitle: { fontSize: 13, color: "#6b7280" },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 15,
    borderRadius: 12,
  },
  version: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 5,
  },
});
