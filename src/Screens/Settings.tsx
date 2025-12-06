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
import Icon from "react-native-vector-icons/Ionicons";
import { auth } from "../Service/firebase";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import ScreenHeader from "../Components/ScreenHeader";
import HeaderNotificationButton from "../Components/HeaderNotificationButton";

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
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconChip}>
          <Icon name={icon} size={18} color="#1D4ED8" />
        </View>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Settings"
        subtitle="Personalize your experience."
        iconName="settings"
        iconColor="#1D4ED8"
        actions={<HeaderNotificationButton />}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Logged in as</Text>
          <Text style={styles.heroEmail}>
            {auth.currentUser?.email ?? "parent@example.com"}
          </Text>
          <Text style={styles.heroSubtext}>
            Manage notifications, privacy, and school contacts from a single place.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionCard}>
          <SettingItem
            icon="key-outline"
            title="Reset Password"
            subtitle="Send reset link to email"
            right={<Icon name="chevron-forward" size={20} color="#94A3B8" />}
            onPress={handleResetPassword}
          />
          <SettingItem
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out from your account"
            right={<Icon name="chevron-forward" size={20} color="#ef4444" />}
            onPress={handleLogout}
          />
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
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
        </View>

        <Text style={styles.sectionTitle}>School Info</Text>
        <View style={styles.sectionCard}>
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

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.cardTitle}>App Version</Text>
            <Text style={styles.version}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginBottom : 16
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#94A3B8",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroEmail: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  heroSubtext: {
    marginTop: 8,
    color: "#CBD5F5",
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5EAF0",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  version: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 5,
  },
});
