import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, List, Space, Tag, Avatar, message, Tooltip } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LikeOutlined, 
  MessageOutlined, 
  EyeOutlined,
  HistoryOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LikeFilled 
} from '@ant-design/icons';
import { getPosts, toggleLike, checkLikeStatus } from '../services/api';

const { Title, Paragraph } = Typography;

function Forum() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token'); // Kiểm tra token đăng nhập
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likeStates, setLikeStates] = useState({});

  useEffect(() => {
    fetchPosts();

    // Thêm event listener cho việc focus lại tab
    const handleFocus = () => {
      fetchPosts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await getPosts();
      setPosts(response.data.posts);

      // Kiểm tra trạng thái like nếu đã đăng nhập
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
      message.error('Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để đăng bài viết');
      navigate('/login', { state: { from: '/forum/create' } });
    } else {
      navigate('/forum/create');
    }
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      message.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      const response = await toggleLike(postId);
      
      // Cập nhật trạng thái like và số lượt like
      setLikeStates(prev => ({
        ...prev,
        [postId]: response.liked
      }));
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            like_count: response.likeCount
          };
        }
        return post;
      }));

      message.success(response.liked ? 'Đã thích bài viết' : 'Đã bỏ thích bài viết');
    } catch (error) {
      console.error('Error toggling like:', error);
      message.error('Không thể thực hiện thao tác');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', marginTop: -60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>Diễn đàn Lịch sử</Title>
          <Paragraph>
            Nơi chia sẻ kiến thức và thảo luận về lịch sử Việt Nam
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<HistoryOutlined />}
          onClick={handleCreatePost}
        >
          Đăng bài viết
        </Button>
      </div>

      <List
        loading={loading}
        itemLayout="vertical"
        size="large"
        pagination={{
          pageSize: 10,
        }}
        dataSource={posts}
        renderItem={(item) => (
          <Card hoverable style={{ marginBottom: 16 }}>
            <List.Item
              key={item.id}
              actions={[
                <Tooltip title={isAuthenticated ? (likeStates[item.id] ? 'Bỏ thích' : 'Thích') : 'Đăng nhập để thích'}>
                  <Button
                    type={likeStates[item.id] ? 'primary' : 'text'}
                    icon={likeStates[item.id] ? <LikeFilled /> : <LikeOutlined />}
                    onClick={(e) => handleLike(item.id, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.like_count}
                  </Button>
                </Tooltip>,
                <Space>
                  <MessageOutlined />
                  <span>{item.comment_count}</span>
                </Space>,
                <Space>
                  <EyeOutlined />
                  <span>{item.view_count}</span>
                </Space>
              ]}
              extra={
                item.images && item.images.length > 0 && (
                  <img
                    width={272}
                    alt="post image"
                    src={item.images[0]}
                  />
                )
              }
            >
              <List.Item.Meta
                avatar={<Avatar src={item.avatar_url} />}
                title={
                  <Link to={`/forum/post/${item.id}`}>
                    {item.title}
                  </Link>
                }
                description={
                  <Space direction="vertical">
                    <Space>
                      <UserOutlined /> {item.username}
                      <ClockCircleOutlined /> {new Date(item.created_at).toLocaleDateString()}
                    </Space>
                    {item.period && <Tag color="blue">{item.period}</Tag>}
                    {item.historical_figure && <Tag color="green">{item.historical_figure}</Tag>}
                    {item.location && <Tag color="orange">{item.location}</Tag>}
                  </Space>
                }
              />
              <Typography.Paragraph ellipsis={{ rows: 3 }}>
                {item.content}
              </Typography.Paragraph>
              {item.video && (
                <video 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                  src={item.video}
                />
              )}
            </List.Item>
          </Card>
        )}
      />
    </div>
  );
}

export default Forum; 