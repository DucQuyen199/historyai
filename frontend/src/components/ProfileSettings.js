import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, Divider, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { updateUserSettings, changePassword } from '../services/api';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
`;

function ProfileSettings() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSettingsSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await updateUserSettings(values);
      if (response.data.success) {
        message.success('Cập nhật cài đặt thành công');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Không thể cập nhật cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setLoading(true);
      const response = await changePassword(values);
      if (response.data.success) {
        message.success('Đổi mật khẩu thành công');
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('Error changing password:', error);
      message.error('Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card title="Cài đặt tài khoản">
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSettingsSubmit}
          >
            <Form.Item
              label="Nhận thông báo qua email"
              name="email_notifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Hiển thị email công khai"
              name="public_email"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Lưu cài đặt
              </Button>
            </Form.Item>
          </Form>

          <Divider>Đổi mật khẩu</Divider>

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              label="Mật khẩu hiện tại"
              name="current_password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="new_password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>

          <Button 
            style={{ marginTop: 16 }} 
            onClick={() => navigate('/profile')}
          >
            Quay lại
          </Button>
        </Spin>
      </Card>
    </Container>
  );
}

export default ProfileSettings; 