import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

function SelectArtists() {
  const [artists, setArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await api.get('/artists');
        setArtists(res.data);
      } catch (err) {
        setError('获取艺人列表失败，请刷新重试');
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const toggleArtist = (artistId) => {
    setSelectedArtists((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const handleSave = async () => {
    if (selectedArtists.length === 0) {
      setError('请至少选择一位艺人');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await api.post('/user/artists', { artistIds: selectedArtists });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div className="main-content">
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>选择你关注的艺人</h2>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '20px' }}>
        选择你感兴趣的艺人，我们将为你推荐相关内容
      </p>
      {error && <div style={{ color: '#e74c3c', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
      <div className="artists-grid">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className={`artist-card ${selectedArtists.includes(artist.id) ? 'selected' : ''}`}
            onClick={() => toggleArtist(artist.id)}
          >
            <div className="artist-avatar">
              {artist.avatar ? (
                <img src={artist.avatar} alt="" className="artist-avatar" />
              ) : (
                artist.name.charAt(0)
              )}
            </div>
            <div className="artist-name">{artist.name}</div>
            <div className="artist-genre">{artist.genre}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: '150px' }}
        >
          {saving ? '保存中...' : `保存 (${selectedArtists.length} 位)`}
        </button>
      </div>
    </div>
  );
}

export default SelectArtists;
