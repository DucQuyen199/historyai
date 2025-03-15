import React, { useState, useContext } from 'react';
import { Form, Input, Select, Button, Upload, Space, App, message } from 'antd';
import { UploadOutlined, VideoCameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/api';

const { TextArea } = Input;

function CreatePost() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Kiểm tra token khi component mount
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/forum/create' } });
    }
  }, [navigate]);

  // Xử lý upload ảnh
  const imageUploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ có thể tải lên file ảnh!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Ảnh phải nhỏ hơn 5MB!');
        return false;
      }
      return false; // Return false để tự xử lý upload
    },
    maxCount: 5,
    multiple: true,
    listType: 'picture',
  };

  // Xử lý upload video
  const videoUploadProps = {
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error('Chỉ có thể tải lên file video!');
        return false;
      }
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('Video phải nhỏ hơn 100MB!');
        return false;
      }
      return false;
    },
    maxCount: 1,
    listType: 'picture',
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // Log để debug
      console.log('Form values:', values);
      
      // Thêm các trường thông tin cơ bản
      formData.append('title', values.title);
      formData.append('content', values.content);
      formData.append('category', values.category || 'general');
      formData.append('period', values.period);
      formData.append('historical_figure', values.historical_figure || '');
      formData.append('location', values.location || '');
      formData.append('source', values.source || '');

      // Thêm files
      if (values.images?.fileList) {
        values.images.fileList.forEach(file => {
          formData.append('images', file.originFileObj);
        });
      }

      if (values.video?.fileList?.[0]) {
        formData.append('video', values.video.fileList[0].originFileObj);
      }

      const response = await createPost(formData);
      console.log('Create post response:', response);

      if (response.data.success) {
        messageApi.success({
          content: 'Đăng bài viết thành công! Đang chuyển hướng...',
          duration: 3
        });

        setTimeout(() => {
          navigate('/forum');
        }, 3000);
      }
    } catch (error) {
      console.error('Create post error:', error);
      messageApi.error({
        content: error.response?.data?.message || 'Có lỗi xảy ra khi đăng bài',
        duration: 3
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <App>
      {contextHolder}
      <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto', marginTop: -60 }}>
        <h2>Đăng bài viết mới</h2>
        <Form 
          form={form}
          layout="vertical" 
          onFinish={onFinish}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề bài viết" />
          </Form.Item>

          <Form.Item
            name="period"
            label="Thời kỳ lịch sử"
            rules={[{ required: true, message: 'Vui lòng chọn thời kỳ' }]}
          >
            <Select placeholder="Chọn thời kỳ">
              <Select.Option value="thoi-ky-do-da">Thời kỳ đồ đá</Select.Option>
              <Select.Option value="van-lang-au-lac">Văn Lang - Âu Lạc</Select.Option>
              <Select.Option value="bac-thuoc">Bắc thuộc</Select.Option>
              <Select.Option value="doc-lap">Độc lập</Select.Option>
              <Select.Option value="can-dai">Cận đại</Select.Option>
              <Select.Option value="hien-dai">Hiện đại</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <TextArea rows={6} placeholder="Nhập nội dung bài viết" />
          </Form.Item>

          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Form.Item
              name="images"
              label="Hình ảnh minh họa"
              extra="Hỗ trợ tối đa 5 ảnh, mỗi ảnh dưới 5MB"
            >
              <Upload {...imageUploadProps}>
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="video"
              label="Video"
              extra="Hỗ trợ 1 video dưới 100MB"
            >
              <Upload {...videoUploadProps}>
                <Button icon={<VideoCameraOutlined />}>Chọn video</Button>
              </Upload>
            </Form.Item>
          </Space>

          <Form.Item
            name="historical_figure"
            label="Nhân vật lịch sử liên quan"
          >
            <Input placeholder="Nhập tên nhân vật lịch sử" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Địa điểm lịch sử"
          >
            <Input placeholder="Nhập địa điểm" />
          </Form.Item>

          <Form.Item
            name="source"
            label="Nguồn tham khảo"
          >
            <Input placeholder="Nhập nguồn tham khảo" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={submitting}
            >
              Đăng bài
            </Button>
          </Form.Item>
        </Form>
      </div>
    </App>
  );
}

export default CreatePost; 