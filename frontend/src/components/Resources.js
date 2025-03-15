import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { PictureOutlined, FileOutlined, GlobalOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function Resources() {
  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>Tư liệu lịch sử</Title>
      <Paragraph>
        Kho tư liệu, hình ảnh và tài liệu lịch sử Việt Nam qua các thời kỳ
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            cover={
              <div style={{ padding: 24, textAlign: 'center' }}>
                <PictureOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </div>
            }
          >
            <Card.Meta
              title="Hình ảnh lịch sử"
              description="Bộ sưu tập hình ảnh quý về các sự kiện, nhân vật và di tích lịch sử"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            cover={
              <div style={{ padding: 24, textAlign: 'center' }}>
                <GlobalOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </div>
            }
          >
            <Card.Meta
              title="Bản đồ lịch sử"
              description="Các bản đồ lịch sử qua các thời kỳ và bản đồ di tích"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            cover={
              <div style={{ padding: 24, textAlign: 'center' }}>
                <FileOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </div>
            }
          >
            <Card.Meta
              title="Tài liệu - Tư liệu"
              description="Tư liệu, văn bản và tài liệu lịch sử quan trọng"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Resources; 