import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Row, Col, Card, Statistic, Spin, Typography, Tag } from 'antd';
import { DollarCircleOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyVND } from '../utils/formatters';

const { Title, Text } = Typography;

const returnStatusMeta = {
  Requested: { color: 'gold', label: 'Chờ xử lý' },
  Approved: { color: 'blue', label: 'Đã duyệt' },
  Refunded: { color: 'green', label: 'Đã hoàn tiền' },
  Rejected: { color: 'red', label: 'Từ chối' },
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/admin/stats')
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Bảng điều khiển doanh thu</Title>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fff6ed', borderRadius: 16 }}>
            <Statistic
              title="Tổng doanh thu"
              value={stats?.revenue || 0}
              formatter={(value) => formatCurrencyVND(value)}
              valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#f0f5ff', borderRadius: 16 }}>
            <Statistic
              title="Tổng đơn hàng"
              value={stats?.orders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 16 }}>
            <Statistic
              title="Tổng khách hàng"
              value={stats?.users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fff4f0', borderRadius: 16 }}>
            <Statistic
              title="Tổng yêu cầu trả hàng"
              value={stats?.returns?.total || 0}
              valueStyle={{ color: '#d46b08' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 16 }}>
            <Statistic
              title="Chờ xử lý"
              value={stats?.returns?.pending || 0}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#fff0f6', borderRadius: 16 }}>
            <Statistic
              title="Đã hoàn tiền"
              value={stats?.returns?.refundedAmount || 0}
              formatter={(value) => formatCurrencyVND(value)}
              valueStyle={{ color: '#c41d7f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Trạng thái trả hàng" style={{ marginTop: 24, borderRadius: 16 }}>
        {stats?.returns?.byStatus?.length ? (
          stats.returns.byStatus.map((item) => {
            const meta = returnStatusMeta[item.Status] || { color: 'default', label: item.Status };
            return (
              <Tag key={item.Status} color={meta.color} style={{ marginBottom: 8 }}>
                {meta.label}: {item.count}
              </Tag>
            );
          })
        ) : (
          <Text type="secondary">Chưa có dữ liệu</Text>
        )}
      </Card>

      <Card title="Biểu đồ doanh thu (7 ngày gần nhất)" style={{ marginTop: 24, borderRadius: 16 }}>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={stats?.chart || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrencyVND(value)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ee4d2d"
                strokeWidth={4}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboard;
