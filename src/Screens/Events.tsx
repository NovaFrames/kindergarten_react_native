import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  TextInput,
  Dimensions,
  FlatList
} from 'react-native';
import { fetchEvents, EventItem, fetchUpcomingEvents } from '../Service/functions';
import { format, parseISO, isToday, isTomorrow, isPast, isThisWeek, isThisMonth } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScreenHeader from '../Components/ScreenHeader';
import HeaderNotificationButton from '../Components/HeaderNotificationButton';

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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setError(null);
      const [allEventsData, upcomingEventsData] = await Promise.all([
        fetchEvents(),
        fetchUpcomingEvents(50)
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
      case 'exam': return 'assignment';
      case 'holiday': return 'beach-access';
      case 'sports': return 'sports-soccer';
      case 'cultural': return 'music-note';
      case 'workshop': return 'build';
      case 'meeting': return 'groups';
      case 'seminar': return 'mic';
      case 'competition': return 'emoji-events';
      default: return 'event';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'exam': return '#F44336';
      case 'holiday': return '#4CAF50';
      case 'sports': return '#2196F3';
      case 'cultural': return '#9C27B0';
      case 'workshop': return '#FF9800';
      case 'meeting': return '#607D8B';
      case 'seminar': return '#E91E63';
      case 'competition': return '#FF5722';
      default: return '#2196F3';
    }
  };

  const getRelativeDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    const today = new Date();
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (isThisWeek(date)) return 'This Week';
    if (isThisMonth(date)) return 'This Month';
    return format(date, 'MMM yyyy');
  };

  // Filter and categorize events
  const filteredEvents = useMemo(() => {
    const events = activeTab === 'upcoming' ? upcomingEvents : allEvents;
    
    return events.filter(event => {
      const matchesSearch = searchQuery.trim() === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        event.eventType.toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [allEvents, upcomingEvents, activeTab, searchQuery, selectedCategory]);

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
      if (a === 'This Week') return -1;
      if (b === 'This Week') return 1;
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

  const renderEventItem = ({ item }: { item: EventItem }) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);
    const isMultiDay = startDate.getTime() !== endDate.getTime();
    const eventColor = getEventColor(item.eventType);
    const isPastEvent = isPast(endDate);
    
    return (
      <TouchableOpacity style={styles.eventCard} activeOpacity={0.8}>
        <View style={styles.eventCardHeader}>
          <View style={[
            styles.eventIconContainer,
            { backgroundColor: eventColor + '20' }
          ]}>
            <Icon 
              name={getEventIcon(item.eventType)} 
              size={24} 
              color={eventColor} 
            />
          </View>
          
          <View style={styles.eventHeaderContent}>
            <Text style={styles.eventCardTitle}>{item.title}</Text>
            <View style={styles.eventTypeContainer}>
              <View style={[
                styles.eventTypeBadge,
                { backgroundColor: eventColor }
              ]}>
                <Text style={styles.eventTypeBadgeText}>
                  {item.eventType}
                </Text>
              </View>
              {isPastEvent && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar-today" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)}
              {isMultiDay && ` - ${formatDate(item.endDate)}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="access-time" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.detailText}>{item.venue}</Text>
          </View>
          
          {item.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventFooter}>
          <Text style={[
            styles.timeRemaining,
            { color: isPastEvent ? '#666' : eventColor }
          ]}>
            {isPastEvent ? 'Event completed' : 'Upcoming event'}
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

  const nextEvent = filteredEvents[0];

  const renderHero = () => {
    if (!nextEvent) {
      return (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Upcoming events</Text>
          <Text style={styles.heroValue}>{filteredEvents.length}</Text>
          <Text style={styles.heroSubtext}>
            Events will appear here as soon as they are scheduled.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>Next event</Text>
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: getEventColor(nextEvent.eventType) + '20' },
            ]}
          >
            <Text
              style={[
                styles.heroBadgeText,
                { color: getEventColor(nextEvent.eventType) },
              ]}
            >
              {nextEvent.eventType}
            </Text>
          </View>
        </View>
        <Text style={styles.heroEventTitle}>{nextEvent.title}</Text>
        <Text style={styles.heroEventMeta}>
          {formatDate(nextEvent.startDate)} • {formatTime(nextEvent.startTime)}
        </Text>
        <Text style={styles.heroEventVenue}>{nextEvent.venue}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Events"
        subtitle="Track upcoming activities and celebrations."
        iconName="event"
        iconColor="#FF9800"
        actions={<HeaderNotificationButton />}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Events</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadEvents}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderHero()}

            {/* Search and Filter */}
            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title, venue, or type"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.segmentControl}>
                {(['upcoming', 'all'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.segmentButton,
                      activeTab === tab && styles.segmentButtonActive,
                    ]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        activeTab === tab && styles.segmentTextActive,
                      ]}
                    >
                      {tab === 'upcoming' ? 'Upcoming' : 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          {/* Category Filter */}
          {categories.length > 1 && (
            <View style={styles.categoriesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
            </View>
          )}

          {/* Events List */}
          <View style={styles.contentContainer}>
            {filteredEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="event-busy" size={64} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>
                  {searchQuery || selectedCategory ? 'No Matching Events' : 'No Events Found'}
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
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
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
                stickySectionHeadersEnabled={false}
              />
            )}
          </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container and Layout
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Search and Filter Container
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    padding: 4,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#111827',
  },

  // Categories Filter
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Events List
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Event Card
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventHeaderContent: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  eventTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  eventDateBadge: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  eventDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  eventFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 12,
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: {
    color: '#94A3B8',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 6,
  },
  heroSubtext: {
    color: '#CBD5F5',
    fontSize: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroEventTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroEventMeta: {
    marginTop: 6,
    color: '#CBD5F5',
    fontSize: 14,
  },
  heroEventVenue: {
    color: '#CBD5F5',
    fontSize: 13,
    marginTop: 2,
  },
});

export default Events;
