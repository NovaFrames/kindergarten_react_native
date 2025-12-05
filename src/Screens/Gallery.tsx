// src/screens/Gallery.tsx
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
  Image,
  TextInput,
  Dimensions,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { 
  fetchPostsRealtime, 
  Post, 
  fetchTeacher, 
  toggleLike, 
  addComment,
  fetchUser,
  Comment as CommentType,
  fetchPosts as fetchPostsStatic
} from '../Service/functions';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');

const Gallery: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, CommentType[]>>({});

  useEffect(() => {
    initializeUser();
    const unsubscribe = setupRealtimePosts();
    return () => unsubscribe();
  }, []);

  const initializeUser = async () => {
    try {
      const user = await fetchUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const setupRealtimePosts = () => {
    return fetchPostsRealtime(async (fetchedPosts) => {
      try {
        // Fetch teacher names for new posts
        const newTeacherNames = { ...teacherNames };
        const teacherPromises = fetchedPosts.map(async (post) => {
          if (!newTeacherNames[post.teacherId] && post.teacherId) {
            try {
              const teacher = await fetchTeacher(post.teacherId);
              if (teacher) {
                newTeacherNames[post.teacherId] = teacher.name || 'Teacher';
              }
            } catch (err) {
              console.error('Error fetching teacher:', err);
              newTeacherNames[post.teacherId] = 'Teacher';
            }
          }
        });

        await Promise.all(teacherPromises);
        
        setTeacherNames(newTeacherNames);
        setPosts(fetchedPosts);
        
        if (loading) setLoading(false);
        if (refreshing) setRefreshing(false);
        setError(null);
      } catch (err) {
        console.error('Error processing posts:', err);
        setError('Failed to load posts');
        if (loading) setLoading(false);
        if (refreshing) setRefreshing(false);
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Real-time listener will update automatically
  };

  const handleLikePress = async (postId: string) => {
    if (!currentUser?.uid || likingPostId) return;
    
    try {
      setLikingPostId(postId);
      await toggleLike(postId, currentUser.uid);
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const likes = { ...post.likes };
            if (likes[currentUser.uid]) {
              delete likes[currentUser.uid];
            } else {
              likes[currentUser.uid] = true;
            }
            return { 
              ...post, 
              likes, 
              likeCount: Object.keys(likes).length 
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Failed to update like');
    } finally {
      setLikingPostId(null);
    }
  };

  const handleCommentSubmit = async () => {
    if (!selectedPost || !currentUser?.uid || !newComment.trim() || commentLoading) return;

    try {
      setCommentLoading(true);
      await addComment(selectedPost.id, currentUser.uid, newComment.trim());
      
      // Add comment to local state
      const newCommentObj: CommentType = {
        id: Date.now().toString(),
        text: newComment.trim(),
        userId: currentUser.uid,
        createdAt: new Date()
      };
      
      setPostComments(prev => ({
        ...prev,
        [selectedPost.id]: [...(prev[selectedPost.id] || []), newCommentObj]
      }));
      
      setNewComment('');
      Alert.alert('Success', 'Comment added successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffHours < 24) {
        if (diffHours < 1) return 'Just now';
        if (diffHours === 1) return '1 hour ago';
        return `${diffHours} hours ago`;
      }
      
      return format(date, 'MMM d, yyyy • h:mm a');
    } catch {
      return '';
    }
  };

  const renderMediaGrid = (post: Post) => {
    const images = post.mediaUrls?.filter(media => media.type === 'image') || [];
    const videos = post.mediaUrls?.filter(media => media.type === 'video') || [];
    
    if (images.length === 0 && videos.length === 0) {
      return (
        <View style={styles.noMediaContainer}>
          <Text style={styles.noMediaIcon}>📄</Text>
          <Text style={styles.noMediaText}>Text Post</Text>
        </View>
      );
    }

    // Handle different number of images
    if (images.length === 1) {
      return (
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => {
            setSelectedImage(images[0].url);
            setImageModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: images[0].url }}
            style={styles.singleImage}
            resizeMode="cover"
          />
          {videos.length > 0 && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoIcon}>🎬</Text>
              <Text style={styles.videoCount}>{videos.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (images.length === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.twoImageItem,
                index === 0 && styles.twoImageItemLeft,
                index === 1 && styles.twoImageItemRight
              ]}
              onPress={() => {
                setSelectedImage(image.url);
                setImageModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: image.url }}
                style={styles.twoImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
          {videos.length > 0 && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoIcon}>🎬</Text>
              <Text style={styles.videoCount}>{videos.length}</Text>
            </View>
          )}
        </View>
      );
    }

    // For 3 or more images
    return (
      <View style={styles.multipleImagesContainer}>
        {images.slice(0, 3).map((image, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.multipleImageItem,
              index === 0 && styles.multipleImageItemLarge,
              index > 0 && styles.multipleImageItemSmall
            ]}
            onPress={() => {
              setSelectedImage(image.url);
              setImageModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: image.url }}
              style={styles.multipleImage}
              resizeMode="cover"
            />
            {index === 2 && images.length > 3 && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>+{images.length - 3}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {/* Show video count if any videos exist */}
        {videos.length > 0 && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoIcon}>🎬</Text>
            <Text style={styles.videoCount}>{videos.length}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderComments = (postId: string) => {
    const comments = postComments[postId] || [];
    
    if (comments.length === 0) {
      return (
        <View style={styles.noCommentsContainer}>
          <Text style={styles.noCommentsText}>No comments yet</Text>
          <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
        </View>
      );
    }

    return (
      <View style={styles.commentsList}>
        {comments.slice(-3).reverse().map((comment, index) => (
          <View key={`${comment.id}-${index}`} style={styles.commentItem}>
            <View style={styles.commentBubble}>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentTime}>
                {formatDate(comment.createdAt)}
              </Text>
            </View>
          </View>
        ))}
        {comments.length > 3 && (
          <Text style={styles.moreCommentsText}>
            +{comments.length - 3} more comment{comments.length - 3 !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    );
  };

  const getLikeCount = (post: Post) => {
    if (post.likeCount !== undefined) return post.likeCount;
    if (post.likes) return Object.keys(post.likes).length;
    return 0;
  };

  const getCommentCount = (postId: string) => {
    return postComments[postId]?.length || 0;
  };

  const isPostLiked = (post: Post) => {
    if (!currentUser?.uid || !post.likes) return false;
    return !!post.likes[currentUser.uid];
  };

  const renderPost = ({ item: post }: { item: Post }) => {
    const teacherName = teacherNames[post.teacherId] || 'Teacher';
    const likeCount = getLikeCount(post);
    const commentCount = getCommentCount(post.id);
    const isLiked = isPostLiked(post);

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.teacherInfo}>
            <View style={styles.teacherAvatar}>
              <Text style={styles.avatarText}>
                {teacherName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.teacherDetails}>
              <Text style={styles.teacherName}>{teacherName}</Text>
              <Text style={styles.postTime}>
                {formatDate(post.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          {post.title ? (
            <Text style={styles.postTitle}>{post.title}</Text>
          ) : null}
          {post.description ? (
            <Text style={styles.postDescription}>{post.description}</Text>
          ) : post.text ? (
            <Text style={styles.postDescription}>{post.text}</Text>
          ) : null}
        </View>

        {/* Media Grid */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <View style={styles.mediaSection}>
            {renderMediaGrid(post)}
            <Text style={styles.mediaCount}>
              {post.mediaUrls.length} media item{post.mediaUrls.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Stats and Actions */}
        <View style={styles.postStats}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statCount}>{likeCount}</Text>
            </View>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => {
                setSelectedPost(post);
                setCommentModalVisible(true);
              }}
            >
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statCount}>{commentCount}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => handleLikePress(post.id)}
              disabled={!currentUser?.uid || likingPostId === post.id}
            >
              <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
                {isLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
              {likingPostId === post.id && (
                <ActivityIndicator size="small" color="#ef4444" style={styles.likeLoading} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPost(post);
                setCommentModalVisible(true);
              }}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Preview */}
        {postComments[post.id] && postComments[post.id].length > 0 && (
          <View style={styles.commentsPreview}>
            {renderComments(post.id)}
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>School Gallery</Text>
          <Text style={styles.headerSubtitle}>
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={async () => {
                setRefreshing(true);
                try {
                  const newPosts = await fetchPostsStatic();
                  setPosts(newPosts);
                  setError(null);
                } catch (err) {
                  console.error('Error retrying:', err);
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptyText}>
              Posts from teachers will appear here when they share updates.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.viewModeContainer}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'list' && styles.viewModeButtonActive
                ]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[
                  styles.viewModeIcon,
                  viewMode === 'list' && styles.viewModeIconActive
                ]}>
                  ☰
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'grid' && styles.viewModeButtonActive
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Text style={[
                  styles.viewModeIcon,
                  viewMode === 'grid' && styles.viewModeIconActive
                ]}>
                  ⏹️
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.postsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#3b82f6']}
                  tintColor="#3b82f6"
                />
              }
              ListFooterComponent={
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    {posts.length} post{posts.length !== 1 ? 's' : ''} loaded
                  </Text>
                </View>
              }
            />
          </>
        )}

        {/* Comment Modal */}
        <Modal
          visible={commentModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedPost?.title || 'Comments'}
                </Text>
                <TouchableOpacity
                  onPress={() => setCommentModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalCommentsList}>
                {selectedPost && renderComments(selectedPost.id)}
              </ScrollView>

              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  style={[
                    styles.commentSubmitButton,
                    (!newComment.trim() || commentLoading) && styles.commentSubmitButtonDisabled
                  ]}
                  onPress={handleCommentSubmit}
                  disabled={!newComment.trim() || commentLoading}
                >
                  {commentLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.commentSubmitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Image Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.imageModalContainer}>
            <TouchableOpacity
              style={styles.imageModalBackground}
              onPress={() => setImageModalVisible(false)}
              activeOpacity={1}
            >
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullSizeImage}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageCloseButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.imageCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Modal>
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
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#f3f4f6',
  },
  viewModeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewModeIcon: {
    fontSize: 18,
  },
  viewModeIconActive: {
    color: '#ffffff',
  },
  postsList: {
    padding: 16,
    paddingTop: 8,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  postContent: {
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  mediaSection: {
    marginBottom: 16,
  },
  singleImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  twoImagesContainer: {
    flexDirection: 'row',
    height: 200,
    position: 'relative',
  },
  twoImageItem: {
    flex: 1,
  },
  twoImageItemLeft: {
    marginRight: 2,
  },
  twoImageItemRight: {
    marginLeft: 2,
  },
  twoImage: {
    width: '100%',
    height: '100%',
  },
  multipleImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  multipleImageItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  multipleImageItemLarge: {
    width: '100%',
    height: 200,
    marginBottom: 2,
  },
  multipleImageItemSmall: {
    width: '49.5%',
    height: 120,
    marginRight: '1%',
    marginBottom: 2,
  },
  multipleImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  videoCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'right',
  },
  noMediaContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noMediaIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noMediaText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  postStats: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
  },
  likedButton: {
    backgroundColor: '#fef2f2',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  likedIcon: {
    color: '#ef4444',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  likedText: {
    color: '#ef4444',
  },
  likeLoading: {
    marginLeft: 6,
  },
  commentsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 13,
    color: '#9ca3af',
  },
  commentsList: {
    paddingHorizontal: 4,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentBubble: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    maxWidth: '85%',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'right',
  },
  moreCommentsText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  modalCommentsList: {
    maxHeight: height * 0.5,
    padding: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827',
    marginRight: 12,
  },
  commentSubmitButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  commentSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: width,
    height: height * 0.8,
  },
  imageCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCloseButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
});

export default Gallery;