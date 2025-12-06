import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import dayjs from "dayjs";
import { fetchAllAnnouncements } from "../Service/functions";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenHeader from "../Components/ScreenHeader";
import HeaderNotificationButton from "../Components/HeaderNotificationButton";

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
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadAnnouncements = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setRefreshing(isRefreshing);

      const data = await fetchAllAnnouncements();
      
      const formatted: Announcement[] = data.map((item: any) => ({
        id: item.id,
        title: item.title || "Untitled",
        description: item.description || "",
        sender: item.sender || "Admin",
        createdAt: item.createdAt || new Date(),
      }));

      setAllAnnouncements(formatted);

      const today = dayjs();
      const todayData = formatted.filter((a) =>
        dayjs(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt).isSame(today, "day")
      );
      setTodayAnnouncements(todayData);

    } catch (e) {
      console.log("Error loading announcements:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const formatDate = (date: any) => {
    if (!date) return "";
    return date.toDate
      ? dayjs(date.toDate()).format("DD MMM YYYY, hh:mm A")
      : dayjs(date).format("DD MMM YYYY, hh:mm A");
  };

  const getRelativeTime = (date: any) => {
    if (!date) return "";
    const now = dayjs();
    const announcementDate = date.toDate 
      ? dayjs(date.toDate())
      : dayjs(date);
    
    const diffMinutes = now.diff(announcementDate, 'minute');
    const diffHours = now.diff(announcementDate, 'hour');
    const diffDays = now.diff(announcementDate, 'day');
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return formatDate(date);
    }
  };

  const handleAnnouncementPress = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setShowDetailModal(true);
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const isToday = dayjs(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).isSame(dayjs(), "day");
    
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isToday && styles.todayCard
        ]}
        onPress={() => handleAnnouncementPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Icon name="campaign" size={20} color="#2196F3" style={styles.cardIcon} />
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Icon name="person" size={14} color="#666" />
            <Text style={styles.senderText}>{item.sender}</Text>
          </View>
          <View style={styles.footerInfo}>
            <Icon name="access-time" size={14} color="#666" />
            <Text style={styles.timeText}>{getRelativeTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDetailModal}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Announcement Details</Text>
              <Text style={styles.modalSubtitle}>
                {selectedAnnouncement && formatDate(selectedAnnouncement.createdAt)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {selectedAnnouncement && (
              <>
                <View style={styles.detailHeader}>
                  <Icon name="campaign" size={24} color="#2196F3" />
                  <Text style={styles.detailTitle}>{selectedAnnouncement.title}</Text>
                </View>
                
                <View style={styles.senderContainer}>
                  <Icon name="person" size={16} color="#666" />
                  <Text style={styles.detailSender}>From: {selectedAnnouncement.sender}</Text>
                </View>
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Message:</Text>
                  <Text style={styles.descriptionText}>{selectedAnnouncement.description}</Text>
                </View>
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const NoDataCard = ({ message }: { message: string }) => (
    <View style={styles.emptyContainer}>
      <Icon name="campaign" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>
        {message === "No Announcements today" 
          ? "No Announcements Today" 
          : "No Announcements Found"}
      </Text>
      <Text style={styles.emptyText}>
        {message === "No Announcements today"
          ? "Check back later for new announcements"
          : "Announcements will appear here when posted"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Announcements"
        subtitle="Stay informed about the latest updates from school."
        iconName="campaign"
        iconColor="#9C27B0"
        actions={<HeaderNotificationButton />}
      />

      {/* Tab Container */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "today" && styles.activeTab]}
          onPress={() => setActiveTab("today")}
        >
          <Text style={[styles.tabText, activeTab === "today" && styles.activeTabText]}>
            Today
          </Text>
          {todayAnnouncements.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{todayAnnouncements.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "today" ? (
            todayAnnouncements.length === 0 ? (
              <NoDataCard message="No Announcements today" />
            ) : (
              <FlatList
                data={todayAnnouncements}
                keyExtractor={(item) => item.id}
                renderItem={renderAnnouncement}
                scrollEnabled={false}
                contentContainerStyle={styles.listContainer}
              />
            )
          ) : allAnnouncements.length === 0 ? (
            <NoDataCard message="No Announcements Found" />
          ) : (
            <FlatList
              data={allAnnouncements}
              keyExtractor={(item) => item.id}
              renderItem={renderAnnouncement}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </ScrollView>
      </View>

      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container and Layout
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    flex: 1,
    marginTop: 18,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Tab Container
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
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
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
  tabBadge: {
    position: "absolute",
    top: -4,
    right: 10,
    backgroundColor: "#F44336",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },

  // Announcement Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  todayBadge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  todayBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  desc: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f4",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  timeText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    fontStyle: "italic",
  },

  // List Container
  listContainer: {
    paddingBottom: 20,
  },

  // Empty State
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

  // Loading State
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

  // Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 12,
    flex: 1,
  },
  senderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  detailSender: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
    fontWeight: "500",
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: "#495057",
    lineHeight: 24,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Announcements;
