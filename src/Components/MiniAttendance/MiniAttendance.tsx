// Components/MiniAttendance/MiniAttendance.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { fetchUser, fetchAttendanceForStudent } from "../../Service/functions";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from "date-fns";

interface StudentAttendance {
  id: string;
  date: string;
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

      const formatted = records.map((r: any) => ({
        ...r,
        status:
          r.status ??
          (r.morning && r.afternoon
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

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 6);

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

  const statusColorMap: Record<string, string> = {
    Present: "#22C55E",
    Halfday: "#F97316",
    Absent: "#EF4444",
    "Not Marked": "#94A3B8",
  };

  const todayStatus =
    weekAttendance.find((day) => day.isToday)?.status || "Not Marked";
  const todayDateText = format(new Date(), "EEEE, MMM d");

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.todayCard,
          { borderColor: statusColorMap[todayStatus] || "#CBD5F5" },
        ]}
      >
        <View>
          <Text style={styles.todayLabel}>Today</Text>
          <Text
            style={[
              styles.todayStatus,
              { color: statusColorMap[todayStatus] || "#64748B" },
            ]}
          >
            {todayStatus}
          </Text>
          <Text style={styles.todayDate}>{todayDateText}</Text>
        </View>
        <View style={styles.summaryChips}>
          {[
            { label: "Present", value: countByStatus("Present"), statusKey: "Present" },
            { label: "Half Day", value: countByStatus("Halfday"), statusKey: "Halfday" },
            { label: "Absent", value: countByStatus("Absent"), statusKey: "Absent" },
          ].map((item) => (
            <View key={item.label} style={styles.summaryChip}>
              <View
                style={[
                  styles.summaryDot,
                  { backgroundColor: statusColorMap[item.statusKey] },
                ]}
              />
              <Text style={styles.summaryChipText}>
                {item.value} {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.weekLabel}>This Week</Text>
      <View style={styles.timeline}>
        {weekAttendance.map((item) => (
          <View
            key={item.date}
            style={[
              styles.dayCard,
              item.isToday && styles.dayCardToday,
              {
                borderColor: statusColorMap[item.status] || "#E5EAF0",
              },
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                item.isToday && styles.dayLabelToday,
              ]}
            >
              {format(new Date(item.date), "EEE")}
            </Text>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusColorMap[item.status] || "#E5EAF0" },
              ]}
            />
            <Text style={styles.dayDate}>
              {format(new Date(item.date), "dd")}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default MiniAttendance;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 8,
  },
  todayCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  todayLabel: {
    color: "#CBD5F5",
    fontSize: 14,
    marginBottom: 4,
  },
  todayStatus: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  todayDate: {
    color: "#CBD5F5",
    fontSize: 13,
  },
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 8,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  summaryChipText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
  weekLabel: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dayCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  dayCardToday: {
    backgroundColor: "#EEF2FF",
  },
  dayLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  dayLabelToday: {
    color: "#1D4ED8",
    fontWeight: "600",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
});
