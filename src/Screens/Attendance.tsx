// src/screens/Attendance.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isBetween from "dayjs/plugin/isBetween";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  fetchAttendanceForStudent,
  fetchStudentDoc,
  fetchUser,
} from "../Service/functions";
import ScreenHeader from "../Components/ScreenHeader";
import HeaderNotificationButton from "../Components/HeaderNotificationButton";

dayjs.extend(weekOfYear);
dayjs.extend(isBetween);

type StatusType = "Present" | "Absent" | "Halfday" | "Not Marked";

interface AttendanceRecord {
  id: string;
  date: string;
  status: StatusType;
}

interface WeekDay {
  date: string;
  day: string;
  status: StatusType;
  isToday: boolean;
  dateObj: Date;
}

interface MonthDay {
  date: string;
  dayOfMonth: number;
  dayName: string;
  status: StatusType;
  isToday: boolean;
  isCurrentMonth: boolean;
}

const Attendance: React.FC = () => {
  // State variables
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentClass, setStudentClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Filter states for month view
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Load attendance data
  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const user = await fetchUser();
        
        if (!user) {
          setErrorMessage("No user found. Please login again.");
          return;
        }

        const studentIdentifier = user.id || user.uid;
        
        if (!studentIdentifier) {
          setErrorMessage("Student ID not found in user data");
          return;
        }

        let className = user.studentClass || "";
        
        if (!className) {
          const student = await fetchStudentDoc(user);
          
          if (student && student.studentClass) {
            className = student.studentClass;
          } else {
            setErrorMessage("Could not determine student class");
            return;
          }
        }

        setStudentClass(className);
        setStudentId(studentIdentifier);

        const records = await fetchAttendanceForStudent(
          studentIdentifier,
          className
        );

        
        if (records.length === 0) {
          setErrorMessage("No attendance records found for this student");
        }

        const formatted: AttendanceRecord[] = records.map((r: any) => {
          let status: StatusType = "Not Marked";
          
          if (r.status) {
            status = r.status;
          } else if (r.morning && r.afternoon) {
            status = "Present";
          } else if (r.morning || r.afternoon) {
            status = "Halfday";
          } else {
            status = "Absent";
          }
          
          return {
            id: r.id || Math.random().toString(),
            date: r.date,
            status: status,
          };
        });

        setAttendanceData(formatted);
        
      } catch (error: any) {
        console.error("Error loading attendance:", error);
        setErrorMessage(`Error: ${error.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  // Calculate current week data for TABLE VIEW
  const currentWeekData = useMemo(() => {
    if (!attendanceData.length) return [];

    const today = dayjs();
    const startOfWeek = today.startOf("week");
    const endOfWeek = today.endOf("week");

    const weekDays: WeekDay[] = [];
    let currentDay = startOfWeek;

    for (let i = 0; i < 7; i++) {
      const dateStr = currentDay.format("YYYY-MM-DD");
      const record = attendanceData.find((r) => r.date === dateStr);
      
      weekDays.push({
        date: dateStr,
        day: currentDay.format("ddd"),
        status: record?.status || "Not Marked",
        isToday: currentDay.isSame(today, "day"),
        dateObj: currentDay.toDate(),
      });
      
      currentDay = currentDay.add(1, "day");
    }

    return weekDays;
  }, [attendanceData]);

  const currentMonthData = useMemo(() => {
    if (!attendanceData.length) return [];

    const monthDays: MonthDay[] = [];
    const today = dayjs();
    const currentMonth = dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`);
    
    const firstDay = currentMonth.startOf("month");
    const lastDay = currentMonth.endOf("month");
    
    let currentDay = firstDay.startOf("week");
    
    while (currentDay.isBefore(lastDay.endOf("week"))) {
      const dateStr = currentDay.format("YYYY-MM-DD");
      const record = attendanceData.find((r) => r.date === dateStr);
      const isCurrentMonth = currentDay.month() + 1 === selectedMonth;
      
      monthDays.push({
        date: dateStr,
        dayOfMonth: currentDay.date(),
        dayName: currentDay.format("ddd"),
        status: isCurrentMonth ? (record?.status || "Not Marked") : "Not Marked",
        isToday: currentDay.isSame(today, "day"),
        isCurrentMonth,
      });
      
      currentDay = currentDay.add(1, "day");
    }

    return monthDays;
  }, [attendanceData, selectedYear, selectedMonth]);

  // Today's attendance
  const todayAttendance = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return attendanceData.find((record) => record.date === today);
  }, [attendanceData]);

  // Statistics
  const weekStats = useMemo(() => {
    const today = dayjs();
    const startOfWeek = today.startOf("week");
    const endOfWeek = today.endOf("week");

    const weekRecords = attendanceData.filter((record) => {
      const recordDate = dayjs(record.date);
      return recordDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
    });

    return {
      present: weekRecords.filter((r) => r.status === "Present").length,
      halfday: weekRecords.filter((r) => r.status === "Halfday").length,
      absent: weekRecords.filter((r) => r.status === "Absent").length,
      total: weekRecords.length,
    };
  }, [attendanceData]);

  const monthStats = useMemo(() => {
    const monthRecords = attendanceData.filter((record) => {
      const recordDate = dayjs(record.date);
      return (
        recordDate.year() === selectedYear &&
        recordDate.month() + 1 === selectedMonth
      );
    });

    return {
      present: monthRecords.filter((r) => r.status === "Present").length,
      halfday: monthRecords.filter((r) => r.status === "Halfday").length,
      absent: monthRecords.filter((r) => r.status === "Absent").length,
      total: monthRecords.length,
    };
  }, [attendanceData, selectedYear, selectedMonth]);

  // Generate years and months for dropdown
  const yearOptions = Array.from({ length: 7 }, (_, i) => {
    const year = dayjs().year() - 3 + i;
    return { label: year.toString(), value: year };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      label: dayjs().month(i).format("MMMM"),
      value: month,
    };
  });

  // Render today's attendance status
  const renderTodayStatus = () => {
    const status = todayAttendance?.status || "Not Marked";
    const statusColor = getStatusColor(status);
    return (
      <View style={styles.todayHero}>
        <View style={styles.todayHeroHeader}>
          <View>
            <Text style={styles.heroLabel}>Today's status</Text>
            <Text style={styles.heroDate}>{dayjs().format("dddd, MMM D")}</Text>
          </View>
          <View style={[styles.heroBadge, { borderColor: statusColor }]}>
            <Text style={[styles.heroBadgeText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>
        <Text style={styles.heroStatusText}>
          {status === "Not Marked"
            ? "Awaiting attendance update"
            : status === "Present"
            ? "Great job staying consistent!"
            : status === "Halfday"
            ? "Half day marked. Please confirm with teacher if needed."
            : "Marked absent. Reach out to the teacher if there’s an issue."}
        </Text>
        <View style={styles.heroChips}>
          {[
            { label: "Present", value: weekStats.present, color: "#4CAF50" },
            { label: "Half Day", value: weekStats.halfday, color: "#FFC107" },
            { label: "Absent", value: weekStats.absent, color: "#F44336" },
          ].map((chip) => (
            <View key={chip.label} style={styles.heroChip}>
              <View
                style={[styles.heroChipDot, { backgroundColor: chip.color }]}
              />
              <Text style={styles.heroChipText}>
                {chip.value} {chip.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render week view as TABLE
  const renderWeekView = () => (
    <View style={styles.tabContent}>
      {renderTodayStatus()}

      <Text style={styles.sectionHeading}>Week overview</Text>
      <View style={styles.weekTimeline}>
        {currentWeekData.map((day) => (
          <View
            key={day.date}
            style={[
              styles.timelineCard,
              day.isToday && styles.timelineCardToday,
            ]}
          >
            <Text
              style={[
                styles.timelineDay,
                day.isToday && styles.timelineDayToday,
              ]}
            >
              {day.day}
            </Text>
            <Text style={styles.timelineDate}>
              {dayjs(day.date).format("DD MMM")}
            </Text>
            <View style={styles.timelineStatus}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: getStatusColor(day.status) },
                ]}
              />
              <Text
                style={[
                  styles.timelineStatusText,
                  { color: getStatusColor(day.status) },
                ]}
              >
                {day.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Render month view
  const renderMonthView = () => (
    <View style={styles.tabContent}>
      <View style={styles.monthFilters}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowYearModal(true)}
        >
          <Text style={styles.filterChipText}>{selectedYear}</Text>
          <Icon name="chevron-down" size={18} color="#1D4ED8" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowMonthModal(true)}
        >
          <Text style={styles.filterChipText}>
            {dayjs().month(selectedMonth - 1).format("MMMM")}
          </Text>
          <Icon name="chevron-down" size={18} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      <View style={styles.monthSummaryRow}>
        {[
          { label: "Present", value: monthStats.present, color: "#4CAF50" },
          { label: "Half Day", value: monthStats.halfday, color: "#FFC107" },
          { label: "Absent", value: monthStats.absent, color: "#F44336" },
        ].map((chip) => (
          <View key={chip.label} style={styles.monthSummaryCard}>
            <Text style={styles.monthSummaryValue}>{chip.value}</Text>
            <Text style={[styles.monthSummaryLabel, { color: chip.color }]}>
              {chip.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.monthGrid}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text key={day} style={styles.monthDayHeader}>
            {day}
          </Text>
        ))}

        {currentMonthData.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.monthDayBox,
              !day.isCurrentMonth && styles.otherMonthDay,
              day.isToday && styles.todayMonthBox,
            ]}
            disabled={!day.isCurrentMonth}
          >
            <Text
              style={[
                styles.monthDateText,
                !day.isCurrentMonth && styles.otherMonthText,
                day.isToday && styles.todayDateText,
              ]}
            >
              {day.dayOfMonth}
            </Text>
            <View
              style={[
                styles.monthStatusIndicator,
                { backgroundColor: getStatusColor(day.status) },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.legendContainer}>
        {[
          { label: "Present", color: "#4CAF50" },
          { label: "Half Day", color: "#FFC107" },
          { label: "Absent", color: "#F44336" },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Fixed Modal for year selection (no scroll inside modal)
  const renderYearModal = () => (
    <Modal
      visible={showYearModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowYearModal(false)}
    >
      <View style={styles.modalFixedOverlay}>
        <View style={styles.modalFixedContent}>
          <View style={styles.modalFixedHeader}>
            <Text style={styles.modalFixedTitle}>Select Year</Text>
            <TouchableOpacity onPress={() => setShowYearModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Scrollable list inside the modal */}
          <FlatList
            data={yearOptions}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalFixedOption,
                  selectedYear === item.value && styles.modalFixedSelectedOption,
                ]}
                onPress={() => {
                  setSelectedYear(item.value);
                  setShowYearModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalFixedOptionText,
                    selectedYear === item.value && styles.modalFixedSelectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {selectedYear === item.value && (
                  <Icon name="check" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Fixed Modal for month selection (no scroll inside modal)
  const renderMonthModal = () => (
    <Modal
      visible={showMonthModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMonthModal(false)}
    >
      <View style={styles.modalFixedOverlay}>
        <View style={styles.modalFixedContent}>
          <View style={styles.modalFixedHeader}>
            <Text style={styles.modalFixedTitle}>Select Month</Text>
            <TouchableOpacity onPress={() => setShowMonthModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={monthOptions}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalFixedOption,
                  selectedMonth === item.value && styles.modalFixedSelectedOption,
                ]}
                onPress={() => {
                  setSelectedMonth(item.value);
                  setShowMonthModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalFixedOptionText,
                    selectedMonth === item.value && styles.modalFixedSelectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {selectedMonth === item.value && (
                  <Icon name="check" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Attendance"
          subtitle="Track daily and monthly attendance records."
          iconName="calendar-today"
          iconColor="#2563EB"
          actions={<HeaderNotificationButton />}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Attendance</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setErrorMessage("");
              setTimeout(() => {
                const loadAttendance = async () => {
                  try {
                    const user = await fetchUser();
                    if (!user) return;
                    
                    const studentIdentifier = user.id || user.uid;
                    const className = user.studentClass || "";
                    
                    if (studentIdentifier && className) {
                      const records = await fetchAttendanceForStudent(studentIdentifier, className);
                      const formatted: AttendanceRecord[] = records.map((r: any) => ({
                        id: r.id || Math.random().toString(),
                        date: r.date,
                        status: r.status || "Not Marked",
                      }));
                      setAttendanceData(formatted);
                      setErrorMessage("");
                    }
                  } catch (error: any) {
                    setErrorMessage("Failed to reload data");
                  } finally {
                    setLoading(false);
                  }
                };
                loadAttendance();
              }, 100);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Attendance"
        subtitle="Track daily and monthly attendance records."
        iconName="calendar-today"
        iconColor="#2563EB"
        actions={<HeaderNotificationButton />}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "week" && styles.activeTab]}
          onPress={() => setActiveTab("week")}
        >
          <Text
            style={[styles.tabText, activeTab === "week" && styles.activeTabText]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "month" && styles.activeTab]}
          onPress={() => setActiveTab("month")}
        >
          <Text
            style={[styles.tabText, activeTab === "month" && styles.activeTabText]}
          >
            Month
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {attendanceData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Attendance Records</Text>
            <Text style={styles.emptyText}>
              No attendance has been marked for you yet.
            </Text>
          </View>
        ) : (
          activeTab === "week" ? renderWeekView() : renderMonthView()
        )}
      </ScrollView>

      {renderYearModal()}
      {renderMonthModal()}
    </View>
  );
};

const getStatusColor = (status: StatusType) => {
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

const getStatusIcon = (status: StatusType) => {
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
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#2196F3",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tabContent: {
    marginBottom: 32,
    gap: 20,
  },
  sectionHeading: {
    fontSize: 16,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  todayHero: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  todayHeroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 13,
    color: "#CBD5F5",
    letterSpacing: 0.5,
  },
  heroDate: {
    fontSize: 16,
    color: "#E2E8F0",
    fontWeight: "600",
  },
  heroBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  heroStatusText: {
    fontSize: 16,
    color: "#E2E8F0",
    lineHeight: 22,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  heroChipText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
  weekTimeline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timelineCard: {
    flexBasis: "30%",
    flexGrow: 1,
    minWidth: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    padding: 14,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  timelineCardToday: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EEF2FF",
  },
  timelineDay: {
    fontSize: 13,
    color: "#6B7280",
  },
  timelineDayToday: {
    color: "#1D4ED8",
    fontWeight: "600",
  },
  timelineDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  timelineStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  timelineStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  monthFilters: {
    flexDirection: "row",
    gap: 12,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  filterChipText: {
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5EAF0",
  },
  monthSummaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  monthSummaryCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5EAF0",
  },
  monthSummaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  monthSummaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  monthDayHeader: {
    width: "14.28%",
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  monthDayBox: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  todayMonthBox: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  monthDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  otherMonthText: {
    color: "#AAA",
    fontWeight: "400",
  },
  todayDateText: {
    color: "#1D4ED8",
  },
  monthStatusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  monthStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  // Fixed Modal Styles
  modalFixedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalFixedContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "80%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalFixedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalFixedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalFixedOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalFixedSelectedOption: {
    backgroundColor: "#F5F9FF",
  },
  modalFixedOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalFixedSelectedOptionText: {
    color: "#2196F3",
    fontWeight: "600",
  },
});

export default Attendance;
