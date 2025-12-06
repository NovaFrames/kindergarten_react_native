import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { fetchGrades } from '../Service/functions';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Grades: React.FC = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setError(null);
      const fetchedGrades = await fetchGrades();
      setGrades(fetchedGrades);
    } catch (err) {
      console.error('Error loading grades:', err);
      setError('Failed to load exam results. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGrades();
  };

  const toggleExpand = (examName: string) => {
    setExpandedExam(expandedExam === examName ? null : examName);
  };

  const calculateAverage = (grade: any) => {
    if (!grade.subjects) return null;
    
    const subjects = Object.values(grade.subjects);
    const numericGrades = subjects
      .map((grade: any) => parseFloat(grade))
      .filter(grade => !isNaN(grade));
    
    if (numericGrades.length === 0) return null;
    
    const sum = numericGrades.reduce((a, b) => a + b, 0);
    return (sum / numericGrades.length).toFixed(1);
  };

  const getGradeColor = (grade: string) => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade)) return '#666';
    
    if (numGrade >= 90) return '#4CAF50'; // Green
    if (numGrade >= 80) return '#2196F3'; // Blue
    if (numGrade >= 70) return '#FF9800'; // Orange
    if (numGrade >= 60) return '#FF5722'; // Deep Orange
    return '#F44336'; // Red
  };

  const getPerformanceText = (average: string | null) => {
    if (!average) return 'N/A';
    
    const numAvg = parseFloat(average);
    if (isNaN(numAvg)) return 'N/A';
    
    if (numAvg >= 90) return 'Excellent';
    if (numAvg >= 80) return 'Good';
    if (numAvg >= 70) return 'Average';
    if (numAvg >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  const getGradeLetter = (grade: string) => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade)) return '';
    
    if (numGrade >= 90) return 'A';
    if (numGrade >= 80) return 'B';
    if (numGrade >= 70) return 'C';
    if (numGrade >= 60) return 'D';
    return 'F';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalAverage = () => {
    if (grades.length === 0) return null;
    
    let totalSum = 0;
    let totalCount = 0;
    
    grades.forEach(grade => {
      const average = calculateAverage(grade);
      if (average) {
        totalSum += parseFloat(average);
        totalCount++;
      }
    });
    
    if (totalCount === 0) return null;
    return (totalSum / totalCount).toFixed(1);
  };

  const getTotalSubjects = () => {
    return grades.reduce((total, grade) => {
      return total + Object.keys(grade.subjects || {}).length;
    }, 0);
  };

  const renderStatistics = () => {
    const totalAverage = getTotalAverage();
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="school" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{grades.length}</Text>
          <Text style={styles.statLabel}>Exams</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="subject" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{getTotalSubjects()}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="bar-chart" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>
            {totalAverage || 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading exam results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header matching Attendance page */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grades</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Results</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadGrades}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : grades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="assessment" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Exam Results</Text>
          <Text style={styles.emptyText}>
            Your exam results will appear here once they are published.
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {renderStatistics()}
          
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
              />
            }
          >
            {grades.map((grade, index) => {
              const average = calculateAverage(grade);
              const performance = getPerformanceText(average);
              const isExpanded = expandedExam === grade.examName;
              
              return (
                <TouchableOpacity
                  key={`${grade.examName}-${grade.date}-${index}`}
                  style={[
                    styles.gradeCard,
                    isExpanded && styles.gradeCardExpanded
                  ]}
                  onPress={() => toggleExpand(grade.examName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gradeCardHeader}>
                    <View style={styles.examInfo}>
                      <View style={styles.examTitleContainer}>
                        <Icon name="assignment" size={20} color="#2196F3" style={styles.examIcon} />
                        <Text style={styles.examName} numberOfLines={1}>
                          {grade.examName}
                        </Text>
                      </View>
                      <Text style={styles.examDate}>
                        {formatDate(grade.date)}
                      </Text>
                    </View>
                    
                    <View style={styles.gradeSummary}>
                      {average && (
                        <>
                          <View style={styles.averageContainer}>
                            <Text style={styles.averageLabel}>Average</Text>
                            <View style={[
                              styles.averageCircle,
                              { backgroundColor: getGradeColor(average) }
                            ]}>
                              <Text style={styles.averageValue}>
                                {average}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.gradeDetails}>
                            <Text style={styles.gradeLetter}>
                              {getGradeLetter(average)}
                            </Text>
                            <Text style={[
                              styles.performanceText,
                              { color: getGradeColor(average) }
                            ]}>
                              {performance}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.subjectsHeader}>
                        <Text style={styles.subjectsTitle}>Subjects</Text>
                        <Text style={styles.subjectsTitle}>Grade</Text>
                      </View>
                      
                      {Object.entries(grade.subjects).map(([subject, gradeValue]: [string, any]) => (
                        <View key={subject} style={styles.subjectRow}>
                          <Text style={styles.subjectName}>{subject}</Text>
                          <View style={styles.gradeValueContainer}>
                            <View style={[
                              styles.gradeBadge,
                              { backgroundColor: getGradeColor(gradeValue) }
                            ]}>
                              <Text style={styles.gradeBadgeText}>
                                {gradeValue}
                              </Text>
                            </View>
                            <Text style={[
                              styles.gradeLetterBadge,
                              { color: getGradeColor(gradeValue) }
                            ]}>
                              {getGradeLetter(gradeValue)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <Icon 
                        name={isExpanded ? "expand-less" : "expand-more"} 
                        size={20} 
                        color="#2196F3" 
                      />
                      <Text style={styles.expandText}>
                        {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
                      </Text>
                    </View>
                    <View style={styles.subjectCountContainer}>
                      <Icon name="book" size={14} color="#666" />
                      <Text style={styles.subjectCount}>
                        {Object.keys(grade.subjects).length} subject{Object.keys(grade.subjects).length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                All exam results are shown above. Results are updated when new exams are published.
              </Text>
            </View>
          </ScrollView>
        </View>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Header matching Attendance page
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  },

  // Grade Card
  gradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  gradeCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gradeCardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examInfo: {
    flex: 1,
    marginRight: 16,
  },
  examTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  examIcon: {
    marginRight: 8,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  examDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28, // Align with icon + text
  },
  gradeSummary: {
    alignItems: 'flex-end',
  },
  averageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  averageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  averageCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  averageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gradeDetails: {
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 16,
    paddingTop: 16,
  },
  subjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  gradeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center',
    marginRight: 8,
  },
  gradeBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  gradeLetterBadge: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  subjectCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Grades;