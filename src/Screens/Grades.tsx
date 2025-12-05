// src/screens/Grades.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { fetchGrades } from '../Service/functions';

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
    if (isNaN(numGrade)) return '#6b7280';
    
    if (numGrade >= 90) return '#10b981';
    if (numGrade >= 80) return '#3b82f6';
    if (numGrade >= 70) return '#f59e0b';
    return '#ef4444';
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading exam results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exam Results</Text>
          <Text style={styles.headerSubtitle}>
            {grades.length} exam{grades.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadGrades}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : grades.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Exam Results</Text>
            <Text style={styles.emptyText}>
              Your exam results will appear here once they are published.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
            contentContainerStyle={styles.scrollContent}
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
                      <Text style={styles.examName} numberOfLines={1}>
                        {grade.examName}
                      </Text>
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
                            <Text style={styles.gradeLetterBadge}>
                              {getGradeLetter(gradeValue)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.expandText}>
                      {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
                    </Text>
                    <Text style={styles.subjectCount}>
                      {Object.keys(grade.subjects).length} subject{Object.keys(grade.subjects).length !== 1 ? 's' : ''}
                    </Text>
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
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContent: {
    padding: 16,
  },
  gradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  gradeCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gradeCardHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examInfo: {
    flex: 1,
    marginRight: 16,
  },
  examName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  averageCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
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
    fontWeight: '700',
    color: '#ffffff',
  },
  gradeDetails: {
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    padding: 20,
    paddingTop: 16,
  },
  subjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    color: '#4b5563',
    flex: 1,
  },
  gradeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
    color: '#374151',
    minWidth: 20,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  expandText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  subjectCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Grades;