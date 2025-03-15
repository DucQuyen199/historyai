import React, { useState, useEffect } from 'react';
import { List, Space, Avatar, Tag, Button, message, Tooltip, Card, Paragraph, Image } from 'antd';
import { UserOutlined, LikeOutlined, LikeFilled, MessageOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, toggleLike, checkLikeStatus } from '../services/api';

function PostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeStates, setLikeStates] = useState({});
  const isAuthenticated = localStorage.getItem('token');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      setPosts(response.data.posts);

      // Nếu đã đăng nhập, kiểm tra trạng thái like của từng bài viết
      if (isAuthenticated) {
        const likePromises = response.data.posts.map(post =>
          checkLikeStatus(post.id)
            .then(res => ({ id: post.id, liked: res.data.liked }))
            .catch(() => ({ id: post.id, liked: false }))
        );
        
        const likeResults = await Promise.all(likePromises);
        const newLikeStates = {};
        likeResults.forEach(result => {
          newLikeStates[result.id] = result.liked;
        });
        setLikeStates(newLikeStates);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      message.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      message.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      const response = await toggleLike(postId);
      
      // Cập nhật trạng thái like và số lượt like
      setLikeStates(prev => ({
        ...prev,
        [postId]: response.data.liked
      }));
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            like_count: response.data.likeCount
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      message.error('Không thể thực hiện thao tác');
    }
  };

  return (
    <List
      itemLayout="vertical"
      size="large"
      loading={loading}
      dataSource={posts}
      renderItem={post => (
        <Card 
          hoverable
          style={{ marginBottom: 16 }}
        >
          <List.Item
            key={post.id}
            actions={[
              <Tooltip title={isAuthenticated ? (likeStates[post.id] ? 'Bỏ thích' : 'Thích') : 'Đăng nhập để thích'}>
                <Button 
                  type={likeStates[post.id] ? 'primary' : 'text'}
                  icon={likeStates[post.id] ? <LikeFilled /> : <LikeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                >
                  {post.like_count}
                </Button>
              </Tooltip>,
              <Tooltip title="Xem bình luận">
                <Button
                  type="text"
                  icon={<CommentOutlined />}
                  onClick={() => navigate(`/forum/posts/${post.id}`)}
                >
                  {post.comment_count} bình luận
                </Button>
              </Tooltip>,
              <Space>
                <EyeOutlined />
                {post.view_count} lượt xem
              </Space>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={post.avatar_url} icon={<UserOutlined />} />}
              title={
                <Link to={`/forum/posts/${post.id}`}>
                  {post.title}
                </Link>
              }
              description={
                <Space size={[0, 8]} wrap>
                  <span>{post.username}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  {post.period && <Tag color="blue">{post.period}</Tag>}
                  {post.historical_figure && <Tag color="green">{post.historical_figure}</Tag>}
                </Space>
              }
            />
            <div style={{ marginTop: 16 }}>
              <Paragraph
                ellipsis={{ rows: 3, expandable: false }}
                style={{ marginBottom: 16 }}
              >
                {post.content}
              </Paragraph>
              
              {/* Preview ảnh/video */}
              {(post.images?.length > 0 || post.video) && (
                <div style={{ marginTop: 16 }}>
                  {post.video && (
                    <video 
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: 200,
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                      src={post.video}
                      preload="metadata"
                    />
                  )}
                  {post.images && post.images.length > 0 && (
                    <Space wrap>
                      {post.images.slice(0, 2).map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          style={{
                            width: 150,
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 8
                          }}
                          preview={false}
                        />
                      ))}
                      {post.images.length > 2 && (
                        <div 
                          style={{
                            width: 150,
                            height: 150,
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}
                        >
                          +{post.images.length - 2} ảnh
                        </div>
                      )}
                    </Space>
                  )}
                </div>
              )}

              <Button 
                type="link" 
                onClick={() => navigate(`/forum/posts/${post.id}`)}
                style={{ padding: 0, marginTop: 16 }}
              >
                Xem chi tiết
              </Button>
            </div>
          </List.Item>
        </Card>
      )}
    />
  );
}

export default PostList; 