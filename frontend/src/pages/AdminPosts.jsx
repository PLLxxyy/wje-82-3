import React, { useState, useEffect } from 'react';
import api from '../api.js';
import AdminSidebar from '../components/AdminSidebar.jsx';

const statusTabs = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
];

function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState({ visible: false, postId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [status]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/posts?status=${status}`);
      setPosts(res.data);
    } catch (err) {
      console.error('获取动态列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await api.post(`/admin/posts/${postId}/approve`);
      fetchPosts();
    } catch (err) {
      console.error('审核通过失败:', err);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }
    try {
      await api.post(`/admin/posts/${rejectModal.postId}/reject`, { reason: rejectReason });
      setRejectModal({ visible: false, postId: null });
      setRejectReason('');
      fetchPosts();
    } catch (err) {
      console.error('审核拒绝失败:', err);
    }
  };

  const openRejectModal = (postId) => {
    setRejectModal({ visible: true, postId });
    setRejectReason('');
  };

  const getStatusBadge = (s) => {
    const statusMap = {
      pending: { text: '待审核' },
      approved: { text: '已通过' },
      rejected: { text: '已拒绝' },
    };
    const info = statusMap[s] || statusMap.pending;
    return <span className={`status-badge status-${s}`}>{info.text}</span>;
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleString('zh-CN');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h2 style={{ marginBottom: '20px' }}>📝 动态审核</h2>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {statusTabs.map((tab) => (
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
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>📭</div>
            <p>暂无{statusTabs.find((t) => t.key === status)?.label}的动态</p>
          </div>
        ) : (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>演出</th>
                  <th>内容</th>
                  <th>发布时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar">
                          {post.user_nickname?.charAt(0)}
                        </div>
                        <span>{post.user_nickname}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '150px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                      }}>
                        {post.concert_title}
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {post.content}
                      </div>
                    </td>
                    <td>{formatTime(post.created_at)}</td>
                    <td>{getStatusBadge(post.status)}</td>
                    <td>
                      {status === 'pending' && (
                        <div className="admin-actions">
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(post.id)}>
                            通过
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => openRejectModal(post.id)}>
                            拒绝
                          </button>
                        </div>
                      )}
                      {post.reject_reason && status === 'rejected' && (
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          原因：{post.reject_reason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rejectModal.visible && (
          <div className="modal-overlay" onClick={() => setRejectModal({ visible: false, postId: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>拒绝动态</h3>
                <button className="modal-close" onClick={() => setRejectModal({ visible: false, postId: null })}>
                  ×
                </button>
              </div>
              <div className="form-group">
                <label>拒绝原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入拒绝原因"
                  rows={4}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setRejectModal({ visible: false, postId: null })}
                >
                  取消
                </button>
                <button className="btn btn-danger" onClick={handleReject}>
                  确认拒绝
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPosts;
