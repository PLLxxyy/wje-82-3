import { useState, useEffect } from 'react';
import api from '../api';
import '../styles.css';

function ComposePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      const res = await api.get('/concerts');
      setConcerts(res.data);
    } catch (error) {
      console.error('获取演唱会列表失败:', error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...imageFiles, ...files];
    const newPreviews = [...images];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === newFiles.length) {
          setImages(newPreviews);
          setImageFiles(newFiles);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '');
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (selectedConcert) {
        formData.append('concertId', selectedConcert);
      }
      
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      imageFiles.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const res = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setContent('');
      setImages([]);
      setImageFiles([]);
      setSelectedConcert('');
      setTags([]);
      setTagInput('');

      if (onPostCreated) {
        onPostCreated(res.data);
      }
    } catch (error) {
      console.error('发布动态失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="compose-post">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="分享你的演唱会故事..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {images.length > 0 && (
          <div className="image-preview">
            {images.map((img, idx) => (
              <div key={idx} className="preview-item">
                <img src={img} alt="" />
                <button
                  type="button"
                  className="remove-preview"
                  onClick={() => removeImage(idx)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label>选择演唱会</label>
          <select
            value={selectedConcert}
            onChange={(e) => setSelectedConcert(e.target.value)}
          >
            <option value="">不关联演唱会</option>
            {concerts.map((concert) => (
              <option key={concert.id} value={concert.id}>
                {concert.artist_name} - {concert.title} ({new Date(concert.concert_date).toLocaleDateString('zh-CN')})
              </option>
            ))}
          </select>
        </div>

        <div className="tag-input">
          {tags.map((tag, idx) => (
            <span key={idx} className="tag-item">
              #{tag}
              <button type="button" onClick={() => removeTag(idx)}>
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="添加标签（回车确认）"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '6px 12px',
              border: '2px solid #e0e0e0',
              borderRadius: '15px',
              fontSize: '14px',
            }}
          />
        </div>

        <div className="compose-footer">
          <div className="compose-actions">
            <label className="icon-btn" title="上传图片">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '20px' }}>📷</span>
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
          >
            {isSubmitting ? '发布中...' : '发布动态'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ComposePost;
