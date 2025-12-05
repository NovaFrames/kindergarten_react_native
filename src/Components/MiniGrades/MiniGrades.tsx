// src/components/MiniGrades.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { fetchGrades } from '../../Service/functions';

interface MiniGradesProps {
  onPress?: () => void;
}

const MiniGrades: React.FC<MiniGradesProps> = ({ onPress }) => {
  const [latestGrade, setLatestGrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLatestGrade();
  }, []);

  const loadLatestGrade = async () => {
    try {
      setLoading(true);
      setError(null);
      const grades = await fetchGrades();
      
      if (grades.length === 0) {
        setLatestGrade(null);
        return;
      }

      // Get the most recent grade (first in array after sorting by date)
      const latest = grades[0];
      setLatestGrade(latest);
    } catch (err) {
      console.error('Error loading latest grade:', err);
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  // Calculate average grade
  const calculateAverage = (grade: any) => {
    if (!grade || !grade.subjects) return 'N/A';
    
    const subjects = Object.values(grade.subjects);
    if (subjects.length === 0) return 'N/A';
    
    const numericGrades = subjects
      .map((grade: any) => parseFloat(grade))
      .filter(grade => !isNaN(grade));
    
    if (numericGrades.length === 0) return 'N/A';
    
    const sum = numericGrades.reduce((a, b) => a + b, 0);
    const average = (sum / numericGrades.length).toFixed(1);
    return average;
  };

  if (loading) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.loadingContainer]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </TouchableOpacity>
    );
  }

  if (error) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.errorContainer]} 
        onPress={loadLatestGrade}
        activeOpacity={0.7}
      >
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }

  if (!latestGrade) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.emptyContainer]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Grades Yet</Text>
        <Text style={styles.emptySubtitle}>Exam results will appear here</Text>
      </TouchableOpacity>
    );
  }

  const average = calculateAverage(latestGrade);
  const gradeDate = new Date(latestGrade.date);
  const formattedDate = gradeDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Determine grade color based on average
  const getGradeColor = (avg: string) => {
    const numAvg = parseFloat(avg);
    if (isNaN(numAvg)) return '#6b7280'; // gray
    
    if (numAvg >= 90) return '#10b981'; // green
    if (numAvg >= 80) return '#3b82f6'; // blue
    if (numAvg >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Latest Exam Result</Text>
          <Text style={styles.subtitle}>{formattedDate}</Text>
        </View>
        <Text style={styles.examName}>{latestGrade.examName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.averageContainer}>
          <Text style={styles.averageLabel}>Average</Text>
          <View style={[
            styles.averageCircle, 
            { backgroundColor: getGradeColor(average) }
          ]}>
            <Text style={styles.averageValue}>{average}</Text>
          </View>
        </View>

        <View style={styles.subjectsContainer}>
          <Text style={styles.subjectsTitle}>Top Subjects:</Text>
          {Object.entries(latestGrade.subjects)
            .slice(0, 3) // Show only top 3 subjects
            .map(([subject, grade]: [string, any]) => (
              <View key={subject} style={styles.subjectRow}>
                <Text style={styles.subjectName} numberOfLines={1}>
                  {subject}
                </Text>
                <Text style={[
                  styles.subjectGrade,
                  { color: getGradeColor(grade) }
                ]}>
                  {grade}
                </Text>
              </View>
            ))}
          
          {Object.keys(latestGrade.subjects).length > 3 && (
            <Text style={styles.moreText}>
              +{Object.keys(latestGrade.subjects).length - 3} more subjects
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewAllText}>View all results →</Text>
      </View>
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
    minHeight: 160,
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
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
    minHeight: 160,
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
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  averageContainer: {
    alignItems: 'center',
    marginRight: 24,
  },
  averageLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  averageCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectsContainer: {
    flex: 1,
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    marginRight: 8,
  },
  subjectGrade: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  moreText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
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

export default MiniGrades;