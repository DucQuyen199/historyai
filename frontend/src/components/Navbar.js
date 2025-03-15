import React, { useState } from 'react';
import { Menu, Dropdown, Button, Modal, Typography, Avatar } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  HomeOutlined, 
  GlobalOutlined, 
  SearchOutlined, 
  RobotOutlined, 
  MenuOutlined,
  TeamOutlined,
  HistoryOutlined,
  DownOutlined,
  BookOutlined,
  CloseOutlined,
  CrownOutlined,
  StarOutlined,
  CalendarOutlined,
  UserOutlined,
  FieldTimeOutlined,
  VideoCameraOutlined,
  CommentOutlined,
  PictureOutlined,
  FileImageOutlined,
  FileOutlined,
  MessageOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { message } from 'antd';

const { Paragraph } = Typography;

const NavbarWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: linear-gradient(90deg, #1a237e 0%, #283593 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(90deg, #283593 0%, #3949ab 100%);
  }
`;

const NavContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.5px;
    background: linear-gradient(120deg, #fff, #e3f2fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavMenu = styled(Menu)`
  background: transparent !important;
  border: none !important;
  flex: 1;
  display: flex;
  justify-content: center;

  .ant-menu-item, .ant-menu-submenu {
    height: 64px;
    line-height: 64px;
    padding: 0 20px;
    margin: 0 4px;
    color: rgba(255, 255, 255, 0.85);
    transition: all 0.3s ease;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    &::after {
      display: none;
    }
  }

  .ant-menu-submenu-title {
    transition: all 0.3s ease;
  }

  .ant-menu-item-selected, .ant-menu-submenu-selected {
    background: rgba(255, 255, 255, 0.2) !important;
    color: #fff !important;
  }

  .anticon {
    margin-right: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    display: none;
  }

  .ant-menu-submenu-popup {
    top: 64px !important;
  }
`;

const MobileButton = styled(Button)`
  display: none;
  color: white !important;
  font-size: 20px;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Sidebar = styled.aside`
  position: fixed;
  top: 0;
  left: ${props => props.isOpen ? '0' : '-280px'};
  width: 280px;
  height: 100vh;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  z-index: 1001;
  overflow-y: auto;
`;

const SidebarMenu = styled(Menu)`
  padding: 80px 0 20px;

  .ant-menu-item {
    margin: 4px 12px;
    padding: 0 12px;
    border-radius: 6px;

    &:hover {
      color: #1a237e;
      background: rgba(26, 35, 126, 0.1);
    }
  }

  .ant-menu-submenu-title {
    margin: 4px 12px;
    padding: 0 12px;
    border-radius: 6px;
  }

  .ant-menu-item-selected {
    background: #1a237e !important;
    color: #fff !important;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  z-index: 1000;
`;

