import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Table, Tag, Typography, Card, Select, message, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyVND } from '../utils/formatters';

const { Text } = Typography;
const { Option } = Select;

const statusLabels = {
  Pending: 'Chờ xử lý',
  Shipping: 'Đang giao',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/orders/admin/all');
      setOrders(response.data.data || []);
    } catch (error) {
      message.error('Bạn không có quyền quản trị hoặc lỗi hệ thống');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus });
      const label = statusLabels[newStatus] || newStatus;
      message.success(`Đã cập nhật đơn #${orderId} sang ${label}`);
      fetchOrders();
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'Id', width: 60 },
    {
      title: 'Khách hàng',
      dataIndex: 'CustomerName',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.PhoneNumber}
          </Text>
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TotalAmount',
      render: (val) => <Text type="danger">{formatCurrencyVND(val)}</Text>,
    },
    { title: 'Địa chỉ', dataIndex: 'ShippingAddress', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      render: (status, record) => (
        <Select
          defaultValue={status}
          style={{ width: 160 }}
          onChange={(value) => handleStatusChange(record.Id, value)}
        >
          <Option value="Pending">
            <Tag color="orange">{statusLabels.Pending}</Tag>
          </Option>
          <Option value="Shipping">
            <Tag color="blue">{statusLabels.Shipping}</Tag>
          </Option>
          <Option value="Completed">
            <Tag color="green">{statusLabels.Completed}</Tag>
          </Option>
          <Option value="Cancelled">
            <Tag color="red">{statusLabels.Cancelled}</Tag>
          </Option>
        </Select>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card title="Quản lý đơn hàng (Quản trị)" extra={<Button onClick={fetchOrders}>Làm mới</Button>}>
        <Table dataSource={orders} columns={columns} rowKey="Id" loading={loading} />
      </Card>
    </div>
  );
}

export default AdminOrdersPage;
