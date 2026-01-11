import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Table,
  Tag,
  Typography,
  Card,
  Select,
  message,
  Button,
  Input,
  Space,
  DatePicker,
  Drawer,
  Form,
  InputNumber,
  Descriptions,
  Timeline,
  Divider,
  Spin,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyVND, formatDateTimeVN } from '../utils/formatters';

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const returnStatusMeta = {
  Requested: { color: 'gold', label: 'Chờ xử lý' },
  Approved: { color: 'blue', label: 'Đã duyệt' },
  Refunded: { color: 'green', label: 'Đã hoàn tiền' },
  Rejected: { color: 'red', label: 'Từ chối' },
};

function AdminReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUpdating, setDetailUpdating] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);
  const [detailForm] = Form.useForm();
  const navigate = useNavigate();

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/returns/admin');
      setReturns(response.data.data || []);
    } catch (error) {
      message.error('Bạn không có quyền quản trị hoặc lỗi hệ thống');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleStatusChange = async (returnId, status) => {
    try {
      await axiosClient.put(`/returns/${returnId}/status`, { status });
      const statusLabel = returnStatusMeta[status]?.label || status;
      message.success(`Đã cập nhật yêu cầu #${returnId} sang ${statusLabel}`);
      fetchReturns();
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const fetchReturnDetail = async (returnId) => {
    setDetailLoading(true);
    try {
      const response = await axiosClient.get(`/returns/admin/${returnId}`);
      const data = response.data.data;
      setDetailData(data);
      setDetailLogs(data?.logs || []);
      detailForm.setFieldsValue({
        status: data?.Status,
        refundAmount: data?.RefundAmount,
        note: '',
      });
    } catch (error) {
      message.error('Không lấy được chi tiết');
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (record) => {
    setDetailOpen(true);
    fetchReturnDetail(record.Id);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
    setDetailLogs([]);
    detailForm.resetFields();
  };

  const submitDetailUpdate = async () => {
    if (!detailData) return;
    setDetailUpdating(true);
    try {
      const values = await detailForm.validateFields();
      await axiosClient.put(`/returns/${detailData.Id}/status`, {
        status: values.status,
        refundAmount: values.refundAmount,
        note: values.note,
      });
      message.success('Đã cập nhật yêu cầu');
      fetchReturns();
      fetchReturnDetail(detailData.Id);
      detailForm.setFieldsValue({ note: '' });
    } catch (error) {
      if (!error?.errorFields) {
        message.error('Cập nhật thất bại');
      }
    } finally {
      setDetailUpdating(false);
    }
  };

  const filteredReturns = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return returns.filter((item) => {
      if (statusFilter !== 'all' && item.Status !== statusFilter) return false;

      if (query) {
        const haystack = [
          item.OrderCode,
          item.FullName,
          item.Username,
          item.Reason,
          item.Status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange;
        const requestedAt = item.RequestedAt ? new Date(item.RequestedAt) : null;
        if (!requestedAt || Number.isNaN(requestedAt.getTime())) return false;
        const startDate = start ? start.startOf('day').toDate() : null;
        const endDate = end ? end.endOf('day').toDate() : null;
        if (startDate && requestedAt < startDate) return false;
        if (endDate && requestedAt > endDate) return false;
      }

      return true;
    });
  }, [returns, searchText, statusFilter, dateRange]);

  const columns = [
    { title: 'ID', dataIndex: 'Id', width: 70 },
    {
      title: 'Đơn hàng',
      dataIndex: 'OrderCode',
      render: (text, record) => (
        <div>
          <Text strong>{text || `#${record.OrderId}`}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hoàn: {formatCurrencyVND(record.RefundAmount)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Khách hàng',
      render: (_, record) => (
        <div>
          <Text strong>{record.FullName || record.Username || 'Khách'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng đơn: {formatCurrencyVND(record.TotalAmount)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'Reason',
      render: (reason) => (
        <Text ellipsis={{ tooltip: reason }} style={{ maxWidth: 220, display: 'inline-block' }}>
          {reason || '--'}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 160 }}
          onChange={(value) => handleStatusChange(record.Id, value)}
        >
          {Object.entries(returnStatusMeta).map(([value, meta]) => (
            <Option key={value} value={value}>
              <Tag color={meta.color}>{meta.label}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Tác vụ',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => openDetail(record)}>
          Chi tiết
        </Button>
      ),
    },
    {
      title: 'Yêu cầu lúc',
      dataIndex: 'RequestedAt',
      render: (date) => <Text>{formatDateTimeVN(date)}</Text>,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card title="Quản lý trả hàng (Quản trị)">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm đơn hàng, khách hàng, lý do..."
            allowClear
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 260 }}
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
            <Option value="all">Tất cả trạng thái</Option>
            {Object.entries(returnStatusMeta).map(([value, meta]) => (
              <Option key={value} value={value}>
                {meta.label}
              </Option>
            ))}
          </Select>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchReturns}>Làm mới</Button>
        </Space>
        <Table dataSource={filteredReturns} columns={columns} rowKey="Id" loading={loading} />
      </Card>

      <Drawer
        title={detailData ? `Chi tiết trả hàng #${detailData.Id}` : 'Chi tiết trả hàng'}
        width={520}
        open={detailOpen}
        onClose={closeDetail}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Spin />
          </div>
        ) : (
          <>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Đơn hàng">
                {detailData?.OrderCode || (detailData ? `#${detailData.OrderId}` : '--')}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {detailData?.FullName || detailData?.Username || 'Khách'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng đơn">
                {formatCurrencyVND(detailData?.TotalAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Hoàn tiền">
                {formatCurrencyVND(detailData?.RefundAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Lý do">{detailData?.Reason || '--'}</Descriptions.Item>
              <Descriptions.Item label="Yêu cầu lúc">
                {formatDateTimeVN(detailData?.RequestedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {detailData?.Status
                  ? returnStatusMeta[detailData.Status]?.label || detailData.Status
                  : '--'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form form={detailForm} layout="vertical" onFinish={submitDetailUpdate}>
              <Form.Item
                name="status"
                label="Trạng thái mới"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  {Object.entries(returnStatusMeta).map(([value, meta]) => (
                    <Option key={value} value={value}>
                      {meta.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="refundAmount" label="Số tiền hoàn">
                <InputNumber
                  min={0}
                  max={detailData?.TotalAmount || 0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="note" label="Ghi chú xử lý">
                <Input.TextArea rows={3} placeholder="Ghi chú nội bộ..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={detailUpdating}>
                Cập nhật
              </Button>
            </Form>

            <Divider />

            <Text strong>Lịch sử</Text>
            {detailLogs.length === 0 ? (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Chưa có lịch sử</Text>
              </div>
            ) : (
              <Timeline
                style={{ marginTop: 12 }}
                items={detailLogs.map((log) => {
                  const meta = returnStatusMeta[log.NewStatus] || { color: 'default', label: log.NewStatus };
                  const oldLabel = log.OldStatus ? returnStatusMeta[log.OldStatus]?.label || log.OldStatus : '';
                  const actor = log.FullName || log.Username || 'Hệ thống';
                  return {
                    color: meta.color,
                    children: (
                      <div>
                        <Text strong>
                          {log.OldStatus ? `${oldLabel} -> ` : ''}
                          {meta.label}
                        </Text>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {formatDateTimeVN(log.ChangedAt)} - {actor}
                        </div>
                        {log.Note ? <div style={{ marginTop: 4 }}>{log.Note}</div> : null}
                      </div>
                    ),
                  };
                })}
              />
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

export default AdminReturnsPage;
