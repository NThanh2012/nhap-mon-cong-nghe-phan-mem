import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, message, Dropdown, Space, Typography } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  HistoryOutlined,
  LoginOutlined,
  DashboardOutlined,
  AppstoreAddOutlined,
  RollbackOutlined,
} from '@ant-design/icons';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminProductPage from './pages/AdminProductPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminReturnsPage from './pages/AdminReturnsPage';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const isLoggedIn = Boolean(token);
  const isAdmin = userRole === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    message.success('Đã đăng xuất!');
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    ...(isAdmin
      ? [
          {
            key: 'admin_dashboard',
            label: <Link to="/admin/dashboard">Bảng điều khiển</Link>,
            icon: <DashboardOutlined />,
          },
          {
            key: 'admin_products',
            label: <Link to="/admin/products">Quản lý sản phẩm</Link>,
            icon: <AppstoreAddOutlined />,
          },
          {
            key: 'admin_orders',
            label: <Link to="/admin/orders">Quản lý đơn hàng</Link>,
            icon: <ShoppingCartOutlined />,
          },
          {
            key: 'admin_returns',
            label: <Link to="/admin/returns">Quản lý trả hàng</Link>,
            icon: <RollbackOutlined />,
          },
          { type: 'divider' },
        ]
      : []),
    {
      key: 'orders',
      label: <Link to="/my-orders">Đơn hàng của tôi</Link>,
      icon: <HistoryOutlined />,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">Trang chủ</Link> },
    { key: '/cart', icon: <ShoppingCartOutlined />, label: <Link to="/cart">Giỏ hàng</Link> },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-header__left">
          <div className="app-header__brand" onClick={() => navigate('/')}>
            shopfree
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="app-menu"
          />
        </div>

        <div>
          {isLoggedIn ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" size="large" icon={<UserOutlined />}>
                <Space>
                  Tài khoản
                  {isAdmin && (
                    <Text type="danger" style={{ fontSize: 10 }}>
                      (Quản trị)
                    </Text>
                  )}
                </Space>
              </Button>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button type="primary" icon={<LoginOutlined />}>
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </Header>

      <Content className="app-content">
        <div className="page-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProductPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/returns" element={<AdminReturnsPage />} />
          </Routes>
        </div>
      </Content>

      <Footer className="app-footer">shopfree ©2026</Footer>
    </Layout>
  );
}

export default App;
