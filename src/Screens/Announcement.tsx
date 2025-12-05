// src/screens/Announcement.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Announcement, fetchAllAnnouncements } from '../Service/functions';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AnnouncementScreen: React.FC = () => {
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'thisWeek' | 'upcoming' | 'past'>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  const loadAnnouncements = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setRefreshing(isRefreshing);

      const announcements = await fetchAllAnnouncements();
      
      // Extract unique event types
      const uniqueEventTypes = Array.from(
        new Set(announcements.filter(a => a.eventType).map(a => a.eventType!))
      );
      setEventTypes(uniqueEventTypes);
      
      // Sort by date (newest first)
      const sortedAnnouncements = announcements.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.startDate);
        const dateB = b.createdAt?.toDate?.() || new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
      
      setAllAnnouncements(sortedAnnouncements);
      setFilteredAnnouncements(sortedAnnouncements);
      
    } catch (error) {
      console.error('Error loading announcements:', error);
      Alert.alert('Error', 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...allAnnouncements];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ann =>
        ann.title?.toLowerCase().includes(query) ||
        ann.description?.toLowerCase().includes(query) ||
        ann.eventType?.toLowerCase().includes(query) ||
        ann.venue?.toLowerCase().includes(query)
      );
    }

    // Apply time filter
    const now = new Date();
    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(ann => 
          isSameDay(new Date(ann.startDate), now)
        );
        break;
      case 'thisWeek':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        filtered = filtered.filter(ann => {
          const annDate = new Date(ann.startDate);
          return isWithinInterval(annDate, { start: weekStart, end: weekEnd });
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(ann => 
          new Date(ann.startDate) > now
        );
        break;
      case 'past':
        filtered = filtered.filter(ann => 
          new Date(ann.startDate) < now
        );
        break;
    }

    // Apply event type filter
    if (selectedEventType) {
      filtered = filtered.filter(ann => ann.eventType === selectedEventType);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(ann =>
        isSameDay(new Date(ann.startDate), dateFilter)
      );
    }

    setFilteredAnnouncements(filtered);
    setFilterModalVisible(false);
  }, [allAnnouncements, searchQuery, selectedFilter, selectedEventType, dateFilter]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, applyFilters]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateFilter(selectedDate);
      setSelectedFilter('all');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSelectedEventType('');
    setDateFilter(null);
    setFilteredAnnouncements(allAnnouncements);
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

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMM dd');
    const end = format(new Date(endDate), 'MMM dd');
    
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => {
    const isToday = isSameDay(new Date(item.startDate), new Date());
    const isUpcoming = new Date(item.startDate) > new Date();
    
    return (
      <TouchableOpacity 
        style={[
          styles.announcementCard,
          isToday && styles.todayAnnouncementCard,
          isUpcoming && styles.upcomingAnnouncementCard
        ]}
        onPress={() => {
          // Navigate to announcement detail or show modal
          Alert.alert(
            item.title,
            `${item.description || 'No description provided'}\n\n` +
            `📅 ${formatDateRange(item.startDate, item.endDate)}\n` +
            `⏰ ${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}\n` +
            `📍 ${item.venue || 'TBA'}`,
            [{ text: 'OK' }]
          );
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText} numberOfLines={2}>
              {item.title}
            </Text>
            
            <View style={styles.statusContainer}>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
              {isUpcoming && !isToday && (
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
                </View>
              )}
            </View>
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
          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Icon name="calendar-today" size={16} color="#6c757d" />
              <Text style={styles.footerText}>
                {formatDateRange(item.startDate, item.endDate)}
              </Text>
            </View>
            
            <View style={styles.footerItem}>
              <Icon name="schedule" size={16} color="#6c757d" />
              <Text style={styles.footerText}>
                {item.startTime}
                {item.endTime && ` - ${item.endTime}`}
              </Text>
            </View>
          </View>

          {item.venue && (
            <View style={styles.footerItem}>
              <Icon name="location-on" size={16} color="#6c757d" />
              <Text style={styles.footerText} numberOfLines={1}>
                {item.venue}
              </Text>
            </View>
          )}

          {item.createdAt && (
            <View style={styles.createdAtContainer}>
              <Icon name="access-time" size={14} color="#adb5bd" />
              <Text style={styles.createdAtText}>
                Posted {format(item.createdAt.toDate(), 'MMM dd, hh:mm a')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Announcements</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Icon name="close" size={24} color="#1c1c1e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterOptions}>
            <Text style={styles.filterSectionTitle}>Time Period</Text>
            {(['all', 'today', 'thisWeek', 'upcoming', 'past'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  selectedFilter === filter && styles.selectedFilterOption
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilter === filter && styles.selectedFilterOptionText
                ]}>
                  {filter === 'all' && 'All Announcements'}
                  {filter === 'today' && "Today's Announcements"}
                  {filter === 'thisWeek' && 'This Week'}
                  {filter === 'upcoming' && 'Upcoming Events'}
                  {filter === 'past' && 'Past Events'}
                </Text>
                {selectedFilter === filter && (
                  <Icon name="check" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.filterSectionTitle}>Filter by Date</Text>
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-today" size={20} color="#007AFF" />
              <Text style={styles.dateFilterText}>
                {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Select Date'}
              </Text>
              {dateFilter && (
                <TouchableOpacity onPress={() => setDateFilter(null)}>
                  <Icon name="clear" size={20} color="#ff3b30" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {eventTypes.length > 0 && (
              <>
                <Text style={styles.filterSectionTitle}>Filter by Event Type</Text>
                <View style={styles.eventTypesContainer}>
                  {eventTypes.map(eventType => (
                    <TouchableOpacity
                      key={eventType}
                      style={[
                        styles.eventTypeFilterButton,
                        selectedEventType === eventType && [
                          styles.selectedEventTypeFilterButton,
                          { borderColor: getEventTypeColor(eventType) }
                        ]
                      ]}
                      onPress={() => setSelectedEventType(
                        selectedEventType === eventType ? '' : eventType
                      )}
                    >
                      <Text style={[
                        styles.eventTypeFilterText,
                        selectedEventType === eventType && [
                          styles.selectedEventTypeFilterText,
                          { color: getEventTypeColor(eventType) }
                        ]
                      ]}>
                        {eventType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search announcements..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="filter-list" size={24} color="#007AFF" />
          {(selectedFilter !== 'all' || dateFilter || selectedEventType) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAnnouncements}
        renderItem={renderAnnouncementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAnnouncements(true)}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all' || dateFilter || selectedEventType
                ? 'No announcements match your filters'
                : 'No announcements yet'}
            </Text>
            {(searchQuery || selectedFilter !== 'all' || dateFilter || selectedEventType) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => loadAnnouncements(true)}
            >
              <Icon name="refresh" size={20} color="#007AFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          filteredAnnouncements.length > 0 ? (
            <Text style={styles.listHeader}>
              {selectedFilter === 'today' 
                ? "Today's Announcements" 
                : selectedFilter === 'thisWeek'
                ? "This Week's Announcements"
                : selectedFilter === 'upcoming'
                ? 'Upcoming Events'
                : selectedFilter === 'past'
                ? 'Past Events'
                : selectedEventType
                ? `${selectedEventType} Announcements`
                : dateFilter
                ? `Announcements for ${format(dateFilter, 'MMM dd, yyyy')}`
                : 'All Announcements'}
            </Text>
          ) : null
        }
      />

      {renderFilterModal()}
      
      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1c1c1e',
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff3b30',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  todayAnnouncementCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  upcomingAnnouncementCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#06D6A0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  todayBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  todayBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  upcomingBadge: {
    backgroundColor: '#06D6A0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  upcomingBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 6,
    flex: 1,
  },
  createdAtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  createdAtText: {
    fontSize: 12,
    color: '#adb5bd',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  filterOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginTop: 16,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  selectedFilterOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
  },
  dateFilterText: {
    fontSize: 16,
    color: '#1c1c1e',
    flex: 1,
    marginLeft: 12,
  },
  eventTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  eventTypeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  selectedEventTypeFilterButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },
  eventTypeFilterText: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedEventTypeFilterText: {
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  clearButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AnnouncementScreen;