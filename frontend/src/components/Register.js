import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { register } from '../services/api';

const { Title, Text } = Typography;

const RegisterContainer = styled.div`
  min-height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  margin-top: -64px;
  padding: 20px;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Logo = styled.img`
  height: 64px;
  margin-bottom: 16px;
`;

const StyledButton = styled(Button)`
  width: 100%;
  height: 40px;
  font-size: 16px;
`;

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      console.log('Register form values:', values);
      
      // Đảm bảo password và confirmPassword khớp nhau
      if (values.password !== values.confirmPassword) {
        message.error('Mật khẩu nhập lại không khớp');
        setLoading(false);
        return;
      }
      
      // Gọi API đăng ký
      const response = await register({
        username: values.username,
        email: values.email,
        password: values.password
      });
      
      console.log('Register API response:', response);
      
      if (response.success && response.token) {
        // Lưu token và thông tin người dùng vào localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        message.success('Đăng ký thành công!');
        
        // Chuyển hướng sau khi đăng ký thành công
        navigate('/');
      } else {
        // Hiển thị thông báo lỗi nếu có
        message.error(response.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Register error:', error);
      
      // Hiển thị thông báo lỗi từ API nếu có
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <StyledCard>
        <LogoContainer>
          <Logo src="/logo.png" alt="Logo" />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Đăng ký tài khoản
          </Title>
          <Text type="secondary">
            Tham gia cộng đồng yêu thích lịch sử
          </Text>
        </LogoContainer>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên người dùng!' },
              { min: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Tên người dùng" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <StyledButton 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              Đăng ký
            </StyledButton>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Đã có tài khoản? </Text>
            <Button 
              type="link" 
              onClick={() => navigate('/login')}
              style={{ padding: 0 }}
            >
              Đăng nhập ngay
            </Button>
          </div>
        </Form>
      </StyledCard>
    </RegisterContainer>
  );
}

export default Register; 