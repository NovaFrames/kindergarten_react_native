// src/screens/Homework.tsx
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
} from 'react-native';
import { Homework, fetchHomework, fetchUser } from '../Service/functions';
import { format, isSameDay, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const HomeworkScreen: React.FC = () => {
  const [allHomework, setAllHomework] = useState<Homework[]>([]);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'thisWeek' | 'subject'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const loadHomework = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setRefreshing(isRefreshing);

      const user = await fetchUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const homework = await fetchHomework();
      
      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Set(homework.filter(hw => hw.subject).map(hw => hw.subject!))
      );
      setSubjects(uniqueSubjects);
      
      setAllHomework(homework);
      setFilteredHomework(homework);
      
    } catch (error) {
      console.error('Error loading homework:', error);
      Alert.alert('Error', 'Failed to load homework');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...allHomework];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(hw =>
        hw.subject?.toLowerCase().includes(query) ||
        (Array.isArray(hw.details) 
          ? hw.details.some(detail => detail.toLowerCase().includes(query))
          : hw.details.toLowerCase().includes(query))
      );
    }

    // Apply time filter
    const now = new Date();
    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(hw => 
          isSameDay(new Date(hw.date || hw.createdAt), now)
        );
        break;
      case 'thisWeek':
        const weekStart = startOfDay(new Date(now.setDate(now.getDate() - now.getDay())));
        const weekEnd = endOfDay(new Date(now.setDate(now.getDate() - now.getDay() + 6)));
        filtered = filtered.filter(hw => {
          const hwDate = new Date(hw.date || hw.createdAt);
          return isWithinInterval(hwDate, { start: weekStart, end: weekEnd });
        });
        break;
      case 'subject':
        if (selectedSubject) {
          filtered = filtered.filter(hw => hw.subject === selectedSubject);
        }
        break;
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(hw =>
        isSameDay(new Date(hw.date || hw.createdAt), dateFilter)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    setFilteredHomework(filtered);
    setFilterModalVisible(false);
  }, [allHomework, searchQuery, selectedFilter, selectedSubject, dateFilter]);

  useEffect(() => {
    loadHomework();
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
    setSelectedSubject('');
    setDateFilter(null);
    setFilteredHomework(allHomework);
  };

  const renderHomeworkItem = ({ item }: { item: Homework }) => {
    const isToday = isSameDay(new Date(item.date || item.createdAt), new Date());
    
    return (
      <TouchableOpacity 
        style={[
          styles.homeworkCard,
          isToday && styles.todayHomeworkCard
        ]}
        onPress={() => {
          Alert.alert(
            item.subject || 'Homework Details',
            Array.isArray(item.details) 
              ? item.details.join('\n• ')
              : item.details,
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.subjectContainer}>
            <Text style={styles.subjectText}>
              {item.subject || 'General'}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>
            {format(new Date(item.date || item.createdAt), 'MMM dd, yyyy')}
          </Text>
        </View>
        
        <View style={styles.detailsContainer}>
          {Array.isArray(item.details) ? (
            <ScrollView style={styles.detailsScroll} nestedScrollEnabled>
              {item.details.map((detail, index) => (
                <Text key={index} style={styles.detailText}>
                  • {detail}
                </Text>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.detailText} numberOfLines={3}>
              {item.details}
            </Text>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Icon name="class" size={14} color="#6c757d" />
            <Text style={styles.classText}>
              {item.classId || 'Unknown Class'}
            </Text>
          </View>
          <View style={styles.footerInfo}>
            <Icon name="update" size={14} color="#6c757d" />
            <Text style={styles.updatedText}>
              Updated: {format(new Date(item.updatedAt), 'MMM dd')}
            </Text>
          </View>
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
            <Text style={styles.modalTitle}>Filter Homework</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Icon name="close" size={24} color="#1c1c1e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterOptions}>
            <Text style={styles.filterSectionTitle}>Time Period</Text>
            {(['all', 'today', 'thisWeek'] as const).map(filter => (
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
                  {filter === 'all' && 'All Homework'}
                  {filter === 'today' && 'Today\'s Homework'}
                  {filter === 'thisWeek' && 'This Week'}
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

            {subjects.length > 0 && (
              <>
                <Text style={styles.filterSectionTitle}>Filter by Subject</Text>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedFilter === 'subject' && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedFilter('subject')}
                >
                  <Text style={styles.filterOptionText}>
                    {selectedSubject || 'Select Subject'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#6c757d" />
                </TouchableOpacity>
                
                {selectedFilter === 'subject' && (
                  <View style={styles.subjectDropdown}>
                    {subjects.map(subject => (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.subjectOption,
                          selectedSubject === subject && styles.selectedSubjectOption
                        ]}
                        onPress={() => setSelectedSubject(subject)}
                      >
                        <Text style={[
                          styles.subjectOptionText,
                          selectedSubject === subject && styles.selectedSubjectOptionText
                        ]}>
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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
        <Text style={styles.loadingText}>Loading homework...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Homework</Text>
        <Text style={styles.headerSubtitle}>
          {filteredHomework.length} item{filteredHomework.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search homework..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="filter-list" size={24} color="#007AFF" />
          {(selectedFilter !== 'all' || dateFilter || selectedSubject) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredHomework}
        renderItem={renderHomeworkItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHomework(true)}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={64} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all' || dateFilter || selectedSubject
                ? 'No homework matches your filters'
                : 'No homework assigned yet'}
            </Text>
            {(searchQuery || selectedFilter !== 'all' || dateFilter || selectedSubject) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListHeaderComponent={
          filteredHomework.length > 0 ? (
            <Text style={styles.listHeader}>
              {selectedFilter === 'today' 
                ? "Today's Homework" 
                : selectedFilter === 'thisWeek'
                ? "This Week's Homework"
                : selectedSubject
                ? `${selectedSubject} Homework`
                : dateFilter
                ? `Homework for ${format(dateFilter, 'MMM dd, yyyy')}`
                : 'All Homework'}
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
  homeworkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayHomeworkCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  todayBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailsScroll: {
    maxHeight: 100,
  },
  detailText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classText: {
    fontSize: 13,
    color: '#6c757d',
    marginLeft: 4,
  },
  updatedText: {
    fontSize: 13,
    color: '#6c757d',
    marginLeft: 4,
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
    minHeight: 300,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 8,
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
  subjectDropdown: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  subjectOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  selectedSubjectOption: {
    backgroundColor: '#e3f2fd',
  },
  subjectOptionText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  selectedSubjectOptionText: {
    color: '#007AFF',
    fontWeight: '500',
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

export default HomeworkScreen;