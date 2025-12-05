// screens/Dashboard.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../Service/firebase";
import MiniAttendance from "../Components/MiniAttendance/MiniAttendance";
import MiniHomework from "../Components/MiniHomework/MiniHomework";
import { fetchUser, fetchAnnouncements, Announcement } from "../Service/functions";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MiniAnnouncement from "../Components/MiniAnnouncements/MiniAnnouncements";
import MiniGrades from "../Components/MiniGrades/MiniGrades";
import MiniEvents from "../Components/MiniEvents/MiniEvents";
import MiniGallery from "../Components/MiniGallery/MiniGallery";

const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }: any) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayAnnouncementsCount, setTodayAnnouncementsCount] = useState(0);

  const handleLogout = () => {
    signOut(auth);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const studentData = await fetchUser();
      setStudent(studentData);

      const announcementsData = await fetchAnnouncements(setTodayAnnouncementsCount);
      setAnnouncements(announcementsData.slice(0, 3)); // Show only 3 on dashboard
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007AFF']}
        />
      }
    >
      {/* Header with Welcome Message */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome {student?.studentName || 'Parent'}!</Text>
          <Text style={styles.classText}>
            Class {student?.studentClass || 'N/A'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="person" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Attendance')}
        >
          <Icon name="calendar-today" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Homework')}
        >
          <Icon name="assignment" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Homework</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Announcement')}
        >
          <Icon name="notifications" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{todayAnnouncementsCount}</Text>
          <Text style={styles.statLabel}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsContainer}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Attendance')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
            <Icon name="calendar-today" size={28} color="#007AFF" />
          </View>
          <Text style={styles.actionText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Homework')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Icon name="assignment" size={28} color="#4CAF50" />
          </View>
          <Text style={styles.actionText}>Homework</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Grades')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
            <Icon name="grade" size={28} color="#FF9800" />
          </View>
          <Text style={styles.actionText}>Grades</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Events')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
            <Icon name="event" size={28} color="#9C27B0" />
          </View>
          <Text style={styles.actionText}>Events</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Mini Attendance Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {student?.studentClass && (
        <View style={styles.cardContainer}>
          <MiniAttendance studentClass={student.studentClass} />
        </View>
      )}

      {/* Mini Homework Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Homework</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Homework')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        <MiniHomework />
      </View>

      {/* Recent Announcements */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Announcements</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcement')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        <MiniAnnouncement
          limit={3}
          onViewAllPress={() => navigation.navigate('Announcement')}
          onItemPress={(announcement) => navigation.navigate('AnnouncementDetail', { announcement })}
        />
      </View>

      {/* Recent Exam Results */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Exam Result</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Grades')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        <MiniGrades/>
      </View>

      {/* Upcoming Events*/}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Events')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        <MiniEvents/>
      </View>

      {/* Latest Post*/}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Post</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Gallery')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        <MiniGallery/>
      </View>


      {/* Logout Button */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Icon name="logout" size={20} color="#FFF" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.footerText}>School Management System v1.0</Text>
      </View>
    </ScrollView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  classText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c1e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#1c1c1e',
    fontWeight: '500',
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  eventTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
  },
  announcementDescription: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementInfoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  upcomingEventsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  eventsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  eventsSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
});