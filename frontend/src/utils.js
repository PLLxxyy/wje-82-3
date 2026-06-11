export function transformPost(post) {
  return {
    ...post,
    user: {
      id: post.user_id,
      nickname: post.user_nickname,
      avatar: post.user_avatar
    },
    concert: post.concert_id ? {
      id: post.concert_id,
      title: post.concert_title,
      artist: post.artist_name,
      date: post.concert_date,
      venue: post.venue,
      city: post.city
    } : null,
    likeCount: post.like_count,
    commentCount: post.comment_count,
    repostCount: post.repost_count,
    isLiked: !!post.liked,
    isReposted: !!post.reposted,
    createdAt: post.created_at,
    images: post.images ? post.images.map(img => img.image_url) : [],
    tags: post.tags ? post.tags.map(t => t.tag) : []
  };
}

export function transformComment(comment) {
  return {
    ...comment,
    user: {
      id: comment.user_id,
      nickname: comment.user_nickname,
      avatar: comment.user_avatar
    },
    createdAt: comment.created_at
  };
}

export function transformConversation(conv) {
  return {
    ...conv,
    otherUser: {
      id: conv.other_user_id,
      nickname: conv.other_nickname,
      avatar: conv.other_avatar
    },
    lastMessage: {
      createdAt: conv.last_message_time
    },
    unreadCount: conv.unread_count
  };
}

export function transformMessage(msg) {
  return {
    ...msg,
    senderId: msg.sender_id,
    receiverId: msg.receiver_id,
    createdAt: msg.created_at,
    senderNickname: msg.sender_nickname
  };
}

export function transformTicket(ticket) {
  return {
    ...ticket,
    seller: {
      id: ticket.seller_id,
      nickname: ticket.seller_nickname,
      avatar: ticket.seller_avatar
    },
    concert: {
      id: ticket.concert_id,
      title: ticket.concert_title,
      artist: ticket.artist_name,
      venue: ticket.venue,
      city: ticket.city,
      date: ticket.concert_date
    },
    originalPrice: ticket.original_price,
    seatInfo: ticket.seat_info,
    createdAt: ticket.created_at
  };
}

export function transformTicketMessage(msg) {
  return {
    ...msg,
    user: {
      id: msg.user_id,
      nickname: msg.user_nickname,
      avatar: msg.user_avatar
    },
    isConfirm: !!msg.is_confirm,
    createdAt: msg.created_at
  };
}

export function transformUserProfile(data) {
  return {
    user: data.user,
    concerts: data.concerts.map(c => ({
      ...c,
      artistName: c.artist_name,
      concertDate: c.concert_date
    })),
    posts: data.posts.map(transformPost)
  };
}

export function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export function formatConcertDate(dateString) {
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    month: date.getMonth() + 1 + '月',
    year: date.getFullYear(),
    full: date.toLocaleDateString('zh-CN')
  };
}
