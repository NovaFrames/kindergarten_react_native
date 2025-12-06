import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
import Icon from 'react-native-vector-icons/MaterialIcons';

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
          <Icon name="article" size={32} color="#666" />
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
              <Icon name="videocam" size={16} color="#FFF" />
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
              <Icon name="videocam" size={16} color="#FFF" />
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
            <Icon name="videocam" size={16} color="#FFF" />
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
          <Icon name="chat-bubble-outline" size={32} color="#CCC" />
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

  const renderStatistics = () => {
    const totalLikes = posts.reduce((sum, post) => sum + getLikeCount(post), 0);
    const totalImages = posts.reduce((sum, post) => {
      const images = post.mediaUrls?.filter(media => media.type === 'image') || [];
      return sum + images.length;
    }, 0);
    const totalVideos = posts.reduce((sum, post) => {
      const videos = post.mediaUrls?.filter(media => media.type === 'video') || [];
      return sum + videos.length;
    }, 0);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="collections" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="favorite" size={24} color="#F44336" />
          <Text style={styles.statNumber}>{totalLikes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="photo" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{totalImages}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>

        <View style={styles.statItem}>
          <Icon name="videocam" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{totalVideos}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
      </View>
    );
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
            <View style={[
              styles.teacherAvatar,
              { backgroundColor: getAvatarColor(teacherName) }
            ]}>
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
            <View style={styles.statIconItem}>
              <Icon name="favorite" size={16} color="#F44336" />
              <Text style={styles.statCount}>{likeCount}</Text>
            </View>
            <TouchableOpacity
              style={styles.statIconItem}
              onPress={() => {
                setSelectedPost(post);
                setCommentModalVisible(true);
              }}
            >
              <Icon name="chat-bubble-outline" size={16} color="#666" />
              <Text style={styles.statCount}>{commentCount}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => handleLikePress(post.id)}
              disabled={!currentUser?.uid || likingPostId === post.id}
            >
              <Icon 
                name={isLiked ? "favorite" : "favorite-border"} 
                size={20} 
                color={isLiked ? "#F44336" : "#666"} 
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
              {likingPostId === post.id && (
                <ActivityIndicator size="small" color="#F44336" style={styles.likeLoading} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPost(post);
                setCommentModalVisible(true);
              }}
            >
              <Icon name="chat-bubble-outline" size={20} color="#666" />
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

  // Helper function for avatar colors
  const getAvatarColor = (name: string) => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#3F51B5', '#009688'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading gallery posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header matching Attendance page */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'list' && styles.activeTab]}
          onPress={() => setViewMode('list')}
        >
          <Icon 
            name="view-agenda" 
            size={20} 
            color={viewMode === 'list' ? "#FFF" : "#666"} 
          />
          <Text style={[styles.tabText, viewMode === 'list' && styles.activeTabText]}>
            List
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, viewMode === 'grid' && styles.activeTab]}
          onPress={() => setViewMode('grid')}
        >
          <Icon 
            name="grid-view" 
            size={20} 
            color={viewMode === 'grid' ? "#FFF" : "#666"} 
          />
          <Text style={[styles.tabText, viewMode === 'grid' && styles.activeTabText]}>
            Grid
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Posts</Text>
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
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="collections" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Posts Yet</Text>
          <Text style={styles.emptyText}>
            Posts from teachers will appear here when they share updates.
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {renderStatistics()}
          
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
                colors={['#2196F3']}
              />
            }
            ListFooterComponent={
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Showing {posts.length} post{posts.length !== 1 ? 's' : ''}
                </Text>
              </View>
            }
          />
        </View>
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
                <Icon name="close" size={24} color="#666" />
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
                placeholderTextColor="#999"
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
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Icon name="send" size={20} color="#FFF" />
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
            <Icon name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>
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

  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
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
    fontSize: 18,
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

  // Posts List
  postsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Post Card
  postCard: {
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
    color: '#333',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: '#666',
  },
  postContent: {
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },

  // Media Section
  mediaSection: {
    marginBottom: 16,
  },
  singleImageContainer: {
    borderRadius: 12,
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
    borderRadius: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
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
  videoCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  mediaCount: {
    fontSize: 12,
    color: '#666',
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
  noMediaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 8,
  },

  // Post Stats
  postStats: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statIconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
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
    backgroundColor: '#F8F9FA',
    marginHorizontal: 4,
  },
  likedButton: {
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  likedText: {
    color: '#F44336',
  },
  likeLoading: {
    marginLeft: 6,
  },

  // Comments
  commentsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  noCommentsSubtext: {
    fontSize: 13,
    color: '#999',
  },
  commentsList: {
    paddingHorizontal: 4,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentBubble: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    maxWidth: '85%',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  moreCommentsText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Comment Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCommentsList: {
    maxHeight: height * 0.5,
    padding: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
    marginRight: 12,
  },
  commentSubmitButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#CCC',
  },

  // Image Modal
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
});

export default Gallery;