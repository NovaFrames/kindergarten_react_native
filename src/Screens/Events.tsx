// src/screens/Events.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  SectionList,
  TextInput,
  Dimensions
} from 'react-native';
import { fetchEvents, EventItem, fetchUpcomingEvents } from '../Service/functions';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';

const { width } = Dimensions.get('window');

type EventSection = {
  title: string;
  data: EventItem[];
};

const Events: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setError(null);
      const [allEventsData, upcomingEventsData] = await Promise.all([
        fetchEvents(),
        fetchUpcomingEvents(50) // Fetch large number for upcoming view
      ]);
      setAllEvents(allEventsData);
      setUpcomingEvents(upcomingEventsData);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
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
      case 'seminar': return '🎤';
      case 'competition': return '🏆';
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
      case 'seminar': return '#ec4899';
      case 'competition': return '#f97316';
      default: return '#3b82f6';
    }
  };

  const getRelativeDate = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return format(date, 'MMM d, yyyy');
    
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffDays <= 14) return 'Next week';
    if (diffDays <= 30) return 'This month';
    return format(date, 'MMM yyyy');
  };

  // Filter and categorize events
  const filteredEvents = useMemo(() => {
    const events = viewMode === 'upcoming' ? upcomingEvents : allEvents;
    
    return events.filter(event => {
      const matchesSearch = searchQuery.trim() === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        event.eventType.toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [allEvents, upcomingEvents, viewMode, searchQuery, selectedCategory]);

  // Create sections for SectionList
  const eventSections = useMemo(() => {
    const sections: EventSection[] = [];
    const eventsByDate: Record<string, EventItem[]> = {};
    
    filteredEvents.forEach(event => {
      const dateKey = getRelativeDate(event.startDate);
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });
    
    // Sort date keys based on date proximity
    const sortedDateKeys = Object.keys(eventsByDate).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Tomorrow') return -1;
      if (b === 'Tomorrow') return 1;
      return a.localeCompare(b);
    });
    
    sortedDateKeys.forEach(dateKey => {
      sections.push({
        title: dateKey,
        data: eventsByDate[dateKey].sort((a, b) => 
          parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
        )
      });
    });
    
    return sections;
  }, [filteredEvents]);

  // Extract unique categories
  const categories = useMemo(() => {
    const allCategories = [...allEvents, ...upcomingEvents]
      .map(event => event.eventType)
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['All', ...allCategories];
  }, [allEvents, upcomingEvents]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderEventItem = ({ item }: { item: EventItem }) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);
    const isMultiDay = startDate.getTime() !== endDate.getTime();
    
    return (
      <TouchableOpacity style={styles.eventCard} activeOpacity={0.8}>
        <View style={styles.eventCardHeader}>
          <View style={styles.eventIconContainer}>
            <Text style={styles.eventIcon}>
              {getEventIcon(item.eventType)}
            </Text>
          </View>
          
          <View style={styles.eventHeaderContent}>
            <Text style={styles.eventCardTitle}>{item.title}</Text>
            <View style={styles.eventTypeContainer}>
              <View style={[
                styles.eventTypeBadge,
                { backgroundColor: getEventColor(item.eventType) }
              ]}>
                <Text style={styles.eventTypeBadgeText}>
                  {item.eventType}
                </Text>
              </View>
              <Text style={styles.eventDateBadge}>
                {formatDate(item.startDate)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅</Text>
            <Text style={styles.detailText}>
              {formatDate(item.startDate)}
              {isMultiDay && ` - ${formatDate(item.endDate)}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕒</Text>
            <Text style={styles.detailText}>
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍</Text>
            <Text style={styles.detailText}>{item.venue}</Text>
          </View>
          
          {item.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>
                {item.description}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventFooter}>
          <Text style={styles.timeRemaining}>
            {isPast(startDate) ? 'Event completed' : 'Upcoming event'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: EventSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} events</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>School Events</Text>
          <Text style={styles.headerSubtitle}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadEvents}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* View Mode Toggle */}
            <View style={styles.viewModeContainer}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'upcoming' && styles.viewModeButtonActive
                ]}
                onPress={() => setViewMode('upcoming')}
              >
                <Text style={[
                  styles.viewModeText,
                  viewMode === 'upcoming' && styles.viewModeTextActive
                ]}>
                  Upcoming
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'all' && styles.viewModeButtonActive
                ]}
                onPress={() => setViewMode('all')}
              >
                <Text style={[
                  styles.viewModeText,
                  viewMode === 'all' && styles.viewModeTextActive
                ]}>
                  All Events
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    (selectedCategory === category || 
                     (category === 'All' && !selectedCategory)) && 
                    styles.categoryButtonActive
                  ]}
                  onPress={() => 
                    setSelectedCategory(category === 'All' ? null : category)
                  }
                >
                  <Text style={[
                    styles.categoryText,
                    (selectedCategory === category || 
                     (category === 'All' && !selectedCategory)) && 
                    styles.categoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {searchQuery || selectedCategory ? 'No matching events' : 'No events found'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery || selectedCategory 
                    ? 'Try changing your search or filter'
                    : 'There are no events scheduled yet.'
                  }
                </Text>
                {(searchQuery || selectedCategory) && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                  >
                    <Text style={styles.clearFiltersText}>Clear filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <SectionList
                sections={eventSections}
                keyExtractor={(item) => item.id}
                renderItem={renderEventItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.eventsList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3b82f6']}
                    tintColor="#3b82f6"
                  />
                }
                stickySectionHeadersEnabled={false}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewModeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewModeTextActive: {
    color: '#ffffff',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsList: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 24,
  },
  eventHeaderContent: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  eventTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventDateBadge: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  detailText: {
    fontSize: 15,
    color: '#4b5563',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  eventFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 12,
  },
  timeRemaining: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Events;