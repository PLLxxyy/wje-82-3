import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles.css';

function CreateTicket({ user }) {
  const [concerts, setConcerts] = useState([]);
  const [formData, setFormData] = useState({
    concertId: '',
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    seatInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [concertsLoading, setConcertsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      setConcertsLoading(true);
      const res = await api.get('/concerts');
      setConcerts(res.data || []);
    } catch (error) {
      console.error('获取演唱会列表失败:', error);
    } finally {
      setConcertsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.concertId || !formData.title || !formData.price || !formData.originalPrice) {
      alert('请填写必要信息');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/tickets', {
        concertId: parseInt(formData.concertId),
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice),
        seatInfo: formData.seatInfo
      });
      
      navigate(`/tickets/${res.data.ticketId}`);
    } catch (error) {
      console.error('发布转票失败:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
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

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/tickets')}
        >
          ← 返回
        </button>
        <h2 style={{ color: '#333', margin: 0 }}>发布转票</h2>
      </div>

      <div className="auth-container" style={{ maxWidth: '600px', marginTop: '20px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>选择演唱会 *</label>
            {concertsLoading ? (
              <div style={{ padding: '12px 16px', color: '#888' }}>加载中...</div>
            ) : (
              <select
                name="concertId"
                value={formData.concertId}
                onChange={handleChange}
                required
              >
                <option value="">请选择演唱会</option>
                {concerts.map((concert) => (
                  <option key={concert.id} value={concert.id}>
                    {concert.title} - {concert.artist_name} ({formatDate(concert.concert_date)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label>标题 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：周杰伦演唱会内场票"
              required
            />
          </div>

          <div className="form-group">
            <label>描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="描述票的详情，如为什么转让、入场方式等"
              rows="4"
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>转让价格 (元) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="例如：800"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>原价 (元) *</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                placeholder="例如：1000"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>座位信息</label>
            <input
              type="text"
              name="seatInfo"
              value={formData.seatInfo}
              onChange={handleChange}
              placeholder="例如：A区 12排 25座"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? '发布中...' : '发布转票'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;
