import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Table, Tag, Typography, Card, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyVND, formatDateTimeVN } from '../utils/formatters';

const { Text } = Typography;

const ORDERS_CACHE_PREFIX = 'orders_cache_';

const getOrdersCacheKey = (userId) => {
  if (!userId) return null;
  return `${ORDERS_CACHE_PREFIX}${userId}`;
};

const readOrdersCache = (userId) => {
  const key = getOrdersCacheKey(userId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

const writeOrdersCache = (userId, orders) => {
  const key = getOrdersCacheKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(orders));
  } catch (err) {
    // Best-effort cache write.
  }
};

const returnStatusMap = {
  Requested: { color: 'gold', label: 'Đang chờ' },
  Approved: { color: 'blue', label: 'Đã duyệt' },
  Refunded: { color: 'green', label: 'Đã hoàn tiền' },
  Rejected: { color: 'red', label: 'Từ chối' },
};

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returnsMap, setReturnsMap] = useState({});
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnForm] = Form.useForm();
  const navigate = useNavigate();
  const storedUserId = localStorage.getItem('userId');

  const fetchOrders = async () => {
    const cachedOrders = readOrdersCache(storedUserId);
    if (cachedOrders.length > 0) {
      setOrders(cachedOrders);
    }
    const token = localStorage.getItem('token');
    if (!token) {
      if (cachedOrders.length === 0) {
        navigate('/login');
      }
      return;
    }
    setLoading(true);
    try {
      const response = await axiosClient.get('/orders');
      const data = response.data.data || [];
      setOrders(data);
      writeOrdersCache(storedUserId, data);
    } catch (error) {
      const status = error.response?.status;
      if ((status === 401 || status === 403) && cachedOrders.length === 0) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const response = await axiosClient.get('/returns');
      const map = {};
      (response.data.data || []).forEach((item) => {
        map[item.OrderId] = item;
      });
      setReturnsMap(map);
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReturns();
  }, []);

  const openReturnModal = (order) => {
    setSelectedOrder(order);
    returnForm.setFieldsValue({
      reason: '',
      refundAmount: order.TotalAmount,
    });
    setReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setSelectedOrder(null);
    returnForm.resetFields();
  };

  const submitReturn = async (values) => {
    if (!selectedOrder) return;
    try {
      await axiosClient.post('/returns', {
        orderId: selectedOrder.Id,
        reason: values.reason,
        refundAmount: values.refundAmount,
      });
      message.success('Đã gửi yêu cầu trả hàng');
      closeReturnModal();
      fetchReturns();
    } catch (error) {
      message.error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
    }
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'OrderCode',
      key: 'code',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'CreatedAt',
      key: 'date',
      render: (date) => formatDateTimeVN(date),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TotalAmount',
      key: 'total',
      render: (amount) => (
        <Text type="danger" strong>
          {formatCurrencyVND(amount)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let label = status;
        if (status === 'Pending') {
          color = 'orange';
          label = 'Chờ xử lý';
        }
        if (status === 'Shipping') {
          color = 'blue';
          label = 'Đang giao';
        }
        if (status === 'Completed') {
          color = 'green';
          label = 'Hoàn thành';
        }
        if (status === 'Cancelled') {
          color = 'red';
          label = 'Đã hủy';
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Trả hàng',
      key: 'return',
      render: (_, record) => {
        const returnReq = returnsMap[record.Id];
        if (returnReq) {
          const statusInfo = returnStatusMap[returnReq.Status] || { color: 'default', label: returnReq.Status };
          return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
        }
        const disabled = record.Status !== 'Completed';
        return (
          <Button type="primary" ghost disabled={disabled} onClick={() => openReturnModal(record)}>
            Yêu cầu
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '30px auto', padding: 20 }}>
      <Card title="Lịch sử đơn hàng">
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="Id"
          loading={loading}
          locale={{ emptyText: 'Bạn chưa mua đơn hàng nào' }}
        />
      </Card>

      <Modal
        open={returnModalOpen}
        title="Yêu cầu trả hàng"
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        onOk={() => returnForm.submit()}
        onCancel={closeReturnModal}
      >
        <Form form={returnForm} layout="vertical" onFinish={submitReturn}>
          <Form.Item label="Mã đơn hàng">
            <Text strong>{selectedOrder?.OrderCode}</Text>
          </Form.Item>
          <Form.Item
            name="reason"
            label="Lý do trả hàng"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: sản phẩm lỗi, sai mẫu..." />
          </Form.Item>
          <Form.Item name="refundAmount" label="Số tiền hoàn">
            <InputNumber
              min={0}
              max={selectedOrder?.TotalAmount || 0}
              style={{ width: '100%' }}
              placeholder="Để trống sẽ hoàn toàn bộ"
            />
          </Form.Item>
          <Text type="secondary">
            Tối đa: {selectedOrder ? formatCurrencyVND(selectedOrder.TotalAmount) : '0'}
          </Text>
        </Form>
      </Modal>
    </div>
  );
}

export default MyOrdersPage;