const StyledDropdown = styled.div`
  .ant-dropdown {
    animation: dropdownAnimation 0.3s ease;
    margin-top: 4px;
  }

  .ant-dropdown-menu {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    padding: 8px;
    min-width: 220px;
  }

  .ant-dropdown-menu-item {
    padding: 12px 16px;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0;

    &:hover {
      background: rgba(26, 35, 126, 0.1);
      color: #1a237e;
      transform: translateX(5px);
    }

    .anticon {
      font-size: 18px;
      color: #1a237e;
    }

    a {
      color: inherit;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
  }

  @keyframes dropdownAnimation {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const heroesData = [
  {
    name: "Hùng Vương",
    hometown: "Phú Thọ",
    era: "Hồng Bàng",
    nation: "Văn Lang",
    capital: "Phong Châu"
  },
  {
    name: "Hai Bà Trưng",
    hometown: "Hà Nội",
    era: "Hai Bà Trưng",
    nation: "Lĩnh Nam",
    capital: "Mê Linh"
  },
  {
    name: "Lý Nam Đế",
    hometown: "Thái Nguyên",
    era: "Nhà Tiền Lý",
    nation: "Vạn Xuân",
    capital: "Long Uyên"
  },
  {
    name: "Ngô Quyền",
    hometown: "Hà Nội",
    era: "Nhà Ngô",
    nation: "Tĩnh Hải quân",
    capital: "Cổ Loa"
  },
  // ... thêm các anh hùng khác
];

function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const historyMenu = (
    <Menu>
      <Menu.Item key="/dynasties">
        <Link to="/dynasties">
          <CrownOutlined />
          <span>Các triều đại và vua chúa</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/generals">
        <Link to="/generals">
          <StarOutlined />
          <span>Các tướng lĩnh</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/figures/scholars">
        <Link to="/figures/scholars">
          <BookOutlined />
          <span>Các nhà khoa bảng</span>
        </Link>
      </Menu.Item>
      <Menu.Item key="/battles">
        <Link to="/battles">
          <StarOutlined />
          <span>Các trận đánh tiêu biểu</span>
        </Link>
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: (
        <Dropdown 
          overlay={historyMenu} 
          trigger={['click']}
          placement="bottomCenter"
        >
          <span>Lịch sử <DownOutlined style={{ fontSize: '12px' }} /></span>
        </Dropdown>
      ),
    },
    {
      key: '/resources',
      icon: <PictureOutlined />,
      label: <Link to="/resources">Tư liệu</Link>,
    },
    {
      key: '/forum',
      icon: <CommentOutlined />,
      label: <Link to="/forum">Diễn đàn</Link>,
    },
    {
      key: '/videos',
      icon: <VideoCameraOutlined />,
      label: <Link to="/videos">Video lịch sử</Link>,
    },
    {
      key: '/chat',
      icon: <RobotOutlined />,
      label: <Link to="/chat">Hỏi đáp AI</Link>,
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: <Link to="/search">Tìm kiếm</Link>,
    },
  ];

  const sidebarItems = [
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'Lịch sử',
      children: [
        {
          key: '/dynasties',
          icon: <CrownOutlined />,
          label: <Link to="/dynasties">Các triều đại và vua chúa</Link>,
        },
        {
          key: '/generals',
          icon: <StarOutlined />,
          label: <Link to="/generals">Các tướng lĩnh</Link>,
        },
        {
          key: '/figures/scholars',
          icon: <BookOutlined />,
          label: <Link to="/figures/scholars">Các nhà khoa bảng</Link>,
        },
        {
          key: '/battles',
          icon: <StarOutlined />,
          label: <Link to="/battles">Các trận đánh tiêu biểu</Link>,
        },
      ],
    },
    {
      key: '/resources',
      icon: <PictureOutlined />,
      label: <Link to="/resources">Tư liệu</Link>,
    },
    {
      key: '/forum',
      icon: <CommentOutlined />,
      label: <Link to="/forum">Diễn đàn</Link>,
    },
    {
      key: '/videos',
      icon: <VideoCameraOutlined />,
      label: <Link to="/videos">Video lịch sử</Link>,
    },
    {
      key: '/chat',
      icon: <RobotOutlined />,
      label: <Link to="/chat">Hỏi đáp AI</Link>,
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: <Link to="/search">Tìm kiếm</Link>,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Đăng xuất thành công');
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/profile')}>
        <UserOutlined /> Trang cá nhân
      </Menu.Item>
      <Menu.Item key="settings" onClick={() => navigate('/settings')}>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <StyledDropdown>
      <NavbarWrapper>
        <NavContainer>
          <Logo to="/">
            <BookOutlined className="logo-icon" />
            <span className="logo-text">Lịch Sử</span>
          </Logo>

          <NavMenu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            expandIcon={<DownOutlined style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }} />}
          />

          <MobileButton
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setIsOpen(true)}
          />

          <div style={{ marginLeft: 'auto' }}>
            {isAuthenticated ? (
              <Dropdown overlay={userMenu} trigger={['click']}>
                <div style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={user?.avatar_url}
                    icon={<UserOutlined />}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ color: '#fff' }}>{user?.username}</span>
                </div>
              </Dropdown>
            ) : (
              <Button type="primary" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            )}
          </div>
        </NavContainer>
      </NavbarWrapper>

      <Sidebar isOpen={isOpen}>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            fontSize: 20
          }}
        />
        <SidebarMenu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['history']}
          items={sidebarItems}
        />
      </Sidebar>

      <Overlay isOpen={isOpen} onClick={() => setIsOpen(false)} />

      <Modal
        title="Thông Báo"
        open={showComingSoon}
        onCancel={() => setShowComingSoon(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowComingSoon(false)}>
            Đã hiểu
          </Button>
        ]}
      >
        <div className="coming-soon">
          <img 
            src="/images/coming-soon.png" 
            alt="Coming Soon"
            style={{ width: '100%', maxWidth: 300, margin: '20px auto', display: 'block' }}
          />
          <Paragraph style={{ textAlign: 'center', fontSize: '16px' }}>
            Tính năng đang được phát triển. Vui lòng quay lại sau!
          </Paragraph>
        </div>
      </Modal>
    </StyledDropdown>
  );
}

export default Navbar; 