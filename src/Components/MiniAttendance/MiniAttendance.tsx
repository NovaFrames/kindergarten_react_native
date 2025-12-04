// Components/MiniAttendance/MiniAttendance.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { fetchUser, fetchAttendanceForStudent } from "../../Service/functions";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from "date-fns";

interface StudentAttendance {
  id: string;
  date: string;
  morning?: boolean;
  afternoon?: boolean;
  status: "Present" | "Absent" | "Halfday";
}

interface MiniAttendanceProps {
  studentClass: string;
}

const MiniAttendance: React.FC<MiniAttendanceProps> = ({ studentClass }) => {
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      const user = await fetchUser();
      if (!user?.id) return;

      const records = await fetchAttendanceForStudent(user.id, studentClass);

      // Use status from DB directly
      const formatted = records.map((r: any) => ({
        ...r,
        status: r.status ?? (r.morning && r.afternoon
          ? "Present"
          : r.morning || r.afternoon
          ? "Halfday"
          : "Absent"),
      }));

      setAttendanceData(formatted);
      setLoading(false);
    };

    loadAttendance();
  }, [studentClass]);

  // Compute current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5);

  const weekAttendance = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const record = attendanceData.find((r) => r.date === dateStr);
    return {
      date: dateStr,
      status: record ? record.status : "Not Marked",
      isToday: isToday(day),
    };
  });

  const countByStatus = (status: string) =>
    weekAttendance.filter((r) => r.status === status).length;

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance (This Week)</Text>

      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: "green" }]}>
          Present: {countByStatus("Present")}
        </Text>
        <Text style={[styles.summaryText, { color: "orange" }]}>
          Half Day: {countByStatus("Halfday")}
        </Text>
        <Text style={[styles.summaryText, { color: "red" }]}>
          Absent: {countByStatus("Absent")}
        </Text>
      </View>

      <FlatList
        data={weekAttendance}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={[styles.row, item.isToday && styles.todayRow]}>
            <Text style={styles.date}>{format(new Date(item.date), "EEE dd")}</Text>
            <Text
              style={[
                styles.status,
                item.status === "Present"
                  ? { color: "green" }
                  : item.status === "Halfday"
                  ? { color: "orange" }
                  : item.status === "Absent"
                  ? { color: "red" }
                  : { color: "#999" }, // Not Marked
              ]}
            >
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default MiniAttendance;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 20,
  },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  summary: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryText: { fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  todayRow: {
    backgroundColor: "#e6f7ff",
    borderRadius: 8,
  },
  date: { fontSize: 16 },
  status: { fontWeight: "600", fontSize: 16 },
});
