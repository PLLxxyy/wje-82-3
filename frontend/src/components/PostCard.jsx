import { useState, useEffect } from 'react';
import api from '../api';
import { transformComment, formatTime } from '../utils';
import '../styles.css';

function PostCard({ post, onLike, onRepost, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      const allComments = res.data.map(transformComment);
      const topLevel = allComments.filter(c => !c.parent_id);
      const withReplies = topLevel.map(c => ({
        ...c,
        replies: allComments.filter(r => r.parent_id === c.id)
      }));
      setComments(withReplies);
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      fetchComments();
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post(`/posts/${post.id}/comments`, {
        content: commentText
      });
      setComments([...comments, transformComment(res.data)]);
      setCommentText('');
      if (onComment) onComment(post.id);
    } catch (error) {
      console.error('发布评论失败:', error);
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const res = await api.post(`/posts/${post.id}/comments`, {
        content: replyText,
        parentId: commentId
      });
      const newReply = transformComment(res.data);
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      ));
      setReplyTo(null);
      setReplyText('');
      if (onComment) onComment(post.id);
    } catch (error) {
      console.error('回复评论失败:', error);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img
          src={post.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.nickname || 'U')}&background=667eea&color=fff`}
          alt={post.user?.nickname}
          className="avatar"
        />
        <div className="post-user-info">
          <div className="post-nickname">{post.user?.nickname || '匿名用户'}</div>
          <div className="post-time">{formatTime(post.createdAt)}</div>
        </div>
      </div>

      <div className="post-content">{post.content}</div>

      {post.concert && (
        <div className="post-concert">
          <strong>🎤 {post.concert.artist}</strong>
          <div>{post.concert.title}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {new Date(post.concert.date).toLocaleDateString('zh-CN')}
          </div>
        </div>
      )}

      {post.images && post.images.length > 0 && (
        <div className="post-images">
          {post.images.map((img, idx) => (
            <img key={idx} src={img} alt="" className="post-image" />
          ))}
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, idx) => (
            <span key={idx} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      <div className="post-actions">
        <div
          className={`post-action ${post.isLiked ? 'liked' : ''}`}
          onClick={() => onLike && onLike(post.id)}
        >
          <span>{post.isLiked ? '❤️' : '🤍'}</span>
          <span>{post.likeCount || 0}</span>
        </div>
        <div className="post-action" onClick={toggleComments}>
          <span>💬</span>
          <span>{post.commentCount || 0}</span>
        </div>
        <div
          className={`post-action ${post.isReposted ? 'reposted' : ''}`}
          onClick={() => onRepost && onRepost(post.id)}
        >
          <span>🔄</span>
          <span>{post.repostCount || 0}</span>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <form className="comment-input" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              placeholder="写下你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              发送
            </button>
          </form>

          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.id}>
                <div className="comment-item">
                  <img
                    src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.nickname || 'U')}&background=667eea&color=fff`}
                    alt={comment.user?.nickname}
                    className="avatar"
                    style={{ width: '32px', height: '32px' }}
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.user?.nickname}</span>
                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                    </div>
                    <div className="comment-text">{comment.content}</div>
                    <span
                      className="reply-link"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      回复
                    </span>
                  </div>
                </div>

                {replyTo === comment.id && (
                  <form
                    className="comment-input"
                    style={{ marginLeft: '46px', marginTop: '10px' }}
                    onSubmit={(e) => handleReplySubmit(e, comment.id)}
                  >
                    <input
                      type="text"
                      placeholder={`回复 ${comment.user?.nickname}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      回复
                    </button>
                  </form>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="replies">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="comment-item">
                        <img
                          src={reply.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.nickname || 'U')}&background=667eea&color=fff`}
                          alt={reply.user?.nickname}
                          className="avatar"
                          style={{ width: '28px', height: '28px' }}
                        />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{reply.user?.nickname}</span>
                            <span className="comment-time">{formatTime(reply.createdAt)}</span>
                          </div>
                          <div className="comment-text">{reply.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                暂无评论，快来抢沙发吧！
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;
