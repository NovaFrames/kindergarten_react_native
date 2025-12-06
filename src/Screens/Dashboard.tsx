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
import ScreenHeader from "../Components/ScreenHeader";
import HeaderNotificationButton from "../Components/HeaderNotificationButton";

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
      <View style={styles.container}>
        <View style={styles.skeletonHeader} />
        <ScrollView
          contentContainerStyle={styles.skeletonScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.skeletonHero} />

          <View style={styles.skeletonInsightRow}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <View key={idx} style={styles.skeletonInsight} />
            ))}
          </View>

          <View style={styles.skeletonQuickGrid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <View key={idx} style={styles.skeletonQuickCard} />
            ))}
          </View>

          {Array.from({ length: 4 }).map((_, idx) => (
            <View key={`section-${idx}`} style={styles.skeletonSection}>
              <View style={styles.skeletonSectionHeader} />
              <View style={styles.skeletonSectionBody} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Dashboard"
        subtitle="Monitor your child's day at a glance."
        iconName="dashboard"
        actions={<HeaderNotificationButton />}
      />

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
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.heroGreeting}>
                Hi {student?.studentName || 'Parent'} 👋
              </Text>
              <Text style={styles.heroSubtext}>
                Here is a quick look at today's progress for Class {student?.studentClass || 'N/A'}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heroProfileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="person" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatChip}>
              <Icon name="check-circle" size={18} color="#22c55e" />
              <View>
                <Text style={styles.heroStatLabel}>Overall Attendance</Text>
                <Text style={styles.heroStatValue}>{stats.totalAttendance}%</Text>
              </View>
            </View>
            <View style={styles.heroStatChip}>
              <Icon name="assignment" size={18} color="#f97316" />
              <View>
                <Text style={styles.heroStatLabel}>Homework Due</Text>
                <Text style={styles.heroStatValue}>{stats.pendingHomework}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Homework')}
            >
              <Text style={styles.primaryButtonText}>View Homework</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogout}
            >
              <Icon name="logout" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Insight Cards */}
        <View style={styles.insightsContainer}>
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="event-available" size={20} color="#0284C7" />
            </View>
            <Text style={styles.insightLabel}>Events this week</Text>
            <Text style={styles.insightValue}>{stats.upcomingEvents}</Text>
          </View>
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: '#FCE7F3' }]}>
              <Icon name="announcement" size={20} color="#DB2777" />
            </View>
            <Text style={styles.insightLabel}>New announcements</Text>
            <Text style={styles.insightValue}>{todayAnnouncementsCount}</Text>
          </View>
          <View style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="today" size={20} color="#22C55E" />
            </View>
            <Text style={styles.insightLabel}>Today's attendance</Text>
            <Text style={styles.insightValue}>{stats.todayAttendance}/1</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtext}>Jump into the most used sections</Text>
        </View>
        <View style={styles.quickGrid}>
          {[
            { label: 'Attendance', icon: 'calendar-today', color: '#2563EB', screen: 'Attendance' },
            { label: 'Homework', icon: 'assignment', color: '#16A34A', screen: 'Homework' },
            { label: 'Grades', icon: 'grade', color: '#F97316', screen: 'Grades' },
            { label: 'Events', icon: 'event', color: '#A855F7', screen: 'Events' },
            { label: 'Gallery', icon: 'collections', color: '#0EA5E9', screen: 'Gallery' },
            { label: 'Announcements', icon: 'campaign', color: '#EC4899', screen: 'Announcement' },
          ].map(action => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickIconWrapper, { backgroundColor: action.color + '20' }]}>
                <Icon name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Attendance */}
        {student?.studentClass && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Today's Attendance</Text>
                <Text style={styles.sectionSubtext}>See who is present today</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Attendance')}
              >
                <Text style={styles.viewAllButtonText}>View all</Text>
                <Icon name="chevron-right" size={18} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
            <MiniAttendance studentClass={student.studentClass} />
          </>
        )}

        {/* Today's Homework */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Today's Homework</Text>
            <Text style={styles.sectionSubtext}>Keep track of pending assignments</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Homework')}
          >
            <Text style={styles.viewAllButtonText}>View all</Text>
            <Icon name="chevron-right" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
        <MiniHomework />

        {/* Recent Announcements */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Recent Announcements</Text>
            <Text style={styles.sectionSubtext}>Latest school-wide updates</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Announcement')}
          >
            <Text style={styles.viewAllButtonText}>View all</Text>
            <Icon name="chevron-right" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
        <MiniAnnouncement
          limit={3}
          onViewAllPress={() => navigation.navigate('Announcement')}
          onItemPress={(announcement) => navigation.navigate('AnnouncementDetail', { announcement })}
        />

        {/* Recent Exam Results */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Recent Exam Result</Text>
            <Text style={styles.sectionSubtext}>Latest performance summaries</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Grades')}
          >
            <Text style={styles.viewAllButtonText}>View all</Text>
            <Icon name="chevron-right" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
        <MiniGrades/>

        {/* Upcoming Events */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Text style={styles.sectionSubtext}>Don't miss important dates</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Events')}
          >
            <Text style={styles.viewAllButtonText}>View all</Text>
            <Icon name="chevron-right" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
        <MiniEvents/>

        {/* Latest Post */}
        <View style={[styles.sectionHeaderRow, styles.latestPostHeader]}>
          <View>
            <Text style={styles.sectionTitle}>Latest Posts</Text>
            <Text style={styles.sectionSubtext}>Memories captured this week</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Gallery')}
          >
            <Text style={styles.viewAllButtonText}>View all</Text>
            <Icon name="chevron-right" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
        <View style={styles.latestPostContainer}>
          <MiniGallery/>
        </View>

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

  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    paddingRight: 12,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtext: {
    fontSize: 14,
    color: '#CBD5F5',
  },
  heroProfileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  heroStatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroActions: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  insightCard: {
    flex: 1,
    minWidth: (width - 52) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
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
  sectionSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  quickIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewAllButtonText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 4,
  },
  latestPostHeader: {
    marginTop: 28,
    marginBottom: 14,
  },
  latestPostContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    padding: 4,
    overflow: 'hidden',
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

  // Skeleton
  skeletonScroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  skeletonHeader: {
    height: 80,
    backgroundColor: '#E5EAF0',
  },
  skeletonHero: {
    height: 140,
    backgroundColor: '#ECEFF5',
    borderRadius: 24,
    marginTop: 16,
  },
  skeletonInsightRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  skeletonInsight: {
    flex: 1,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F1F4F9',
  },
  skeletonQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  skeletonQuickCard: {
    width: (width - 52) / 2,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F5F7FB',
  },
  skeletonSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFF2F7',
  },
  skeletonSectionHeader: {
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonSectionBody: {
    height: 80,
    backgroundColor: '#F4F6FB',
    borderRadius: 12,
  },
});
