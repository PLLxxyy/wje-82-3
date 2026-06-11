import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { transformTicket, transformTicketMessage } from '../utils';
import '../styles.css';

function TicketDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      setTicket(transformTicket(res.data.ticket));
      setMessages((res.data.messages || []).map(transformTicketMessage));
    } catch (error) {
      console.error('获取票详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      setSending(true);
      await api.post(`/tickets/${id}/messages`, {
        content: inputValue.trim(),
        isConfirm: false
      });
      setInputValue('');
      fetchTicketDetail();
    } catch (error) {
      console.error('发送留言失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setSending(true);
      await api.post(`/tickets/${id}/messages`, {
        content: '确认要这张票',
        isConfirm: true
      });
      fetchTicketDetail();
    } catch (error) {
      console.error('确认要票失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleMarkSold = async () => {
    if (!window.confirm('确定要标记这张票为已转让吗？')) return;

    try {
      setMarkingSold(true);
      await api.post(`/tickets/${id}/mark-sold`);
      fetchTicketDetail();
    } catch (error) {
      console.error('标记已转失败:', error);
    } finally {
      setMarkingSold(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwner = ticket && user && ticket.seller?.id === user.id;

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/tickets')}
        >
          ← 返回列表
        </button>
        <h2 style={{ color: '#333', margin: 0 }}>票详情</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎫</div>
          <div>加载中...</div>
        </div>
      ) : ticket ? (
        <div>
          <div className="ticket-detail">
            <div className="ticket-header" style={{ borderRadius: '10px', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '10px' }}>{ticket.concert?.title || ticket.title}</h2>
              <div style={{ fontSize: '16px', opacity: 0.95 }}>{ticket.concert?.artist || ticket.artist}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>演出时间</div>
                <div style={{ fontWeight: '500' }}>{formatDate(ticket.concert?.date || ticket.date)}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>演出地点</div>
                <div style={{ fontWeight: '500' }}>{ticket.concert?.city || ticket.city} {ticket.concert?.venue || ticket.venue}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>座位信息</div>
                <div style={{ fontWeight: '500' }}>{ticket.seatInfo || '暂无'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '10px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>转让价格</div>
                <div className="ticket-price">¥{ticket.price}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>原价</div>
                <div className="ticket-original-price">¥{ticket.originalPrice}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className={`status-badge ${ticket.status === 'available' ? 'status-available' : 'status-sold'}`}>
                  {ticket.status === 'available' ? '可转让' : '已转让'}
                </span>
              </div>
            </div>

            {ticket.description && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '5px' }}>票描述</div>
                <div style={{ lineHeight: '1.6' }}>{ticket.description}</div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar">
                  {ticket.seller?.avatar ? (
                    <img src={ticket.seller.avatar} alt="" className="avatar" />
                  ) : (
                    ticket.seller?.nickname?.charAt(0)
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>{ticket.seller?.nickname}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>发布者</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {isOwner ? (
                  ticket.status === 'available' && (
                    <button
                      className="btn btn-success"
                      onClick={handleMarkSold}
                      disabled={markingSold}
                    >
                      {markingSold ? '处理中...' : '标记已转'}
                    </button>
                  )
                ) : (
                  ticket.status === 'available' && (
                    <button
                      className="btn btn-success"
                      onClick={handleConfirm}
                      disabled={sending}
                    >
                      {sending ? '处理中...' : '确认要'}
                    </button>
                  )
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/messages/${ticket.seller?.id}`)}
                >
                  私信卖家
                </button>
              </div>
            </div>
          </div>

          <div className="ticket-messages">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>留言区 ({messages.length})</h3>

            <form className="comment-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="输入留言..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? '发送中...' : '发送'}
              </button>
            </form>

            <div className="comment-list">
              {messages.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>💬</div>
                  <h4 style={{ marginBottom: '5px' }}>暂无留言</h4>
                  <p style={{ fontSize: '13px' }}>快来发表第一条留言吧！</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ticket-message-item ${msg.isConfirm ? 'confirm' : ''}`}
                  >
                    <div className="avatar" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                      {msg.user?.avatar ? (
                        <img src={msg.user.avatar} alt="" className="avatar" />
                      ) : (
                        msg.user?.nickname?.charAt(0)
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="comment-header">
                        <span className="comment-author">
                          {msg.user?.nickname}
                          {msg.isConfirm && (
                            <span style={{ background: '#27ae60', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', marginLeft: '8px' }}>
                              确认要
                            </span>
                          )}
                        </span>
                        <span className="comment-time">{formatDate(msg.createdAt)}</span>
                      </div>
                      <div className="comment-text">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>❓</div>
          <h3>票不存在</h3>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
