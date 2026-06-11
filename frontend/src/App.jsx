import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import SelectArtists from './pages/SelectArtists.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import Messages from './pages/Messages.jsx';
import Chat from './pages/Chat.jsx';
import SameCityUsers from './pages/SameCityUsers.jsx';
import Tickets from './pages/Tickets.jsx';
import TicketDetail from './pages/TicketDetail.jsx';
import CreateTicket from './pages/CreateTicket.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminPosts from './pages/AdminPosts.jsx';
import AdminTickets from './pages/AdminTickets.jsx';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">🎤 演唱会粉丝社区</div>
      {user && (
        <ul className="navbar-nav">
          <li><Link to="/" className={isActive('/') ? 'active' : ''}>首页</Link></li>
          <li><Link to="/tickets" className={isActive('/tickets') ? 'active' : ''}>二手票</Link></li>
          <li><Link to="/same-city" className={isActive('/same-city') ? 'active' : ''}>同城同好</Link></li>
          <li><Link to="/messages" className={isActive('/messages') ? 'active' : ''}>私信</Link></li>
        </ul>
      )}
      <div className="navbar-user">
        {user ? (
          <>
            <div 
              className="avatar" 
              onClick={() => navigate(`/user/${user.id}`)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="avatar" />
              ) : (
                user.nickname?.charAt(0)
              )}
            </div>
            <button className="btn btn-outline btn-sm" onClick={onLogout}>退出</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">登录</Link>
            <Link to="/register" className="btn btn-outline btn-sm">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {!window.location.pathname.startsWith('/admin') && (
          <Navbar user={user} onLogout={handleLogout} />
        )}
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="/select-artists" element={
            <ProtectedRoute user={user}>
              <SelectArtists user={user} />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute user={user}>
              <Home user={user} />
            </ProtectedRoute>
          } />
          <Route path="/user/:id" element={
            <ProtectedRoute user={user}>
              <Profile currentUser={user} />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute user={user}>
              <Messages user={user} />
            </ProtectedRoute>
          } />
          <Route path="/messages/:userId" element={
            <ProtectedRoute user={user}>
              <Chat user={user} />
            </ProtectedRoute>
          } />
          <Route path="/same-city" element={
            <ProtectedRoute user={user}>
              <SameCityUsers user={user} />
            </ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute user={user}>
              <Tickets user={user} />
            </ProtectedRoute>
          } />
          <Route path="/tickets/create" element={
            <ProtectedRoute user={user}>
              <CreateTicket user={user} />
            </ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute user={user}>
              <TicketDetail user={user} />
            </ProtectedRoute>
          } />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/posts" element={<AdminPosts />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
