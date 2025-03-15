import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Space, Tag, Avatar, Image, Divider, List, Row, Col, message, Spin, Button, Form, Input, Tooltip } from 'antd';
import { UserOutlined, ClockCircleOutlined, EnvironmentOutlined, BookOutlined, ArrowLeftOutlined, SendOutlined, LikeOutlined, LikeFilled, EyeOutlined } from '@ant-design/icons';
import { getPostDetail, getPostComments, addComment, incrementViewCount, toggleLike, checkLikeStatus } from '../services/api';

const { Title, Paragraph } = Typography;

// Tạo component Comment riêng
const CommentItem = ({ author, avatar, content, datetime }) => (
  <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
    <Avatar src={avatar} icon={<UserOutlined />} />
    <div style={{ marginLeft: 12, flex: 1 }}>
      <div>
        <span style={{ fontWeight: 'bold', marginRight: 8 }}>{author}</span>
        <span style={{ color: '#999' }}>{datetime}</span>
      </div>
      <div style={{ marginTop: 4 }}>{content}</div>
    </div>
  </div>
);

const VideoPlayer = ({ src }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleError = (e) => {
    setError('Không thể tải video');
    setIsLoading(false);
    console.error('Video error:', e);
  };

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#ff4d4f' }}>{error}</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          borderRadius: '8px'
        }}>
          <Spin />
        </div>
      )}
      <video
        controls
        preload="metadata"
        onLoadedData={handleLoadedData}
        onError={handleError}
        style={{ 
          width: '100%',
          maxHeight: 400,
          backgroundColor: '#000',
          borderRadius: '8px',
          display: isLoading ? 'none' : 'block'
        }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const isAuthenticated = localStorage.getItem('token');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const [postRes, commentsRes] = await Promise.all([
          getPostDetail(id),
          getPostComments(id)
        ]);

        if (!postRes.data.success) {
          throw new Error(postRes.data.message || 'Không thể tải thông tin bài viết');
        }

        setPost(postRes.data.post);
        setComments(commentsRes.data.comments || []);
        setLikeCount(postRes.data.post.like_count);
        setViewCount(postRes.data.post.view_count);

        // Tăng lượt xem
        await incrementViewCount(id);
        
        // Kiểm tra trạng thái like nếu đã đăng nhập
        if (isAuthenticated) {
          try {
            const likeStatus = await checkLikeStatus(id);
            setLiked(likeStatus.data.liked);
          } catch (error) {
            console.error('Error checking like status:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching post detail:', error);
        message.error('Không thể tải thông tin bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [id, isAuthenticated]);

  const handleSubmitComment = async (values) => {
    if (!isAuthenticated) {
      message.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      setSubmitting(true);
      const response = await addComment(id, values.content);
      
      // Thêm comment mới vào danh sách
      setComments([...comments, response.data.comment]);
      
      // Reset form
      form.resetFields();
      message.success('Đã thêm bình luận');
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      message.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      const response = await toggleLike(id);
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      message.error('Không thể thực hiện thao tác');
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!post) return <div>Không tìm thấy bài viết</div>;

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/forum')}
        style={{ 
          marginBottom: 16,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          padding: 0
        }}
      >
        Quay lại danh sách bài viết
      </Button>

      <Card loading={loading}>
        <Title level={2}>{post.title}</Title>
        
        {/* Thông tin tác giả và thời gian */}
        <Space wrap style={{ marginBottom: 24 }}>
          <Avatar src={post.avatar_url} icon={<UserOutlined />} />
          <span>{post.username}</span>
          <ClockCircleOutlined /> {new Date(post.created_at).toLocaleDateString()}
          {post.period && <Tag color="blue">{post.period}</Tag>}
          {post.historical_figure && <Tag color="green">{post.historical_figure}</Tag>}
          {post.location && (
            <Space>
              <EnvironmentOutlined />
              <span>{post.location}</span>
            </Space>
          )}
        </Space>

        {/* Thêm thông tin like và view */}
        <Space style={{ marginBottom: 16 }}>
          <Tooltip title={isAuthenticated ? (liked ? 'Bỏ thích' : 'Thích') : 'Đăng nhập để thích'}>
            <Button 
              type={liked ? 'primary' : 'default'}
              icon={liked ? <LikeFilled /> : <LikeOutlined />}
              onClick={handleLike}
            >
              {likeCount}
            </Button>
          </Tooltip>
          <Tooltip title="Lượt xem">
            <Space>
              <EyeOutlined />
              {viewCount}
            </Space>
          </Tooltip>
        </Space>

        <Row gutter={24}>
          {/* Cột bên trái cho nội dung */}
          <Col xs={24} md={(post.images?.length > 0 || post.video) ? 14 : 24}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Nội dung bài viết */}
              <Paragraph style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>
                {post.content}
              </Paragraph>

              {/* Nguồn tham khảo */}
              {post.source && (
                <Space>
                  <BookOutlined />
                  <span>Nguồn tham khảo: {post.source}</span>
                </Space>
              )}
            </Space>
          </Col>

          {/* Cột bên phải cho media */}
          {(post.images?.length > 0 || post.video) && (
            <Col xs={24} md={10}>
              <div style={{ 
                position: 'sticky', 
                top: 24,
                backgroundColor: '#fff',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {/* Hiển thị video trước nếu có */}
                {post.video && (
                  <div style={{ marginBottom: 16 }}>
                    <VideoPlayer src={post.video} />
                  </div>
                )}

                {/* Hiển thị ảnh */}
                {post.images && post.images.length > 0 && (
                  <div>
                    <Image.PreviewGroup>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {post.images.map((image, index) => (
                          <Image
                            key={index}
                            src={image}
                            alt={`Hình ${index + 1}`}
                            style={{ 
                              width: '100%',
                              maxHeight: 400,
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
              </div>
            </Col>
          )}
        </Row>

        <Divider />

        {/* Phần bình luận */}
        <div>
          <Title level={3}>Bình luận ({comments.length})</Title>
          
          {/* Form thêm bình luận */}
          {isAuthenticated && (
            <div style={{ marginBottom: 24 }}>
              <Form
                form={form}
                onFinish={handleSubmitComment}
                layout="vertical"
              >
                <Form.Item
                  name="content"
                  rules={[
                    { required: true, message: 'Vui lòng nhập nội dung bình luận' },
                    { max: 1000, message: 'Bình luận không được quá 1000 ký tự' }
                  ]}
                >
                  <Input.TextArea 
                    rows={4}
                    placeholder="Viết bình luận của bạn..."
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={submitting}
                  >
                    Gửi bình luận
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}

          {/* Danh sách bình luận */}
          <List
            itemLayout="vertical"
            dataSource={comments}
            locale={{
              emptyText: 'Chưa có bình luận nào'
            }}
            renderItem={comment => (
              <CommentItem
                key={comment.id}
                author={comment.username}
                avatar={comment.avatar_url}
                content={comment.content}
                datetime={new Date(comment.created_at).toLocaleString()}
              />
            )}
          />

          {/* Hiển thị thông báo đăng nhập nếu chưa đăng nhập */}
          {!isAuthenticated && (
            <div style={{ 
              textAlign: 'center', 
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
              marginTop: 16
            }}>
              <p>Vui lòng <Button type="link" onClick={() => navigate('/login')}>đăng nhập</Button> để bình luận</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default PostDetail; 