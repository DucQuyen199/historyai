import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tabs, List, Button, Typography, Tag, message, Empty, Spin } from 'antd';
import { UserOutlined, EditOutlined, SettingOutlined, LikeOutlined, CommentOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { getUserPosts, getUserComments } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  margin-top: -60px;
`;

const ProfileHeader = styled(Card)`
  margin-bottom: 24px;
  .ant-card-body {
    display: flex;
    align-items: center;
    gap: 24px;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const StyledAvatar = styled(Avatar)`
  width: 100px;
  height: 100px;
`;

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchUserContent();
  }, [navigate]);

  const fetchUserContent = async () => {
    try {
      setLoading(true);
      const [postsRes, commentsRes] = await Promise.all([
        getUserPosts(),
        getUserComments()
      ]);

      setPosts(postsRes.data.posts || []);
      setComments(commentsRes.data.comments || []);
    } catch (error) {
      console.error('Error fetching user content:', error);
      message.error('Không thể tải nội dung người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Đăng xuất thành công');
    navigate('/login');
  };

  return (
    <ProfileContainer>
      <ProfileHeader>
        <StyledAvatar 
          src={user?.avatar_url} 
          icon={<UserOutlined />} 
        />
        <UserInfo>
          <Title level={3}>{user?.username}</Title>
          <Text type="secondary">{user?.email}</Text>
          <div style={{ marginTop: 16 }}>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              style={{ marginRight: 8 }}
              onClick={() => navigate('/profile/edit')}
            >
              Chỉnh sửa thông tin
            </Button>
            <Button 
              icon={<SettingOutlined />}
              style={{ marginRight: 8 }}
              onClick={() => navigate('/profile/settings')}
            >
              Cài đặt tài khoản
            </Button>
            <Button type="primary" danger onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </UserInfo>
      </ProfileHeader>

      <Card>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'posts',
              label: 'Bài viết của tôi',
              children: (
                <Spin spinning={loading}>
                  <List
                    itemLayout="vertical"
                    pagination={{ 
                      pageSize: 5,
                      hideOnSinglePage: true
                    }}
                    dataSource={posts}
                    locale={{
                      emptyText: <Empty description="Bạn chưa có bài viết nào" />
                    }}
                    renderItem={post => (
                      <List.Item
                        actions={[
                          <span><EyeOutlined /> {post.view_count} lượt xem</span>,
                          <span><LikeOutlined /> {post.like_count} lượt thích</span>,
                          <span><CommentOutlined /> {post.comment_count} bình luận</span>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Link to={`/forum/post/${post.id}`}>{post.title}</Link>}
                          description={
                            <div>
                              <Text type="secondary">
                                {new Date(post.created_at).toLocaleDateString()}
                              </Text>
                              {post.period && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  {post.period}
                                </Tag>
                              )}
                              {post.historical_figure && (
                                <Tag color="green" style={{ marginLeft: 8 }}>
                                  {post.historical_figure}
                                </Tag>
                              )}
                              {post.location && (
                                <Tag color="orange" style={{ marginLeft: 8 }}>
                                  {post.location}
                                </Tag>
                              )}
                            </div>
                          }
                        />
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {post.content}
                        </Paragraph>
                      </List.Item>
                    )}
                  />
                </Spin>
              )
            },
            {
              key: 'comments',
              label: 'Bình luận của tôi',
              children: (
                <Spin spinning={loading}>
                  <List
                    itemLayout="vertical"
                    pagination={{ 
                      pageSize: 5,
                      hideOnSinglePage: true
                    }}
                    dataSource={comments}
                    locale={{
                      emptyText: <Empty description="Bạn chưa có bình luận nào" />
                    }}
                    renderItem={comment => (
                      <List.Item>
                        <List.Item.Meta
                          title={<Link to={`/forum/post/${comment.post_id}`}>{comment.post_title}</Link>}
                          description={
                            <Text type="secondary">
                              Bình luận lúc: {new Date(comment.created_at).toLocaleString()}
                            </Text>
                          }
                        />
                        <Paragraph>{comment.content}</Paragraph>
                      </List.Item>
                    )}
                  />
                </Spin>
              )
            }
          ]}
        />
      </Card>
    </ProfileContainer>
  );
}

export default UserProfile; 