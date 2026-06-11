import React, { useState, useEffect } from 'react';
import api from '../api.js';
import AdminSidebar from '../components/AdminSidebar.jsx';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxCount = () => {
    if (!stats?.dailyStats) return 1;
    return Math.max(...stats.dailyStats.map((d) => d.count), 1);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h2 style={{ marginBottom: '20px' }}>📊 数据统计</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>总用户数</h3>
                <div className="stat-value">{stats?.totalUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>总动态数</h3>
                <div className="stat-value">{stats?.totalPosts || 0}</div>
              </div>
              <div className="stat-card">
                <h3>总票务数</h3>
                <div className="stat-value">{stats?.totalTickets || 0}</div>
              </div>
              <div className="stat-card">
                <h3>今日发帖数</h3>
                <div className="stat-value">{stats?.todayPosts || 0}</div>
              </div>
              <div className="stat-card">
                <h3>活跃用户数</h3>
                <div className="stat-value">{stats?.activeUsers || 0}</div>
              </div>
            </div>

            <div className="daily-stats-chart">
              <h3 style={{ marginBottom: '10px' }}>近30天每日发帖量</h3>
              <div className="chart-bars">
                {stats?.dailyStats?.map((day, index) => (
                  <div
                    key={index}
                    className="chart-bar"
                    style={{ height: `${(day.count / getMaxCount()) * 100}%` }}
                    data-count={day.count}
                  />
                ))}
              </div>
              <div className="chart-labels">
                {stats?.dailyStats?.map((day, index) => (
                  <div key={index} className="chart-label">
                    {day.date.slice(5)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
