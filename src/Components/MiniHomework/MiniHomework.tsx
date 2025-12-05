// src/components/MiniHomework.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
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
      <View style={styles.cardHeader}>
        <Text style={styles.subjectText}>
          {item.subject || 'General'}
        </Text>
        <Text style={styles.dateText}>
          {format(new Date(item.date), 'hh:mm a')}
        </Text>
      </View>
      
      <View style={styles.detailsContainer}>
        {Array.isArray(item.details) ? (
          item.details.map((detail, index) => (
            <Text key={index} style={styles.detailText}>
              • {detail}
            </Text>
          ))
        ) : (
          <Text style={styles.detailText}>{item.details}</Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.classText}>
          Class: {item.classId || 'Unknown'}
        </Text>
        <Text style={styles.updatedText}>
          Updated: {format(new Date(item.updatedAt), 'MMM dd')}
        </Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Today's Homework</Text>
        <TouchableOpacity onPress={loadTodayHomework}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {todayHomework.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={todayHomework}
          renderItem={renderHomeworkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {todayHomework.length} homework item{todayHomework.length !== 1 ? 's' : ''} for today
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  refreshText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  homeworkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dateText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  classText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  updatedText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  countText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    textAlign: 'center',
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
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default MiniHomework;