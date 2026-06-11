import { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';
import ComposePost from '../components/ComposePost';
import { transformPost } from '../utils';
import '../styles.css';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feed');
      setPosts(res.data.map(transformPost));
    } catch (error) {
      console.error('获取动态列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPostData) => {
    fetchFeed();
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: res.data.liked, likeCount: res.data.likeCount }
          : p
      ));
    } catch (error) {
      console.error('点赞操作失败:', error);
      fetchFeed();
    }
  };

  const handleRepost = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/repost`);
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isReposted: res.data.reposted, repostCount: res.data.repostCount }
          : p
      ));
    } catch (error) {
      console.error('转发操作失败:', error);
      fetchFeed();
    }
  };

  const handleComment = (postId) => {
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, commentCount: (p.commentCount || 0) + 1 }
        : p
    ));
  };

  return (
    <div className="main-content">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>首页动态</h2>

      <ComposePost onPostCreated={handlePostCreated} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
          <div>加载中...</div>
        </div>
      ) : (
        <div>
          {posts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>📝</div>
              <h3 style={{ marginBottom: '10px' }}>暂无动态</h3>
              <p>快来发布第一条动态吧！</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onRepost={handleRepost}
                onComment={handleComment}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
