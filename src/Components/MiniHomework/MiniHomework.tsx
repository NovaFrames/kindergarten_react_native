// src/components/MiniHomework.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { format, isSameDay } from 'date-fns';
import { fetchHomework, Homework } from '../../Service/functions';

const MiniHomework: React.FC = () => {
  const [todayHomework, setTodayHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayHomeworkCount, setTodayHomeworkCount] = useState(0);

  const loadTodayHomework = async () => {
    try {
      setLoading(true);
      // Fetch homework and get today's count
      const allHomework = await fetchHomework(setTodayHomeworkCount);
      
      // Filter only today's homework
      const today = new Date();
      const todayHw = allHomework.filter(hw => {
        const hwDate = new Date(hw.date || hw.createdAt);
        return isSameDay(hwDate, today);
      });
      
      setTodayHomework(todayHw);
    } catch (error) {
      console.error('Error loading today\'s homework:', error);
      Alert.alert('Error', 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayHomework();
  }, []);

  const renderHomeworkItem = ({ item }: { item: Homework }) => (
    <TouchableOpacity style={styles.homeworkCard}>
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{item.classId || 'Class'}</Text>
      </View>
      <Text style={styles.subjectText}>
        {item.subject || 'General'}
      </Text>
      <Text style={styles.descriptionText} numberOfLines={3}>
        {Array.isArray(item.details) ? item.details.join(' • ') : item.details}
      </Text>
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Due</Text>
          <Text style={styles.metaValue}>
            {format(new Date(item.date || item.createdAt), 'hh:mm a')}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Updated</Text>
          <Text style={styles.metaValue}>
            {format(new Date(item.updatedAt), 'MMM dd')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No homework for today 🎉</Text>
      <Text style={styles.emptySubText}>
        {todayHomeworkCount > 0 
          ? `You have ${todayHomeworkCount} homework items coming up`
          : 'All caught up!'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading today's homework...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Homework Today</Text>
          <Text style={styles.summaryValue}>
            {todayHomework.length}
          </Text>
          <Text style={styles.summarySubtext}>
            {todayHomework.length > 0
              ? 'Keep up with the latest assignments'
              : 'All caught up for today'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadTodayHomework}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {todayHomework.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {todayHomework.map(item => (
            <View key={item.id}>
              {renderHomeworkItem({ item })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  refreshButtonText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  listContainer: {
    paddingTop: 16,
    gap: 12,
  },
  homeworkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  cardBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  subjectText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5EAF0',
    marginHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default MiniHomework;
