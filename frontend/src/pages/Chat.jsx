import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { transformMessage } from '../utils';
import '../styles.css';

function Chat({ user }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data.messages ? res.data.messages.map(transformMessage) : []);
      setOtherUser(res.data.otherUser);
    } catch (error) {
      console.error('获取消息历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const res = await api.post(`/messages/${userId}`, { content: inputValue.trim() });
      setMessages([...messages, transformMessage(res.data)]);
      setInputValue('');
    } catch (error) {
      console.error('发送消息失败:', error);
      fetchMessages();
    }
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="main-content">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>聊天</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
          <div>加载中...</div>
        </div>
      ) : (
        <div className="messages-layout">
          <div className="conversations-list">
            <div
              className="conversation-item active"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/messages')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>←</span>
                <span>返回会话列表</span>
              </div>
            </div>
          </div>

          <div className="chat-area">
            <div className="chat-header">
              <div className="avatar">
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} alt="" className="avatar" />
                ) : (
                  otherUser?.nickname?.charAt(0)
                )}
              </div>
              <div>
                <h4>{otherUser?.nickname}</h4>
                <p style={{ fontSize: '12px', color: '#888' }}>{otherUser?.city || '未知城市'}</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>💬</div>
                  <h3 style={{ marginBottom: '10px' }}>暂无消息</h3>
                  <p>发送第一条消息吧！</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message-item ${msg.senderId === user.id ? 'sent' : ''}`}
                  >
                    <div>
                      <div className="message-content">
                        {msg.content}
                      </div>
                      <div className="message-time">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="输入消息..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">发送</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
