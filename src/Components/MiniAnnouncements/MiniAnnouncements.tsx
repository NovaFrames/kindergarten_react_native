// src/components/MiniAnnouncement.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { format, isSameDay } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Announcement, fetchAnnouncements } from '../../Service/functions';

interface MiniAnnouncementProps {
  limit?: number;
  onViewAllPress?: () => void;
  onItemPress?: (announcement: Announcement) => void;
}

const MiniAnnouncement: React.FC<MiniAnnouncementProps> = ({
  limit = 3,
  onViewAllPress,
  onItemPress,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchAnnouncements(setTodayCount);
      setAnnouncements(data.slice(0, limit));
    } catch (error) {
      console.error('Error loading announcements:', error);
      Alert.alert('Error', 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd');
    } catch {
      return dateString;
    }
  };

  const isToday = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isSameDay(date, new Date());
    } catch {
      return false;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'exam':
        return '#FF6B6B';
      case 'holiday':
        return '#4ECDC4';
      case 'meeting':
        return '#FFD166';
      case 'event':
        return '#06D6A0';
      case 'notice':
        return '#118AB2';
      default:
        return '#6c757d';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications" size={48} color="#e0e0e0" />
      <Text style={styles.emptyText}>No announcements</Text>
      <Text style={styles.emptySubText}>
        {todayCount > 0 
          ? `${todayCount} new announcement${todayCount !== 1 ? 's' : ''} today`
          : 'Check back later for updates'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Announcements</Text>
            <Text style={styles.summaryValue}>--</Text>
            <Text style={styles.summarySubtext}>Fetching latest updates...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Announcements</Text>
          <Text style={styles.summaryValue}>{announcements.length}</Text>
          <Text style={styles.summarySubtext}>
            {todayCount > 0
              ? `${todayCount} new today`
              : 'Nothing new today'}
          </Text>
        </View>
        {onViewAllPress && (
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={onViewAllPress}
          >
            <Text style={styles.summaryButtonText}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      {announcements.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        >
          {announcements.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.announcementCard}
              onPress={() => onItemPress?.(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.announcementTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.announcementDate}>
                    {formatDate(item.startDate)}
                    {item.endDate && item.endDate !== item.startDate
                      ? ` - ${formatDate(item.endDate)}`
                      : ''}
                  </Text>
                </View>
                {isToday(item.startDate) && (
                  <View style={styles.todayDot} />
                )}
              </View>

              {item.description && (
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              <View style={styles.cardFooterRow}>
                {item.eventType && (
                  <View
                    style={[
                      styles.footerChip,
                      {
                        backgroundColor: getEventTypeColor(item.eventType) + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.footerChipText,
                        { color: getEventTypeColor(item.eventType) },
                      ]}
                    >
                      {item.eventType}
                    </Text>
                  </View>
                )}
                {item.venue && (
                  <Text style={styles.venueText} numberOfLines={1}>
                    {item.venue}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#CBD5F5',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 4,
  },
  summarySubtext: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  summaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryButtonText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 12,
  },
  announcementDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginTop: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  footerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  footerChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  venueText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    borderRadius: 18,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
});

export default MiniAnnouncement;
