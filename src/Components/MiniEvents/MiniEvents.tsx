// src/components/MiniEvents.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { EventItem, fetchUpcomingEvents } from '../../Service/functions';

interface MiniEventsProps {
  onPress?: () => void;
}

const MiniEvents: React.FC<MiniEventsProps> = ({ onPress }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch exactly 2 upcoming events for dashboard
      const upcomingEvents = await fetchUpcomingEvents(2);
      setEvents(upcomingEvents);
    } catch (err) {
      console.error('Error loading upcoming events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'exam': return '📝';
      case 'holiday': return '🎉';
      case 'sports': return '⚽';
      case 'cultural': return '🎭';
      case 'workshop': return '🔧';
      case 'meeting': return '👥';
      default: return '📅';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'exam': return '#ef4444';
      case 'holiday': return '#10b981';
      case 'sports': return '#3b82f6';
      case 'cultural': return '#8b5cf6';
      case 'workshop': return '#f59e0b';
      case 'meeting': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.loadingContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </TouchableOpacity>
    );
  }

  if (error) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.errorContainer]}
        onPress={loadUpcomingEvents}
        activeOpacity={0.7}
      >
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>No Upcoming Events</Text>
        <Text style={styles.emptySubtitle}>Check back soon for events</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.summaryTag}>
        <Text style={styles.summaryTagText}>Upcoming Events</Text>
        <Text style={styles.summaryCount}>{events.length}</Text>
      </View>
      <View style={styles.eventsStack}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventBadge}>
              <Text style={[
                styles.eventBadgeText,
                { color: getEventColor(event.eventType) }
              ]}>
                {formatDate(event.startDate)}
              </Text>
              <Text style={styles.eventTime}>
                {formatTime(event.startTime)}
              </Text>
            </View>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.eventVenue} numberOfLines={1}>
              {event.venue || 'School Campus'}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  errorText: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  retryText: {
    color: '#3b82f6',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTagText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryCount: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  eventsStack: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    padding: 14,
  },
  eventBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default MiniEvents;
