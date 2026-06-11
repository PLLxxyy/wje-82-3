import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { transformUserProfile } from '../utils';
import '../styles.css';

function Profile({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = currentUser && currentUser.id === parseInt(id);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        const transformedData = transformUserProfile(response.data);
        setUser(transformedData.user);
        setConcerts(transformedData.concerts || []);
        setPosts(transformedData.posts || []);
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      month: (date.getMonth() + 1).toString().padStart(2, '0'),
      day: date.getDate().toString().padStart(2, '0'),
      year: date.getFullYear()
    };
  };

  if (loading) {
    return (
      <div className="main-content">
        <div style={{ padding: '50px', textAlign: 'center' }}>加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>❓</div>
          <p>用户不存在</p>
        </div>
      </div>
    );
  }

  const sortedConcerts = [...concerts].sort((a, b) => new Date(b.concert_date) - new Date(a.concert_date));

  return (
    <div className="main-content">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="profile-avatar" />
          ) : (
            user.nickname?.charAt(0)
          )}
        </div>
        <div className="profile-info">
          <h2>{user.nickname}</h2>
          <p>📍 {user.city || '未设置城市'}</p>
          <p>{user.bio || '这个人很懒，什么都没写'}</p>
        </div>
        {isOwnProfile && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/edit-profile')}>
              编辑资料
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/add-concert')}>
              添加演唱会记录
            </button>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>🎵 追过的演唱会</h3>
        {sortedConcerts.length > 0 ? (
          <div className="concert-list">
            {sortedConcerts.map((concert) => {
              const date = formatDate(concert.concert_date);
              return (
                <div key={concert.id} className="concert-item">
                  <div className="concert-date">
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{date.day}</div>
                    <div style={{ fontSize: '12px' }}>{date.month}月</div>
                    <div style={{ fontSize: '10px', opacity: '0.8' }}>{date.year}</div>
                  </div>
                  <div className="concert-details">
                    <h4>{concert.title}</h4>
                    <p style={{ color: '#e74c3c', fontWeight: '500', marginBottom: '5px' }}>{concert.artistName}</p>
                    <p>🏟️ {concert.venue}</p>
                    <p>📍 {concert.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>🎫</div>
            <p>还没有演唱会记录</p>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>📝 发布的动态</h3>
        {posts.length > 0 ? (
          <div>
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="avatar" onClick={() => navigate(`/user/${post.user?.id}`)}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="avatar" />
                    ) : (
                      user.nickname?.charAt(0)
                    )}
                  </div>
                  <div className="post-user-info">
                    <div className="post-nickname">{user.nickname}</div>
                    <div className="post-time">{new Date(post.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
                {post.concert && (
                  <div className="post-concert">
                    <strong>{post.concert.title}</strong>
                    <div style={{ fontSize: '13px', marginTop: '5px' }}>
                      📅 {new Date(post.concert.date).toLocaleDateString('zh-CN')} · 📍 {post.concert.city}
                    </div>
                  </div>
                )}
                <div className="post-content">{post.content}</div>
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="post-tag">#{tag}</span>
                    ))}
                  </div>
                )}
                {post.images && post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.map((image, index) => (
                      <img key={index} src={image} alt="" className="post-image" />
                    ))}
                  </div>
                )}
                <div className="post-actions">
                  <div className={`post-action ${post.isLiked ? 'liked' : ''}`}>
                    <span>❤️</span>
                    <span>{post.likeCount || 0}</span>
                  </div>
                  <div className="post-action">
                    <span>💬</span>
                    <span>{post.commentCount || 0}</span>
                  </div>
                  <div className={`post-action ${post.isReposted ? 'reposted' : ''}`}>
                    <span>🔄</span>
                    <span>{post.repostCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>📝</div>
            <p>还没有发布动态</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
