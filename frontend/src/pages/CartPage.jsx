import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Popconfirm, message, Card, Typography, Space, Image, Empty } from 'antd';
import { DeleteOutlined, ArrowRightOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { formatCurrencyVND } from '../utils/formatters';

const { Title, Text } = Typography;

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/cart');
      setCartItems(response.data.cartItems || []);
      setTotal(response.data.grandTotal || 0);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        message.warning('Vui lòng đăng nhập để xem giỏ hàng');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (id) => {
    try {
      await axiosClient.delete(`/cart/remove/${id}`);
      message.success('Đã xóa sản phẩm');
      fetchCart();
    } catch (e) {
      message.error(`Lỗi xóa: ${e.response?.data?.message || 'Lỗi server'}`);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/100x100?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'ProductName',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Image
            width={60}
            height={60}
            src={getImageUrl(record.Image)}
            style={{ borderRadius: 6, objectFit: 'cover' }}
            fallback="https://placehold.co/100x100?text=Error"
          />
          <div>
            <Text strong>{text}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'Price',
      key: 'price',
      render: (price) => formatCurrencyVND(price),
      responsive: ['md'],
    },
    {
      title: 'Số lượng',
      dataIndex: 'Quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Thành tiền',
      key: 'total',
      align: 'right',
      render: (_, record) => (
        <Text type="danger" strong>
          {formatCurrencyVND(record.TotalLine)}
        </Text>
      ),
    },
    {
      title: 'Xóa',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Bạn chắc chắn muốn xóa món này?"
          onConfirm={() => handleRemove(record.CartItemId)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '30px 20px', minHeight: '100vh' }}>
      <Card className="soft-card" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <ShoppingCartOutlined style={{ fontSize: 24, color: '#ee4d2d' }} />
          <Title level={3} style={{ margin: 0, color: '#333' }}>
            Giỏ hàng của bạn
          </Title>
        </div>

        <Table
          dataSource={cartItems}
          columns={columns}
          rowKey="CartItemId"
          pagination={false}
          loading={loading}
          locale={{ emptyText: <Empty description="Giỏ hàng trống. Đi mua sắm nào!" /> }}
        />

        {cartItems.length > 0 && (
          <div
            style={{
              marginTop: 30,
              textAlign: 'right',
              borderTop: '1px solid #f0f0f0',
              paddingTop: 20,
            }}
          >
            <div style={{ marginBottom: 15 }}>
              <Text type="secondary" style={{ marginRight: 10 }}>
                Tổng thanh toán ({cartItems.length} sản phẩm):
              </Text>
              <Title level={2} style={{ color: '#ee4d2d', margin: 0, display: 'inline-block' }}>
                {formatCurrencyVND(total)}
              </Title>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/checkout')}
              style={{
                background: '#ee4d2d',
                borderColor: '#ee4d2d',
                height: 50,
                fontSize: 18,
                padding: '0 40px',
              }}
            >
              Mua hàng
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CartPage;
