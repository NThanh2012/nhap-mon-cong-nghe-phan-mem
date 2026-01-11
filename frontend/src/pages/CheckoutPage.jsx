import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  message,
  Divider,
  Radio,
  Avatar,
  Modal,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { formatCurrencyVND } from '../utils/formatters';

const { Title, Text } = Typography;
const { Option } = Select;

function CheckoutPage() {
  const [shippings, setShippings] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [shipRes, cartRes] = await Promise.all([axiosClient.get('/shipping'), axiosClient.get('/cart')]);

        const shipData = Array.isArray(shipRes.data) ? shipRes.data : shipRes.data.data || [];
        setShippings(shipData);

        const cartData = cartRes.data.cartItems || [];
        setCartItems(cartData);
        setTotalPrice(cartRes.data.grandTotal || 0);

        if (shipData.length > 0) {
          form.setFieldsValue({ shippingMethodId: shipData[0].Id });
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu checkout:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [form]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await axiosClient.post('/orders', {
        shippingMethodId: values.shippingMethodId,
        shippingAddress: values.address,
        phone: values.phone,
        couponCode: values.coupon,
        paymentMethod: values.paymentMethod,
      });

      Modal.success({
        title: 'ĐẶT HÀNG THÀNH CÔNG!',
        content: (
          <div>
            <p>
              Mã đơn hàng: <b>{res.data.orderCode}</b>
            </p>
            <p>
              Tổng thanh toán:{' '}
              <span style={{ color: 'red', fontWeight: 'bold' }}>
                {formatCurrencyVND(res.data.totalAmount)}
              </span>
            </p>
            <p>Cảm ơn bạn đã mua hàng!</p>
          </div>
        ),
        onOk() {
          navigate('/my-orders');
        },
      });
    } catch (error) {
      message.error(`Lỗi đặt hàng: ${error.response?.data?.message || 'Lỗi hệ thống'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            Thanh toán & Đặt hàng
          </Title>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ paymentMethod: 'cod' }}>
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <span>
                    <EnvironmentOutlined /> Địa chỉ nhận hàng
                  </span>
                }
                style={{ marginBottom: 20 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Họ tên người nhận">
                      <Input prefix={<UserOutlined />} disabled placeholder="Lấy từ tài khoản đăng nhập" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
                      <Input prefix={<PhoneOutlined />} placeholder="Ví dụ: 0988 123 456" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="address" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}>
                  <Input.TextArea rows={3} placeholder="Số nhà, đường, phường/xã..." />
                </Form.Item>
              </Card>

              <Card
                title={
                  <span>
                    <RocketOutlined /> Vận chuyển & Thanh toán
                  </span>
                }
              >
                <Form.Item name="shippingMethodId" label="Chọn đơn vị vận chuyển" rules={[{ required: true }]}>
                  <Select placeholder="Chọn gói ship" size="large">
                    {shippings.map((ship) => (
                      <Option key={ship.Id} value={ship.Id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {ship.Name} ({ship.EstimatedDays})
                          </span>
                          <span style={{ fontWeight: 'bold', color: '#ee4d2d' }}>
                            {formatCurrencyVND(ship.Price)}
                          </span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="paymentMethod" label="Phương thức thanh toán">
                  <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Radio value="cod" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}>
                      <CreditCardOutlined /> <b>Thanh toán khi nhận hàng (COD)</b>
                      <br />
                      <span style={{ color: '#888', paddingLeft: 22 }}>Nhận hàng, kiểm tra rồi mới trả tiền</span>
                    </Radio>
                    <Radio
                      value="banking"
                      disabled
                      style={{
                        padding: 10,
                        border: '1px solid #eee',
                        borderRadius: 4,
                        width: '100%',
                        background: '#fafafa',
                      }}
                    >
                      <div style={{ opacity: 0.6 }}>Chuyển khoản ngân hàng (Đang bảo trì)</div>
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Tóm tắt đơn hàng" style={{ position: 'sticky', top: 20 }}>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
                  {cartItems.map((item) => (
                    <div
                      key={item.CartItemId}
                      style={{
                        display: 'flex',
                        marginBottom: 15,
                        borderBottom: '1px solid #f0f0f0',
                        paddingBottom: 10,
                      }}
                    >
                      <Avatar
                        shape="square"
                        size={50}
                        src={item.Image ? `http://localhost:5000${item.Image}` : 'https://placehold.co/50'}
                      />
                      <div style={{ marginLeft: 10, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.ProductName}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>x{item.Quantity}</div>
                      </div>
                      <div style={{ fontWeight: 500 }}>{formatCurrencyVND(item.TotalLine)}</div>
                    </div>
                  ))}
                </div>

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text>Tạm tính:</Text>
                  <Text strong>{formatCurrencyVND(totalPrice)}</Text>
                </div>

                <Divider style={{ margin: '10px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Title level={4}>Tổng cộng:</Title>
                  <Title level={3} type="danger">
                    {formatCurrencyVND(totalPrice)}
                  </Title>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{ height: 50, fontSize: 18, background: '#ee4d2d', borderColor: '#ee4d2d', fontWeight: 'bold' }}
                >
                  Đặt hàng ngay
                </Button>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default CheckoutPage;
