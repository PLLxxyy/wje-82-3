import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { transformConversation } from '../utils';
import '../styles.css';

function Messages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages');
      setConversations(res.data.map(transformConversation));
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (userId) => {
    navigate(`/messages/${userId}`);
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <div className="main-content">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>私信</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
          <div>加载中...</div>
        </div>
      ) : (
        <div className="messages-layout">
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>💬</div>
                <h3 style={{ marginBottom: '10px' }}>暂无消息</h3>
                <p>去和其他粉丝聊聊吧！</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.otherUser.id}
                  className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => handleConversationClick(conv.otherUser.id)}
                >
                  <div className="avatar">
                    {conv.otherUser.avatar ? (
                      <img src={conv.otherUser.avatar} alt="" className="avatar" />
                    ) : (
                      conv.otherUser.nickname?.charAt(0)
                    )}
                  </div>
                  <div className="conversation-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>{conv.otherUser.nickname}</h4>
                      <span className="conversation-time">{formatTime(conv.lastMessage?.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="conversation-preview">{conv.lastMessage?.content || '暂无消息'}</span>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-area" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
            <div style={{ textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>👈</div>
              <h3>选择一个会话开始聊天</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
