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
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
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
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Recent Exam Result</Text>
          <Text style={styles.headerSubtext}>{formattedDate}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{latestGrade.examName}</Text>
        </View>
      </View>

      <View style={styles.averageCard}>
        <Text style={styles.averageLabel}>Average Score</Text>
        <Text style={[
          styles.averageValue,
          { color: getGradeColor(average) }
        ]}>
          {average}
        </Text>
        <Text style={styles.averageSubtext}>Across {Object.keys(latestGrade.subjects).length} subjects</Text>
      </View>

      <View style={styles.subjectList}>
        {Object.entries(latestGrade.subjects)
          .slice(0, 3)
          .map(([subject, grade]: [string, any]) => (
            <View key={subject} style={styles.subjectRow}>
              <View>
                <Text style={styles.subjectName}>{subject}</Text>
                <Text style={styles.subjectSubtext}>Grade</Text>
              </View>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EAF0',
    padding: 16,
    gap: 14,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    gap: 4,
  },
  headerLabel: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  headerBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  averageCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
  },
  averageLabel: {
    color: '#CBD5F5',
    fontSize: 13,
  },
  averageValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#22C55E',
    marginVertical: 4,
  },
  averageSubtext: {
    color: '#CBD5F5',
    fontSize: 12,
  },
  subjectList: {
    gap: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  subjectSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  subjectGrade: {
    fontSize: 18,
    fontWeight: '700',
  },
  moreText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
});

export default MiniGrades;
