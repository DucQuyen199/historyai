import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { login } from '../services/api';

const { Title, Text } = Typography;

const LoginContainer = styled.div`
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

const GoogleButton = styled(Button)`
  width: 100%;
  height: 40px;
  font-size: 16px;
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  margin-top: 16px;

  &:hover {
    background: #f5f5f5;
    border-color: #ddd;
  }
`;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  React.useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate(from);
    }
  }, [navigate, from]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('Login values:', values);
      const response = await login(values);
      console.log('Login response:', response);
      
      if (response.success && response.token) {
        // Lưu token và thông tin người dùng vào localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        message.success('Đăng nhập thành công!');
        navigate('/'); // Chuyển đến trang chủ sau khi đăng nhập
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <StyledCard>
        <LogoContainer>
          <Logo src="/logo.png" alt="Logo" />
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Đăng nhập
          </Title>
          <Text type="secondary">
            Đăng nhập để tham gia thảo luận về lịch sử
          </Text>
        </LogoContainer>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <StyledButton 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              Đăng nhập
            </StyledButton>
          </Form.Item>

          <Divider>Hoặc</Divider>

          <GoogleButton icon={<GoogleOutlined />}>
            Đăng nhập với Google
          </GoogleButton>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Text type="secondary">Chưa có tài khoản? </Text>
            <Button 
              type="link" 
              onClick={() => navigate('/register')}
              style={{ padding: 0 }}
            >
              Đăng ký ngay
            </Button>
          </div>
        </Form>
      </StyledCard>
    </LoginContainer>
  );
}

export default Login; 