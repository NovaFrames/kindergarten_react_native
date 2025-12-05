// src/components/MiniGallery.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions
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

  if (loading) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.loadingContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </TouchableOpacity>
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
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.postInfo}>
          <Text style={styles.postTitle}>Latest Post</Text>
          <Text style={styles.postDate}>
            {formatDate(latestPost.createdAt)}
          </Text>
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherText}>by {teacherName || 'Teacher'}</Text>
        </View>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.postTitleText} numberOfLines={1}>
          {latestPost.title || 'Untitled Post'}
        </Text>
        <Text style={styles.postDescription} numberOfLines={2}>
          {latestPost.description || latestPost.text || ''}
        </Text>
      </View>

      {firstImage && !imageError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: firstImage }}
            style={styles.postImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.mediaCount}>
              📸 {latestPost.mediaUrls.length} media
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageIcon}>📄</Text>
          <Text style={styles.noImageText}>Text Post</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statCount}>{likeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💬</Text>
            <Text style={styles.statCount}>
              {latestPost.comments?.length || 0}
            </Text>
          </View>
        </View>
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
    minHeight: 200,
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
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
    minHeight: 200,
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
    marginBottom: 12,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  teacherInfo: {
    marginLeft: 8,
  },
  teacherText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  postContent: {
    marginBottom: 12,
  },
  postTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopLeftRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaCount: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  noImageContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noImageText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MiniGallery;