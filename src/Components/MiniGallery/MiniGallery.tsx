// src/components/MiniGallery.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { fetchPosts, fetchTeacher, Post } from '../../Service/functions';

interface MiniGalleryProps {
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

const MiniGallery: React.FC<MiniGalleryProps> = ({ onPress }) => {
  const [latestPost, setLatestPost] = useState<Post | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLatestPost();
  }, []);

  const loadLatestPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await fetchPosts();
      
      if (posts.length === 0) {
        setLatestPost(null);
        return;
      }

      // Get the most recent post (first in array)
      const latest = posts[0];
      setLatestPost(latest);

      // Fetch teacher name
      if (latest.teacherId) {
        const teacher = await fetchTeacher(latest.teacherId);
        if (teacher) {
          setTeacherName(teacher.name || 'Teacher');
        }
      }

      // Reset image error state
      setImageError(false);
    } catch (err) {
      console.error('Error loading latest post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getFirstImage = () => {
    if (!latestPost?.mediaUrls || latestPost.mediaUrls.length === 0) return null;
    return latestPost.mediaUrls.find(media => media.type === 'image')?.url || null;
  };

  const getLikeCount = () => {
    if (!latestPost?.likes) return 0;
    return Object.keys(latestPost.likes).length;
  };

  useEffect(() => {
    if (!loading && latestPost) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, latestPost, fadeAnim]);

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
        onPress={loadLatestPost}
        activeOpacity={0.7}
      >
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }

  if (!latestPost) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.emptyContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyIcon}>📸</Text>
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptySubtitle}>Posts will appear here</Text>
      </TouchableOpacity>
    );
  }

  const firstImage = getFirstImage();
  const likeCount = getLikeCount();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.touchWrapper}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Latest Gallery Post</Text>
            <Text style={styles.headerSubtext}>
              {formatDate(latestPost.createdAt)}
            </Text>
          </View>
        </View>

        {firstImage && !imageError ? (
          <View style={styles.mediaHero}>
            <Image
              source={{ uri: firstImage }}
              style={styles.postImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
            <View style={styles.mediaMeta}>
              <Text style={styles.mediaTitle} numberOfLines={1}>
                {latestPost.title || 'Untitled Post'}
              </Text>
              <Text style={styles.mediaSubtitle} numberOfLines={2}>
                {latestPost.description || latestPost.text || ''}
              </Text>
              <Text style={styles.mediaTeacher}>
                by {teacherName || 'Teacher'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noMedia}>
            <Text style={styles.noMediaIcon}>🗒️</Text>
            <Text style={styles.noMediaText}>Text update</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>❤️ {likeCount}</Text>
          <Text style={styles.statsText}>
            💬 {latestPost.comments?.length || 0}
          </Text>
          <Text style={styles.statsText}>
            📁 {latestPost.mediaUrls?.length || 0} media
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0F172A',
    padding: 18,
  },
  touchWrapper: {
    gap: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    gap: 6,
  },
  errorText: {
    fontSize: 24,
    color: '#F87171',
  },
  errorMessage: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#60A5FA',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    gap: 4,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
    color: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 13,
    color: '#CBD5F5',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  mediaHero: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  postImage: {
    width: '100%',
    height: 180,
  },
  mediaMeta: {
    padding: 14,
    backgroundColor: 'rgba(15,23,42,0.85)',
    gap: 6,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mediaSubtitle: {
    fontSize: 14,
    color: '#CBD5F5',
  },
  mediaTeacher: {
    fontSize: 12,
    color: '#94A3B8',
  },
  noMedia: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  noMediaIcon: {
    fontSize: 30,
    marginBottom: 8,
    color: '#E2E8F0',
  },
  noMediaText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },
});

export default MiniGallery;
