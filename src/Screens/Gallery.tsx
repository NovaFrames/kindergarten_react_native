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
  Alert,
  Keyboard
} from 'react-native';
import {
  fetchPostsRealtime,
  Post,
  fetchTeacher,
  toggleLike,
  addComment,
  fetchUser,
  Comment as CommentType,
  fetchPosts as fetchPostsStatic,
  listenToComments,
  fetchUserById
} from '../Service/functions';
import { format, isToday } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ScreenHeader from '../Components/ScreenHeader';
import HeaderNotificationButton from '../Components/HeaderNotificationButton';

const { width, height } = Dimensions.get('window');

export interface Student {
  uid: string;
  id?: string;
  studentName: string;
  studentClass: string;
  [key: string]: any;
}

const Gallery: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentUsers, setCommentUsers] = useState<Record<string, Student | null>>({});
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
        /** ---------------------------
         * 1. Fetch Teacher Names
         * --------------------------- */
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

        /** ---------------------------
         * 2. Set Posts
         * --------------------------- */
        setPosts(fetchedPosts);

        /** ---------------------------
         * 3. 🔥 Listen to Comments for each post
         * --------------------------- */
        for (const post of fetchedPosts) {
          listenToComments(post.id, (comments) => {
            setPostComments(prev => ({
              ...prev,
              [post.id]: comments
            }));
          });
        }

        /** ---------------------------
         * 4. Finish Loading
         * --------------------------- */
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

  useEffect(() => {
    const fetchUsersForComments = async () => {
      const allUserIds = new Set<string>();
      Object.values(postComments).forEach(comments => {
        comments.forEach(comment => {
          if (!commentUsers[comment.userId]) {
            allUserIds.add(comment.userId);
          }
        });
      });

      const promises = Array.from(allUserIds).map(async userId => {
        try {
          const user = await fetchUserById(userId);
          return { userId, user };
        } catch {
          return { userId, user: null };
        }
      });

      const results = await Promise.all(promises);
      const newUsers: Record<string, Student | null> = {};
      results.forEach(r => {
        newUsers[r.userId] = r.user;
      });

      setCommentUsers(prev => ({ ...prev, ...newUsers }));
    };

    if (Object.keys(postComments).length > 0) {
      fetchUsersForComments();
    }
  }, [postComments]);


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

  const renderComments = (postId: string, inModal: boolean = false) => {
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

    // Determine which comments to show
    let commentsToShow = comments;

    if (!inModal) {
      // Normal feed: only show last comment
      commentsToShow = comments.slice(-1);
    }

    return (
      <View style={styles.commentsList}>
        {commentsToShow.map((comment, index) => {
          const user = commentUsers[comment.userId];
          const userName = user?.firstName + user?.lastName || 'User';

          return (
            <View key={`${comment.id}-${index}`} style={styles.commentItem}>
              <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>{userName}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
              </View>
            </View>
          );
        })}

        {!inModal && comments.length > 1 && (
          <Text onPress={() => {
            Keyboard.dismiss();
            setCommentModalVisible(true);
          }} style={[styles.moreCommentsText, { color: '#0088ffff' }]}>
            +{comments.length - 1} more comment{comments.length - 1 !== 1 ? 's' : ''}
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
                Keyboard.dismiss();
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
                Keyboard.dismiss();
                setCommentModalVisible(true);
              }}
            >
              <Icon name="chat-bubble-outline" size={20} color="#666" />
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Preview in Feed */}
        {postComments[post.id] && postComments[post.id].length > 0 && (
          <View style={styles.commentsPreview}>
            {renderComments(post.id, false)}
          </View>
        )}

      </View>
    );
  };

  const todayPostCount = posts.filter(post => {
    const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt || 0);
    if (isNaN(createdAt.getTime())) {
      return false;
    }
    return isToday(createdAt);
  }).length;

  const renderSkeletonFeed = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.skeletonContainer}
    >
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonHeaderText}>
              <View style={styles.skeletonLineShort} />
              <View style={styles.skeletonLineTiny} />
            </View>
          </View>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineNarrow]} />
          <View style={styles.skeletonMedia} />
        </View>
      ))}
    </ScrollView>
  );

  const renderFeedContent = () => {
    if (error) {
      return (
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
      );
    }

    if (loading) {
      return renderSkeletonFeed();
    }

    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="collections" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Posts Yet</Text>
          <Text style={styles.emptyText}>
            Posts from teachers will appear here when they share updates.
          </Text>
        </View>
      );
    }

    return (
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
    );
  };

  // Helper function for avatar colors
  const getAvatarColor = (name: string) => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#3F51B5', '#009688'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Classroom Moments"
        subtitle="A curated feed of the latest photos and updates shared by teachers."
        iconName="collections-bookmark"
        iconColor="#1E3A8A"
        actions={<HeaderNotificationButton count={todayPostCount} />}
      />

      <View style={styles.contentContainer}>
        {renderFeedContent()}
      </View>

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

            {/* Comments in Modal */}
            <ScrollView style={styles.modalCommentsList}>
              {selectedPost && renderComments(selectedPost.id, true)}
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
    marginTop: 16,
    marginBottom: 16,

  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  skeletonHeaderText: {
    flex: 1,
    gap: 6,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: '60%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  skeletonLineTiny: {
    width: '30%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EDF2F7',
  },
  skeletonLineNarrow: {
    width: '80%',
  },
  skeletonMedia: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
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
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 2,
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
