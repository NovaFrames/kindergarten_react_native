// screens/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../Service/firebase";
import MiniAttendance from "../Components/MiniAttendance/MiniAttendance";
import { fetchUser } from "../Service/functions";

const Dashboard = () => {
  const [studentClass, setStudentClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    const loadUser = async () => {
      const student = await fetchUser();
      if (student?.studentClass) {
        setStudentClass(student.studentClass);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome Parent!</Text>

      {/* Mini Attendance Card Only if data loaded */}
      {studentClass && <MiniAttendance studentClass={studentClass} />}

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.button}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    width: "90%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
