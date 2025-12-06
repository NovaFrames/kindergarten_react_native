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
  const [stats, setStats] = useState({
    totalAttendance: 0,
    todayAttendance: 0,
    pendingHomework: 0,
    upcomingEvents: 0
  });

  const handleLogout = () => {
    signOut(auth);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const studentData = await fetchUser();
      setStudent(studentData);

      const announcementsData = await fetchAnnouncements(setTodayAnnouncementsCount);
      setAnnouncements(announcementsData.slice(0, 3));

      // Load initial stats (these would come from your actual data)
      setStats({
        totalAttendance: 95, // Example data
        todayAttendance: 1,
        pendingHomework: 2,
        upcomingEvents: 3
      });
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header matching Attendance page */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
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
              <Icon name="person" size={24} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="check-circle" size={20} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>{stats.totalAttendance}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="assignment" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{stats.pendingHomework}</Text>
            <Text style={styles.statLabel}>Pending HW</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="event" size={20} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="campaign" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.statNumber}>{todayAnnouncementsCount}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsContainer}
          contentContainerStyle={styles.quickActionsContent}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Icon name="calendar-today" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Homework')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Icon name="assignment" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Homework</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Grades')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
              <Icon name="grade" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Grades</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Events')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
              <Icon name="event" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Gallery')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Icon name="collections" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Announcement')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E91E63' }]}>
              <Icon name="campaign" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Announcements</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Today's Attendance */}
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

        {/* Today's Homework */}
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

        {/* Upcoming Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardContainer}>
          <MiniEvents/>
        </View>

        {/* Latest Post */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Posts</Text>
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
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  // Container and Layout
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Header matching Attendance page
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  classText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: 16,
  },
  quickActionsContent: {
    paddingRight: 16,
  },
  actionButton: {
    alignItems: 'center',
    marginRight: 12,
    width: 80,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Card Container
  cardContainer: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
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

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
});