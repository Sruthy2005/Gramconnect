import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Plus,
  X,
  MapPin,
  Clock,
  Sparkles,
  Calendar,
  Activity,
  Heart,
  CornerDownRight,
  TrendingUp,
  UserCheck,
  Globe,
  Upload,
  Lock,
  Shield,
  Trash2,
  Edit,
  Compass,
  AlertTriangle,
  User as UserIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function UserCommunityHub() {
  const { user } = useAuth();

  // Feed Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Posts');
  const [sortBy, setSortBy] = useState('Newest');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    pendingReview: 0,
    approvedPosts: 0,
    rejectedPosts: 0
  });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postLocation, setPostLocation] = useState(user?.panchayat || user?.district || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [postVisibility, setPostVisibility] = useState('Public');
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postErrors, setPostErrors] = useState({});

  // Active expanded comments tracker (postId)
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyBox, setActiveReplyBox] = useState({}); // commentId: true

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
    'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ];

  const validateAndSetFile = (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setPostErrors(prev => ({ ...prev, image: 'Only JPG, PNG, and WEBP formats are supported.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPostErrors(prev => ({ ...prev, image: 'Image size cannot exceed 5MB.' }));
      return;
    }
    setPostErrors(prev => ({ ...prev, image: '' }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFullImageUrl = (imgUrl) => {
    if (!imgUrl) return 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    return `http://localhost:5000${imgUrl}`;
  };

  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setCaption(post.caption);
    setPostCategory(post.category || 'General');
    setPostLocation(post.district || user?.panchayat || user?.district || '');
    setImagePreview(getFullImageUrl(post.image));
    setImageFile(null);
    setPostVisibility(post.visibility || 'Public');
    setPostErrors({});
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingPost(null);
    setCaption('');
    setPostCategory('General');
    setPostLocation(user?.panchayat || user?.district || '');
    setImageFile(null);
    setImagePreview('');
    setPostVisibility('Public');
    setPostErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categories = [
    'All Posts',
    'My Posts',
    'News & Updates',
    'Events',
    'Public Awareness',
    'Environment',
    'Blood Donation',
    'Traffic',
    'Lost & Found',
    'Government',
    'General'
  ];

  // Fetch approved posts from API
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      let res;
      if (selectedCategory === 'My Posts') {
        const params = {
          search,
          sortBy,
          page: pageNum,
          limit: 5
        };
        res = await api.get('/community/my-posts', { params });
      } else {
        const params = {
          search,
          category: selectedCategory,
          sortBy,
          page: pageNum,
          limit: 5
        };
        res = await api.get('/community/posts', { params });
      }

      if (res.data && res.data.success) {
        if (append) {
          setPosts(prev => [...prev, ...res.data.posts]);
        } else {
          setPosts(res.data.posts || []);
        }
        setHasMore(res.data.hasMore);
        setPage(pageNum);
        setStats({
          totalPosts: res.data.totalPosts || 0,
          approvedPosts: res.data.totalPosts || 0,
          pendingReview: 0,
          rejectedPosts: 0
        });
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to fetch community feed.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger fetch when search or sort or category changes
  useEffect(() => {
    fetchPosts(1, false);
  }, [search, selectedCategory, sortBy]);

  const loadNextPage = () => {
    if (hasMore && !loadingMore) {
      fetchPosts(page + 1, true);
    }
  };

  // Publish a new post
  const handlePublishPost = async (e) => {
    e.preventDefault();

    // ── Per-field validation ────────────────────────────────────────────────
    const errors = {};
    if (!caption.trim()) errors.caption = 'Caption is required.';
    if (!postCategory || postCategory === '') errors.category = 'Category is required.';
    if (!postLocation || !postLocation.trim()) {
      errors.location = 'Location is required.';
    } else if (!KERALA_DISTRICTS.includes(postLocation.trim())) {
      errors.location = 'Please select a valid Kerala district.';
    }

    if (Object.keys(errors).length > 0) {
      setPostErrors(errors);
      return;
    }
    setPostErrors({});

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('category', postCategory);
      formData.append('location', postLocation);
      formData.append('district', postLocation);
      formData.append('visibility', postVisibility);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      let res;
      if (editingPost) {
        res = await api.put(`/community/posts/${editingPost._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        res = await api.post('/community/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (res.data && res.data.success) {
        showToast(editingPost ? 'Post updated successfully! Awaiting review.' : 'Post submitted successfully! Awaiting admin approval.', 'success');
        handleCloseModal();
        
        // Refresh feed
        fetchPosts(1, false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit post.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Like / Unlike post
  const handleToggleLike = async (postId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              likes: res.data.likes,
              likesList: res.data.likesList
            };
          }
          return p;
        }));
      }
    } catch (err) {
      showToast('Failed to update post reaction.', 'error');
    }
  };

  // Toggle Bookmark post
  const handleToggleBookmark = async (postId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/bookmark`);
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              bookmarksList: res.data.bookmarksList
            };
          }
          return p;
        }));
        showToast(res.data.bookmarked ? 'Post added to bookmarks.' : 'Post removed from bookmarks.', 'success');
      }
    } catch (err) {
      showToast('Failed to update bookmark status.', 'error');
    }
  };

  // Increment Shares Count
  const handleShare = async (postId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/share`);
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, shares: res.data.shares };
          }
          return p;
        }));
        // Show simulated share alert
        const postLink = `${window.location.origin}/community#post-${postId}`;
        navigator.clipboard.writeText(postLink);
        showToast('Link copied to clipboard! Share it with your friends.', 'success');
      }
    } catch (err) {
      showToast('Failed to share post.', 'error');
    }
  };

  // Delete own post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete your post permanently?')) return;
    try {
      const res = await api.delete(`/community/posts/${postId}`);
      if (res.data && res.data.success) {
        showToast('Post deleted successfully.', 'success');
        setPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete post.', 'error');
    }
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;

    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { text });
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              comments: res.data.comments,
              commentsCount: res.data.commentsCount
            };
          }
          return p;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      showToast('Failed to post comment.', 'error');
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete comment?')) return;
    try {
      const res = await api.delete(`/community/posts/${postId}/comments/${commentId}`);
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              comments: res.data.comments,
              commentsCount: res.data.commentsCount
            };
          }
          return p;
        }));
        showToast('Comment deleted.', 'success');
      }
    } catch (err) {
      showToast('Failed to delete comment.', 'error');
    }
  };

  // Like comment
  const handleToggleLikeComment = async (postId, commentId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/comments/${commentId}/like`);
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            const updatedComments = p.comments.map(c => {
              if (c._id === commentId) {
                return { ...c, likes: res.data.likes };
              }
              return c;
            });
            return { ...p, comments: updatedComments };
          }
          return p;
        }));
      }
    } catch (err) {
      showToast('Failed to react to comment.', 'error');
    }
  };

  // Reply to comment
  const handleAddReply = async (postId, commentId) => {
    const text = replyInputs[commentId] || '';
    if (!text.trim()) return;

    try {
      const res = await api.post(`/community/posts/${postId}/comments/${commentId}/replies`, { text });
      if (res.data && res.data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            const updatedComments = p.comments.map(c => {
              if (c._id === commentId) {
                return { ...c, replies: res.data.replies };
              }
              return c;
            });
            return { ...p, comments: updatedComments };
          }
          return p;
        }));
        setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
        setActiveReplyBox(prev => ({ ...prev, [commentId]: false }));
      }
    } catch (err) {
      showToast('Failed to add reply.', 'error');
    }
  };

  // Expand / collapse comments section
  const toggleCommentsView = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getPostTimeElapsed = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const created = new Date(dateStr);
    if (isNaN(created.getTime())) return 'Unknown date';

    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    
    // Fallback if client local clock is slightly behind server timestamp
    if (diffMs < 0) return 'Just now';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    // Yesterday comparison
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = created.getDate() === yesterday.getDate() &&
                        created.getMonth() === yesterday.getMonth() &&
                        created.getFullYear() === yesterday.getFullYear();
    
    if (isYesterday) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
    }

    // Month comparison
    const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    if (diffMonths < 12) {
      const displayMonths = diffMonths || 1;
      return `${displayMonths} month${displayMonths === 1 ? '' : 's'} ago`;
    }

    // Year comparison
    const diffYears = now.getFullYear() - created.getFullYear();
    const displayYears = diffYears || 1;
    return `${displayYears} year${displayYears === 1 ? '' : 's'} ago`;
  };

  // Dynamic statistics for sidebar
  const activeCitizens = 384;
  const pendingRequests = posts.filter(p => p.status === 'Pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* TOAST ALERT FEEDBACK */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 3000,
            padding: '14px 20px',
            borderRadius: '12px',
            background: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            borderLeft: `4px solid ${toast.type === 'success' ? 'var(--primary)' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#1f2937',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {toast.type === 'success' ? '🟢' : '🔴'} {toast.message}
        </div>
      )}

      {/* HEADER SECTION */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid #edf2f7'
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>Community Hub</h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Connect with your community, share updates and stay informed.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          style={{
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <Plus size={16} /> Create Post
        </button>
      </div>

      {/* CATEGORIES PILLS SLIDER */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: '10px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                whiteSpace: 'nowrap',
                padding: '10px 20px',
                borderRadius: '99px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isActive ? 'none' : '1px solid rgba(229, 231, 235, 0.8)',
                background: isActive ? 'var(--primary)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-muted)'
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = '#ffffff'; }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* SEARCH AND SORT TOOLBAR */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(229, 231, 235, 0.6)', padding: '16px 20px', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 14px 10px 36px',
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #edf2f7',
              fontSize: '0.88rem',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>

        {/* Sort */}
        <div style={{ flex: '0 0 180px' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 14px',
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #edf2f7',
              fontSize: '0.88rem',
              outline: 'none',
              cursor: 'pointer',
              background: '#ffffff'
            }}
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Most Liked">Most Liked</option>
            <option value="Most Commented">Most Commented</option>
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '32px', flexWrap: 'wrap' }} className="community-grid-desktop">
        
        {/* LEFT COLUMN: COMMUNITY FEED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {loading ? (
            // Feed Loading Skeleton Loader
            [1, 2].map(i => (
              <div key={i} className="skeleton-card" style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #edf2f7', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="skeleton-circle skeleton-box" style={{ width: '44px', height: '44px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-text skeleton-box" style={{ width: '120px', height: '14px' }} />
                    <div className="skeleton-text skeleton-box" style={{ width: '80px', height: '10px' }} />
                  </div>
                </div>
                <div className="skeleton-box" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
                <div className="skeleton-box" style={{ width: '100%', height: '240px', borderRadius: '12px' }} />
              </div>
            ))
          ) : posts.length === 0 ? (
            // Empty Feed State
            <div style={{ background: '#ffffff', border: '1px solid rgba(229, 231, 235, 0.6)', padding: '80px 24px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '4rem' }}>{selectedCategory === 'My Posts' ? '📝' : '👥'}</span>
              <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.25rem' }}>
                {selectedCategory === 'My Posts' ? 'No posts created yet.' : 'No community posts available.'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {selectedCategory === 'My Posts' ? 'Share your thoughts, announcements, or warnings with the village community!' : 'Be the first to share an update, warning, or community notice with your neighbors!'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="admin-btn primary"
                style={{ background: 'var(--primary)', color: '#fff', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, marginTop: '8px' }}
              >
                {selectedCategory === 'My Posts' ? 'Create Your First Post' : 'Create First Post'}
              </button>
            </div>
          ) : (
            // Posts List Feed
            <>
              {posts.map((post) => {
                const isLiked = post.likesList?.includes(user?.id);
                const isBookmarked = post.bookmarksList?.includes(user?.id);
                const isOwner = post.user?._id === user?.id;

                const computedUsername = post.isOfficial
                  ? '@admin'
                  : (post.user?.email
                    ? `@${post.user.email.split('@')[0]}`
                    : `@citizen`);

                return (
                  <div
                    key={post._id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      border: '1px solid rgba(229, 231, 235, 0.6)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                    }}
                  >
                    {/* Post Author Metadata Info Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {post.isOfficial ? (
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', border: '2px solid var(--primary)' }}>
                            🛡
                          </div>
                        ) : post.user?.profilePicture ? (
                          <img
                            src={getFullImageUrl(post.user.profilePicture)}
                            alt={post.user.fullName}
                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #edf2f7' }}
                          />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                            {(post.user?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {post.isOfficial ? (
                              <>
                                <Shield size={14} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary)' }}>GramConnect Admin</span>
                                <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#10b981', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', marginLeft: '4px' }}>Official Update</span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>{post.user?.fullName || 'Deleted User'}</span>
                                {post.user?.isVerified && (
                                  <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} title="Verified Local Resident" />
                                )}
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                            <span>{computedUsername}</span>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={10} /> 
                              {post.isOfficial 
                                ? (post.districtTarget === 'ALL' ? '🌍 All Districts' : `📍 ${post.districtTarget}`)
                                : post.district
                              }
                            </span>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {getPostTimeElapsed(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Header Actions (Visibility badge, status badge, and edit/delete if owner) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Status Badge */}
                        {(selectedCategory === 'My Posts' || isOwner) && post.status && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '99px',
                              textTransform: 'capitalize',
                              background: post.status === 'Pending' ? '#fff7ed' : post.status === 'Approved' ? '#ecfdf5' : '#fef2f2',
                              color: post.status === 'Pending' ? '#ea580c' : post.status === 'Approved' ? '#10b981' : '#ef4444'
                            }}
                          >
                            {post.status === 'Pending' ? 'Pending Approval' : post.status}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            background: '#f1f5f9',
                            color: '#475569',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {post.visibility === 'Public' ? <Globe size={10} /> : <Lock size={10} />}
                          {post.visibility}
                        </span>

                        {isOwner && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {post.status === 'Pending' && (
                              <button
                                onClick={() => handleOpenEditModal(post)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                title="Edit Post"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                              title="Delete Post"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Category Badge */}
                    <div style={{ display: 'flex' }}>
                      <span
                        style={{
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          textTransform: 'capitalize'
                        }}
                      >
                        {post.category}
                      </span>
                    </div>

                    {/* Post Caption Body Text */}
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {post.caption}
                    </p>

                    {/* Post Visual Content (Large image previews) */}
                    {post.image && (
                      <div
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          background: '#f8fafc',
                          border: '1px solid #edf2f7',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={getFullImageUrl(post.image)}
                          alt="Post Visual Content"
                          loading="lazy"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Interaction Button / Count Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                        padding: '8px 0',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {/* Left: Like & Comment */}
                      <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Like reaction */}
                        <button
                          onClick={() => handleToggleLike(post._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: isLiked ? 'var(--primary)' : 'var(--text-muted)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <ThumbsUp size={16} fill={isLiked ? 'var(--primary)' : 'transparent'} style={{ color: isLiked ? 'var(--primary)' : 'inherit' }} />
                          <span>{Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                        </button>

                        {/* Comment Toggle */}
                        <button
                          onClick={() => toggleCommentsView(post._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: expandedComments[post._id] ? 'var(--primary)' : 'var(--text-muted)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <MessageSquare size={16} />
                          <span>{Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)}</span>
                        </button>
                      </div>

                      {/* Right: Share & Bookmark */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Share */}
                        <button
                          onClick={() => handleShare(post._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Share2 size={16} />
                          <span>Share</span>
                        </button>

                        {/* Bookmark */}
                        <button
                          onClick={() => handleToggleBookmark(post._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: isBookmarked ? 'var(--primary)' : 'var(--text-muted)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          title="Bookmark"
                        >
                          <Bookmark size={16} fill={isBookmarked ? 'var(--primary)' : 'transparent'} />
                        </button>
                      </div>
                    </div>

                    {/* COMMENTS COLLAPSIBLE PORTION */}
                    {expandedComments[post._id] && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '4px' }}>
                        
                        {/* Comments input block */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post._id); }}
                            style={{
                              flex: 1,
                              borderRadius: '10px',
                              border: '1px solid #edf2f7',
                              padding: '8px 14px',
                              fontSize: '0.85rem',
                              background: '#f8fafc',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            style={{
                              background: 'var(--primary)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '8px',
                              padding: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Send size={14} />
                          </button>
                        </div>

                        {/* List of comments */}
                        {post.comments && post.comments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
                            {post.comments.map((comment) => {
                              const isCommentLiked = comment.likes?.includes(user?.id);
                              const isCommentOwner = comment.user?._id === user?.id;

                              return (
                                <div key={comment._id} style={{ display: 'flex', gap: '12px' }}>
                                  {/* Avatar */}
                                  {comment.user?.profilePicture ? (
                                    <img
                                      src={getFullImageUrl(comment.user.profilePicture)}
                                      alt={comment.user.fullName}
                                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                      {(comment.user?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                  )}

                                  {/* Comment details */}
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '14px', border: '1px solid #edf2f7' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{comment.user?.fullName || 'Deleted user'}</span>
                                        {isCommentOwner && (
                                          <button
                                            onClick={() => handleDeleteComment(post._id, comment._id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1a1' }}
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{comment.text}</p>
                                    </div>

                                    {/* Action Row below comment: Like, Reply, timestamp, likes count */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '8px' }}>
                                      <button
                                        onClick={() => handleToggleLikeComment(post._id, comment._id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: isCommentLiked ? 'var(--primary)' : 'var(--text-muted)' }}
                                      >
                                        Like {comment.likes && comment.likes.length > 0 && `(${comment.likes.length})`}
                                      </button>
                                      <button
                                        onClick={() => setActiveReplyBox(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--text-muted)' }}
                                      >
                                        Reply
                                      </button>
                                      <span>{getPostTimeElapsed(comment.createdAt)}</span>
                                    </div>

                                    {/* Replies List nested */}
                                    {comment.replies && comment.replies.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid #edf2f7' }}>
                                        {comment.replies.map((reply) => (
                                          <div key={reply._id} style={{ display: 'flex', gap: '8px' }}>
                                            {reply.user?.profilePicture ? (
                                              <img
                                                src={getFullImageUrl(reply.user.profilePicture)}
                                                alt={reply.user.fullName}
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                              />
                                            ) : (
                                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem' }}>
                                                {(reply.user?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                              </div>
                                            )}
                                            <div style={{ flex: 1, background: '#f8fafc', padding: '6px 10px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>{reply.user?.fullName || 'Deleted user'}</span>
                                              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{reply.text}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Reply Box input */}
                                    {activeReplyBox[comment._id] && (
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', paddingLeft: '12px' }}>
                                        <CornerDownRight size={14} style={{ color: 'var(--text-muted)' }} />
                                        <input
                                          type="text"
                                          placeholder="Write a reply..."
                                          value={replyInputs[comment._id] || ''}
                                          onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddReply(post._id, comment._id); }}
                                          style={{
                                            flex: 1,
                                            borderRadius: '8px',
                                            border: '1px solid #edf2f7',
                                            padding: '6px 12px',
                                            fontSize: '0.8rem',
                                            background: '#f8fafc',
                                            outline: 'none'
                                          }}
                                        />
                                        <button
                                          onClick={() => handleAddReply(post._id, comment._id)}
                                          style={{
                                            background: 'var(--primary)',
                                            border: 'none',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            padding: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          <Send size={12} />
                                        </button>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

              {/* LOAD MORE PILL BUTTON */}
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 32px 0' }}>
                  <button
                    onClick={loadNextPage}
                    disabled={loadingMore}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(229, 231, 235, 0.8)',
                      borderRadius: '99px',
                      padding: '12px 32px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: 'var(--glass-shadow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
                  >
                    {loadingMore ? <RefreshCw size={14} className="spin" /> : null}
                    {loadingMore ? 'Loading posts...' : 'Load More Posts'}
                  </button>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '24px 0 40px 0', fontWeight: 600 }}>
                  🎉 You have caught up with all community posts!
                </div>
              )}
            </>
          )}

        </div>

        {/* RIGHT COLUMN: TRENDING SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Statistics Card */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(229, 231, 235, 0.6)', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'var(--primary)' }} /> Community Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Citizens:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{activeCitizens}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Approved Feed Posts:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{stats.approvedPosts || posts.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>My Submissions:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{posts.filter(p => p.user?._id === user?.id).length}</span>
              </div>
            </div>
          </div>

          {/* Trending Topics Hashtags */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(229, 231, 235, 0.6)', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Trending Topics
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { tag: '#CleanKerala', count: '14 posts' },
                { tag: '#EnvironmentDay', count: '9 posts' },
                { tag: '#RoadPotholes', count: '6 posts' },
                { tag: '#BloodDrive', count: '5 posts' },
                { tag: '#LostDogHelp', count: '3 posts' },
                { tag: '#VolunteerKochi', count: '4 posts' }
              ].map((t) => (
                <div
                  key={t.tag}
                  style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1px solid #edf2f7',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSearch(t.tag)}
                >
                  <span style={{ color: 'var(--primary)' }}>{t.tag}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Posts Summary */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(229, 231, 235, 0.6)', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} /> Popular Posts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.slice(0, 2).map((p) => (
                <div key={p._id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img
                    src={getFullImageUrl(p.image)}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=100'; }}
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-dark)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{p.caption}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>👍 {p.likes} likes • 💬 {p.commentsCount} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Local Events Widget */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(229, 231, 235, 0.6)', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} /> Neighborhood Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '40px', height: '44px', borderRadius: '8px', padding: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>10</span>
                  <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700 }}>Aug</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>Blood Donation Drive</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Community Center, 09:00 AM</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ background: '#eff6ff', color: '#3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '40px', height: '44px', borderRadius: '8px', padding: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>15</span>
                  <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700 }}>Aug</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>Independence Day Flag Hoisting</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Panchayat Ground, 08:00 AM</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CREATE POST MODAL DIALOG */}
      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #edf2f7' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                {editingPost ? 'Edit Community Post' : 'Create Community Post'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePublishPost} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* User info row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user?.profilePicture ? (
                    <img
                      src={getFullImageUrl(user.profilePicture)}
                      alt={user.fullName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      {(user?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{user?.fullName}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Posting to GramConnect Community</span>
                  </div>
                </div>

                {/* Caption Input */}
                <textarea
                  placeholder="What would you like to share with your village community?"
                  value={caption}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCaption(val);
                    if (!val.trim()) setPostErrors(prev => ({ ...prev, caption: 'Caption is required.' }));
                    else setPostErrors(prev => ({ ...prev, caption: '' }));
                  }}
                  required
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    border: `1px solid ${postErrors.caption ? '#ef4444' : '#edf2f7'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    background: '#f8fafc',
                    fontFamily: 'inherit'
                  }}
                />
                {postErrors.caption && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '-8px', display: 'block' }}>{postErrors.caption}</span>}

                {/* Grid for Category, Location & Visibility */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Category Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      value={postCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostCategory(val);
                        if (!val) setPostErrors(prev => ({ ...prev, category: 'Category is required.' }));
                        else setPostErrors(prev => ({ ...prev, category: '' }));
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${postErrors.category ? '#ef4444' : '#edf2f7'}`,
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.filter(c => c !== 'All Posts' && c !== 'My Posts').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {postErrors.category && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '-2px', display: 'block' }}>{postErrors.category}</span>}
                  </div>

                  {/* Location (District dropdown) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      value={postLocation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostLocation(val);
                        if (!val) setPostErrors(prev => ({ ...prev, location: 'Location is required.' }));
                        else setPostErrors(prev => ({ ...prev, location: '' }));
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${postErrors.location ? '#ef4444' : '#edf2f7'}`,
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select District</option>
                      {KERALA_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {postErrors.location && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '-2px', display: 'block' }}>{postErrors.location}</span>}
                  </div>

                </div>

                {/* Upload Image Drag and Drop and File Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upload Image <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>(Optional — JPG, PNG, WEBP · max 5MB)</span></label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => validateAndSetFile(e.target.files[0])}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                  />

                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #edf2f7', background: '#f8fafc' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); validateAndSetFile(e.dataTransfer.files[0]); }}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{
                        width: '100%',
                        height: '140px',
                        border: postErrors.image ? '2px dashed #ef4444' : (isDragging ? '2px dashed var(--primary)' : '2px dashed #cbd5e1'),
                        borderRadius: '12px',
                        background: isDragging ? 'var(--primary-light)' : '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    >
                      <Upload size={28} style={{ color: isDragging ? 'var(--primary)' : 'var(--text-light)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                          Drag & drop image here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
                        </span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Supports JPG, PNG, WEBP up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  {postErrors.image && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '-2px', display: 'block' }}>{postErrors.image}</span>}
                </div>

                {/* Visibility Permission */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visibility</label>
                  <select
                    value={postVisibility}
                    onChange={(e) => setPostVisibility(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #edf2f7',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Public">Public (Anyone can view)</option>
                    <option value="Community Only">Community Only (Verified village members)</option>
                  </select>
                </div>

              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #edf2f7', background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    color: '#475569',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Publishing...' : editingPost ? 'Save Changes' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
