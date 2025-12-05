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
      <TouchableOpacity
        style={[styles.container, styles.emptyContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyTitle}>No Upcoming Events</Text>
        <Text style={styles.emptySubtitle}>Check back soon for events</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Events</Text>
        <Text style={styles.eventCount}>{events.length} upcoming</Text>
      </View>

      <View style={styles.eventsList}>
        {events.map((event, index) => (
          <View
            key={event.id}
            style={[
              styles.eventItem,
              index < events.length - 1 && styles.eventItemBorder
            ]}
          >
            <View style={styles.eventIconContainer}>
              <Text style={styles.eventIcon}>
                {getEventIcon(event.eventType)}
              </Text>
            </View>

            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={styles.eventMeta}>
                <View style={[styles.eventTypeBadge, { backgroundColor: getEventColor(event.eventType) }]}>
                  <Text style={styles.eventTypeText}>
                    {event.eventType}
                  </Text>
                </View>
                <Text style={styles.eventDate}>
                  {formatDate(event.startDate)}
                </Text>
              </View>
              <View style={styles.eventTimeVenue}>
                <Text style={styles.eventTime}>
                  {formatTime(event.startTime)}
                </Text>
                <Text style={styles.eventVenue} numberOfLines={1}>
                  • {event.venue}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {events.length >= 2 && (
        <View style={styles.footer}>
          <Text style={styles.viewAllText}>View all events →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  eventCount: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  eventsList: {
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  eventIconContainer: {
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 24,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventDate: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventTimeVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  eventTime: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  eventVenue: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
    marginLeft: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MiniEvents;