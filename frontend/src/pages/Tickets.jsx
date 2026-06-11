import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { transformTicket, getTicketStatusLabel, getTicketStatusBadgeClass } from '../utils';
import '../styles.css';

function Tickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [artists, setArtists] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, [selectedArtist, selectedCity]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedArtist) params.append('artist', selectedArtist);
      if (selectedCity) params.append('city', selectedCity);
      
      const res = await api.get(`/tickets${params.toString() ? `?${params.toString()}` : ''}`);
      setTickets((res.data.tickets || []).map(transformTicket));
      setArtists(res.data.artists || []);
      setCities(res.data.cities || []);
    } catch (error) {
      console.error('获取票列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleCreateClick = () => {
    navigate('/tickets/create');
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

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#333' }}>二手票</h2>
        <button className="btn btn-primary" onClick={handleCreateClick}>
          + 发布转票
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
          <label>按艺人筛选</label>
          <select
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
          >
            <option value="">全部艺人</option>
            {artists.map((artist) => (
              <option key={artist} value={artist}>{artist}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
          <label>按城市筛选</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">全部城市</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎫</div>
          <div>加载中...</div>
        </div>
      ) : (
        <div>
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🎫</div>
              <h3 style={{ marginBottom: '10px' }}>暂无可转让的票</h3>
              <p>快来发布第一张转票吧！</p>
            </div>
          ) : (
            <div className="tickets-grid">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="ticket-card"
                  onClick={() => handleCardClick(ticket.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ticket-header">
                    <h3>{ticket.concert?.title || ticket.title}</h3>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>{ticket.concert?.artist || ticket.artist}</div>
                  </div>
                  <div className="ticket-info">
                    <div className="ticket-info-row">
                      <span style={{ color: '#888' }}>时间</span>
                      <span>{formatDate(ticket.concert?.date || ticket.date)}</span>
                    </div>
                    <div className="ticket-info-row">
                      <span style={{ color: '#888' }}>地点</span>
                      <span>{ticket.concert?.city || ticket.city} {ticket.concert?.venue || ticket.venue}</span>
                    </div>
                    <div className="ticket-info-row">
                      <span style={{ color: '#888' }}>座位</span>
                      <span>{ticket.seatInfo || '暂无'}</span>
                    </div>
                    <div className="ticket-info-row" style={{ alignItems: 'baseline', marginTop: '10px' }}>
                      <span className="ticket-price">¥{ticket.price}</span>
                      <span className="ticket-original-price">¥{ticket.originalPrice}</span>
                    </div>
                  </div>
                  <div className="ticket-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                        {ticket.seller?.avatar ? (
                          <img src={ticket.seller.avatar} alt="" className="avatar" />
                        ) : (
                          ticket.seller?.nickname?.charAt(0)
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: '#666' }}>{ticket.seller?.nickname}</span>
                    </div>
                    <span className={getTicketStatusBadgeClass(ticket.status)}>
                      {getTicketStatusLabel(ticket.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Tickets;
