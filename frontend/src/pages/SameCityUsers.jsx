import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles.css';

function SameCityUsers({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSameCityUsers = async () => {
      try {
        const response = await api.get('/users/same-city');
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('获取同城用户失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSameCityUsers();
  }, []);

  const handleSendMessage = (userId) => {
    navigate(`/messages/${userId}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div style={{ padding: '50px', textAlign: 'center' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>📍 同城同好</h2>
      
      {users.length > 0 ? (
        <div className="users-grid">
          {users.map((item) => (
            <div key={item.id} className="user-card">
              <div 
                className="avatar" 
                style={{ width: '60px', height: '60px', fontSize: '24px', cursor: 'pointer' }}
                onClick={() => handleViewProfile(item.id)}
              >
                {item.avatar ? (
                  <img src={item.avatar} alt="" className="avatar" style={{ width: '60px', height: '60px' }} />
                ) : (
                  item.nickname?.charAt(0)
                )}
              </div>
              <div className="user-card-info">
                <h4 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewProfile(item.id)}
                >
                  {item.nickname}
                </h4>
                <p>📍 {item.city || '未知城市'}</p>
                <div className="user-artists">
                  <span style={{ fontWeight: '500', color: '#666' }}>关注艺人：</span>
                  {item.artists && item.artists.length > 0 ? (
                    item.artists.slice(0, 3).map((artist, index) => (
                      <span key={index} style={{ marginRight: '5px' }}>
                        {typeof artist === 'string' ? artist : artist.name}{index < Math.min(item.artists.length, 3) - 1 ? '、' : ''}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#aaa' }}>暂无</span>
                  )}
                  {item.artists && item.artists.length > 3 && (
                    <span style={{ color: '#888' }}> 等{item.artists.length}位</span>
                  )}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => handleSendMessage(item.id)}
                  >
                    💬 发私信
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>👥</div>
          <p>暂无同城用户</p>
        </div>
      )}
    </div>
  );
}

export default SameCityUsers;
