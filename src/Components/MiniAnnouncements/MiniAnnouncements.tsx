// src/components/MiniAnnouncement.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={styles.announcementCard}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.announcementTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {isToday(item.startDate) && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
          )}
        </View>
        
        {item.eventType && (
          <View style={[
            styles.eventTypeBadge,
            { backgroundColor: getEventTypeColor(item.eventType) + '20' }
          ]}>
            <Text style={[
              styles.eventTypeText,
              { color: getEventTypeColor(item.eventType) }
            ]}>
              {item.eventType}
            </Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Icon name="calendar-today" size={14} color="#6c757d" />
          <Text style={styles.footerText}>
            {formatDate(item.startDate)}
            {item.endDate && item.endDate !== item.startDate && ` - ${formatDate(item.endDate)}`}
          </Text>
        </View>

        <View style={styles.footerItem}>
          <Icon name="schedule" size={14} color="#6c757d" />
          <Text style={styles.footerText}>
            {item.startTime}
            {item.endTime && ` - ${item.endTime}`}
          </Text>
        </View>

        {item.venue && (
          <View style={styles.footerItem}>
            <Icon name="location-on" size={14} color="#6c757d" />
            <Text style={styles.footerText} numberOfLines={1}>
              {item.venue}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.header}>
          <Text style={styles.title}>Announcements</Text>
          {todayCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{todayCount} NEW</Text>
            </View>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Announcements</Text>
          {todayCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{todayCount} NEW</Text>
            </View>
          )}
        </View>
        
        {onViewAllPress && announcements.length > 0 && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {announcements.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncementItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
              {todayCount > 0 && ` • ${todayCount} new today`}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  countText: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 12,
  },
  announcementCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  todayBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  todayBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 6,
    flex: 1,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
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
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
  },
});

export default MiniAnnouncement;