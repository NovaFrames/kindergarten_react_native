// src/screens/Attendance.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import dayjs from "dayjs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MiniAttendance from "../Components/MiniAttendance/MiniAttendance";
import { fetchAttendanceForStudent, fetchStudentDoc, fetchUser } from "../Service/functions";

// Define the attendance record type
type StatusType = "Present" | "Absent" | "Halfday";

interface AttendanceRecord {
  id: string;
  date: string;
  status: StatusType;
  // Optional morning/afternoon if you want to track half-day sessions
  morning?: boolean;
  afternoon?: boolean;
}

// Props for MiniAttendance component
interface MiniAttendanceProps {
  records: AttendanceRecord[];
  onPressSeeAll: () => void;
}

const Attendance: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      try {
        const user = await fetchUser();
        if (!user) return;

        const student = await fetchStudentDoc(user);
        if (!student?.id || !student?.studentClass) return;

        const records = await fetchAttendanceForStudent(student.id, student.studentClass);

        // Map the status to match union type and include optional morning/afternoon
        const formatted: AttendanceRecord[] = records.map((r) => ({
          id: r.id,
          date: r.date,
          morning: r.morning,
          afternoon: r.afternoon,
          status:
            r.status === "Present" || r.status === "Absent" || r.status === "Halfday"
              ? r.status
              : "Absent", // fallback
        }));

        setAttendanceData(formatted);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 8 }}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Pass correct prop 'records' to MiniAttendance */}
      <MiniAttendance
        records={attendanceData}
        onPressSeeAll={() => {
          console.log("See all pressed");
        }}
      />

      <Text style={styles.headerText}>All Records</Text>
      <FlatList
        data={attendanceData.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordRow}>
            <Text style={styles.dateText}>{dayjs(item.date).format("DD MMM YYYY")}</Text>
            <View style={[styles.statusBox, { backgroundColor: getStatusColor(item.status) + "22" }]}>
              <Icon name={getStatusIcon(item.status)} size={20} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status === "Halfday" ? "Half Day" : item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
};

const getStatusColor = (status: StatusType | string) => {
  switch (status) {
    case "Present":
      return "#4CAF50";
    case "Halfday":
      return "#FFC107";
    case "Absent":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
};

const getStatusIcon = (status: StatusType | string) => {
  switch (status) {
    case "Present":
      return "check-circle";
    case "Halfday":
      return "clock";
    case "Absent":
      return "close-circle";
    default:
      return "clock";
  }
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerText: { fontWeight: "600", fontSize: 18, marginTop: 24, marginBottom: 12 },
  recordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#EEE" },
  dateText: { fontWeight: "500" },
  statusBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { marginLeft: 6, fontWeight: "600" },
});

export default Attendance;
