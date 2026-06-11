import React, { useState, useEffect } from 'react';
import api from '../api.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { adminTicketStatusTabs, getTicketStatusLabel, getTicketStatusBadgeClass, TicketStatus } from '../utils';

function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(TicketStatus.AVAILABLE);
  const [removeModal, setRemoveModal] = useState({ visible: false, ticketId: null });
  const [removeReason, setRemoveReason] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [status]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/tickets?status=${status}`);
      setTickets(res.data);
    } catch (err) {
      console.error('获取票务列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeReason.trim()) {
      alert('请输入移除原因');
      return;
    }
    try {
      await api.post(`/admin/tickets/${removeModal.ticketId}/remove`, { reason: removeReason });
      setRemoveModal({ visible: false, ticketId: null });
      setRemoveReason('');
      fetchTickets();
    } catch (err) {
      console.error('移除票务失败:', err);
    }
  };

  const openRemoveModal = (ticketId) => {
    setRemoveModal({ visible: true, ticketId });
    setRemoveReason('');
  };

  const getStatusBadge = (s) => {
    return <span className={getTicketStatusBadgeClass(s)}>{getTicketStatusLabel(s, true)}</span>;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h2 style={{ marginBottom: '20px' }}>🎫 票务管理</h2>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {adminTicketStatusTabs.map((tab) => (
            <button
              key={tab.key}
              className={`btn ${status === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🎫</div>
            <p>暂无{adminTicketStatusTabs.find((t) => t.key === status)?.label}的票务</p>
          </div>
        ) : (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>演出标题</th>
                  <th>价格</th>
                  <th>发布者</th>
                  <th>发布时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{ticket.concert_title}</div>
                      {ticket.concert_date && (
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                          {new Date(ticket.concert_date).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>¥{ticket.price}</span>
                      {ticket.original_price && ticket.original_price > ticket.price && (
                        <span style={{ fontSize: '12px', color: '#888', textDecoration: 'line-through', marginLeft: '8px' }}>
                          ¥{ticket.original_price}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                          {ticket.seller_nickname?.charAt(0)}
                        </div>
                        <span>{ticket.seller_nickname}</span>
                      </div>
                    </td>
                    <td>{new Date(ticket.created_at).toLocaleString('zh-CN')}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>
                      {status === TicketStatus.AVAILABLE && (
                        <div className="admin-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => openRemoveModal(ticket.id)}
                          >
                            移除
                          </button>
                        </div>
                      )}
                      {ticket.remove_reason && status === TicketStatus.REMOVED && (
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          原因：{ticket.remove_reason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {removeModal.visible && (
          <div className="modal-overlay" onClick={() => setRemoveModal({ visible: false, ticketId: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>移除票务</h3>
                <button className="modal-close" onClick={() => setRemoveModal({ visible: false, ticketId: null })}>
                  ×
                </button>
              </div>
              <div className="form-group">
                <label>移除原因</label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="请输入移除原因"
                  rows={4}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setRemoveModal({ visible: false, ticketId: null })}
                >
                  取消
                </button>
                <button className="btn btn-danger" onClick={handleRemove}>
                  确认移除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTickets;
