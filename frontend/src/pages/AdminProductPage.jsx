import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Popconfirm,
  Image,
  Space,
  Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { formatCurrencyVND } from '../utils/formatters';

const categoryOptions = [
  { label: 'Thời trang', value: 'fashion' },
  { label: 'Điện thoại', value: 'phone' },
  { label: 'Laptop', value: 'laptop' },
  { label: 'Gia dụng', value: 'home' },
  { label: 'Đồ chơi', value: 'toy' },
  { label: 'Sách', value: 'book' },
  { label: 'Khác', value: 'other' },
];

const categoryLabels = categoryOptions.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

function AdminProductPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/products?limit=100');
      setProducts(response.data.data || []);
    } catch (error) {
      message.error('Lỗi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFinish = async (values) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('price', values.price);
    formData.append('description', values.description || '');
    formData.append('stockQuantity', values.stockQuantity);
    formData.append('sku', values.sku || '');
    formData.append('category', values.category || 'other');

    if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
      formData.append('image', values.image[0].originFileObj);
    }

    try {
      if (editingProduct) {
        await axiosClient.put(`/products/${editingProduct.Id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        message.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        message.success('Thêm mới thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      message.error(`Lỗi lưu sản phẩm: ${error.response?.data?.message || 'Lỗi hệ thống'}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/products/${id}`);
      message.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  const openEditModal = (record) => {
    setEditingProduct(record);
    form.setFieldsValue({
      name: record.Name,
      price: record.Price,
      description: record.Description,
      stockQuantity: record.StockQuantity,
      sku: record.Sku,
      category: record.Category || 'other',
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'Image',
      render: (src) => (
        <Image width={50} src={src ? `http://localhost:5000${src}` : 'https://placehold.co/50'} />
      ),
    },
    { title: 'Tên sản phẩm', dataIndex: 'Name', width: 200 },
    {
      title: 'Danh mục',
      dataIndex: 'Category',
      render: (value) => categoryLabels[value] || value || 'Khác',
    },
    {
      title: 'Giá',
      dataIndex: 'Price',
      render: (val) => formatCurrencyVND(val),
    },
    { title: 'Tồn kho', dataIndex: 'StockQuantity' },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} type="primary" ghost />
          <Popconfirm title="Xóa thật không?" onConfirm={() => handleDelete(record.Id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Quản lý sản phẩm</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProduct(null);
            form.resetFields();
            form.setFieldsValue({ category: 'fashion' });
            setIsModalOpen(true);
          }}
        >
          Thêm sản phẩm mới
        </Button>
      </div>

      <Table dataSource={products} columns={columns} rowKey="Id" loading={loading} />

      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ category: 'fashion' }}>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Space style={{ display: 'flex', width: '100%' }} align="start">
            <Form.Item name="price" label="Giá (VND)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="stockQuantity" label="Tồn kho" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="sku" label="Mã SKU (mã kho)">
            <Input />
          </Form.Item>

          <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
            <Select options={categoryOptions} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="image" label="Hình ảnh" valuePropName="fileList" getValueFromEvent={normFile}>
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>Chọn ảnh từ máy</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            {editingProduct ? 'CẬP NHẬT' : 'THÊM MỚI'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminProductPage;
