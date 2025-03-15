import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Avatar, Spin } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { updateProfile } from '../services/api';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
`;

function ProfileEdit() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    form.setFieldsValue({
      username: parsedUser.username,
      email: parsedUser.email,
      bio: parsedUser.bio
    });
  }, [form, navigate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      if (avatar) {
        formData.append('avatar', avatar);
      }

      const response = await updateProfile(formData);

      if (response.data.success) {
        // Cập nhật thông tin user trong localStorage
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        message.success('Cập nhật thông tin thành công');
        navigate('/profile');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error(error.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ chấp nhận file hình ảnh!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước hình ảnh phải nhỏ hơn 2MB!');
      return false;
    }
    setAvatar(file);
    return false;
  };

  return (
    <Container>
      <Card title="Chỉnh sửa thông tin">
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={100}
                src={avatar ? URL.createObjectURL(avatar) : user?.avatar_url}
                icon={<UserOutlined />}
              />
              <Upload
                beforeUpload={beforeUpload}
                showUploadList={false}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  style={{ marginTop: 16 }}
                >
                  Thay đổi ảnh đại diện
                </Button>
              </Upload>
            </div>

            <Form.Item
              label="Tên người dùng"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Giới thiệu"
              name="bio"
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Lưu thay đổi
              </Button>
              <Button 
                style={{ marginLeft: 8 }} 
                onClick={() => navigate('/profile')}
              >
                Hủy
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </Container>
  );
}

export default ProfileEdit; 