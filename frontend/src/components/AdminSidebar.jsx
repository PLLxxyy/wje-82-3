import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-sidebar">
      <div style={{ padding: '20px 25px', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
        🎛️ 管理后台
      </div>
      <nav>
        <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'active' : ''}>
          📊 数据统计
        </Link>
        <Link to="/admin/posts" className={isActive('/admin/posts') ? 'active' : ''}>
          📝 动态审核
        </Link>
        <Link to="/admin/tickets" className={isActive('/admin/tickets') ? 'active' : ''}>
          🎫 票务管理
        </Link>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} style={{ marginTop: '30px' }}>
          🚪 退出登录
        </a>
      </nav>
    </div>
  );
}

export default AdminSidebar;
