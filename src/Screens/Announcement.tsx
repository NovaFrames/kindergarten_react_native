import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import dayjs from "dayjs";
import { fetchAllAnnouncements } from "../Service/functions";

interface Announcement {
  id: string;
  title: string;
  description: string;
  sender: string;
  createdAt: any;
}

const Announcements: React.FC = () => {
  const [todayAnnouncements, setTodayAnnouncements] = useState<Announcement[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "all">("today");

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await fetchAllAnnouncements();
        
        const formatted: Announcement[] = data.map((item: any) => ({
          id: item.id,
          title: item.title || "Untitled",
          description: item.description || "",
          sender: "Admin",
          createdAt: item.createdAt || new Date(),
        }));

        setAllAnnouncements(formatted);

        const today = dayjs();
        const todayData = formatted.filter((a) =>
          dayjs(a.createdAt.toDate()).isSame(today, "day")
        );
        setTodayAnnouncements(todayData);

      } catch (e) {
        console.log("Error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const formatDate = (date: any) => {
    if (!date) return "";
    return date.toDate
      ? dayjs(date.toDate()).format("DD MMM YYYY")
      : dayjs(date).format("DD MMM YYYY");
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedAnnouncement(item)}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.date}>
        {formatDate(item.createdAt)} • {item.sender}
      </Text>
      <Text style={styles.desc}>
        {item.description.length > 100
          ? item.description.slice(0, 100) + "..."
          : item.description}
      </Text>
    </TouchableOpacity>
  );

  const NoDataCard = ({ message }: { message: string }) => (
    <View style={styles.noData}>
      <Text style={styles.noDataText}>{message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "today" && styles.activeTab]}
          onPress={() => setActiveTab("today")}
        >
          <Text style={styles.tabText}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={styles.tabText}>All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <>
          {activeTab === "today" ? (
            todayAnnouncements.length === 0 ? (
              <NoDataCard message="No Announcements today" />
            ) : (
              <FlatList
                data={todayAnnouncements}
                keyExtractor={(item) => item.id}
                renderItem={renderAnnouncement}
              />
            )
          ) : allAnnouncements.length === 0 ? (
            <NoDataCard message="No Announcements Found" />
          ) : (
            <FlatList
              data={allAnnouncements}
              keyExtractor={(item) => item.id}
              renderItem={renderAnnouncement}
            />
          )}
        </>
      )}

    </View>
  );
};

export default Announcements;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: "row", marginBottom: 12,marginTop:8 },
  tabButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: { color: "#ffffff", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  date: { fontSize: 12, color: "#555", marginVertical: 4 },
  desc: { fontSize: 14, color: "#555" },
  noData: {
    padding: 20,
    marginTop: 40,
    alignItems: "center",
  },
  noDataText: { fontSize: 16, color: "#777" },
});
