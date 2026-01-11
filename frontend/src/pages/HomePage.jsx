import { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, message, Tag, Carousel, Avatar, Input, Select, Space, Pagination, BackTop } from 'antd';
import {
  ShoppingCartOutlined,
  ThunderboltFilled,
  MobileOutlined,
  LaptopOutlined,
  SkinOutlined,
  HomeOutlined,
  RocketOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { formatCurrencyVND } from '../utils/formatters';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const PAGE_SIZE = 12;

const banners = [
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
  'https://assets.tacter.com/images/open-graph/tft.webp',
];

const categories = [
  { label: 'Thời trang', value: 'fashion', icon: <SkinOutlined /> },
  { label: 'Điện thoại', value: 'phone', icon: <MobileOutlined /> },
  { label: 'Laptop', value: 'laptop', icon: <LaptopOutlined /> },
  { label: 'Gia dụng', value: 'home', icon: <HomeOutlined /> },
  { label: 'Đồ chơi', value: 'toy', icon: <RocketOutlined /> },
  { label: 'Sách', value: 'book', icon: <ThunderboltFilled /> },
];

const promoTiles = [
  {
    title: 'Deal công nghệ',
    subtitle: 'Điện thoại giảm sâu',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    category: 'phone',
  },
  {
    title: 'Tủ đồ mới',
    subtitle: 'Streetwear & cơ bản',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    category: 'fashion',
  },
  {
    title: 'Góc gia dụng',
    subtitle: 'Nhà gọn, sống chill',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
    category: 'home',
  },
];

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const fetchProducts = async (customKeyword = keyword, customCategory = selectedCategory, customPage = page) => {
    setLoading(true);
    try {
      const params = {
        keyword: customKeyword,
        sort: sortBy,
        page: customPage,
        limit: PAGE_SIZE,
      };
      if (customCategory) {
        params.category = customCategory;
      }
      const response = await axiosClient.get('/products', { params });
      setProducts(response.data.data || []);
      setTotalItems(response.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Lỗi lấy sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [sortBy, selectedCategory, page, keyword]);

  const onSearch = (value) => {
    setKeyword(value);
    setPage(1);
  };

  const handleCategoryClick = (value) => {
    setSelectedCategory((prev) => (prev === value ? '' : value));
    setKeyword('');
    setPage(1);
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePromoClick = (value) => {
    setSelectedCategory(value);
    setKeyword('');
    setPage(1);
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để mua hàng!');
      navigate('/login');
      return;
    }
    try {
      await axiosClient.post('/cart/add', { productId, quantity: 1 });
      message.success('Đã thêm vào giỏ hàng!');
    } catch (error) {
      message.error(`Lỗi: ${error.response?.data?.message || 'Hệ thống bận'}`);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/300x200?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  const activeCategory = categories.find((cat) => cat.value === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 50 }}>
      <div className="home-hero">
        <div className="home-hero__main section-card">
          <Carousel autoplay effect="fade">
            {banners.map((img, index) => (
              <div key={index} className="hero-banner">
                <img src={img} alt="banner" />
              </div>
            ))}
          </Carousel>
        </div>
        <div className="home-hero__side">
          {promoTiles.map((tile) => (
            <button
              type="button"
              key={tile.title}
              className="promo-tile"
              onClick={() => handlePromoClick(tile.category)}
              aria-label={`Xem ${tile.title.toLowerCase()}`}
            >
              <img src={tile.image} alt={tile.title} />
              <div className="promo-tile__overlay">
                <Text className="promo-tile__title">{tile.title}</Text>
                <Text className="promo-tile__subtitle">{tile.subtitle}</Text>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="section-card home-categories">
        <div className="home-categories__header">
          <Title level={5} style={{ margin: 0 }}>
            DANH MỤC
          </Title>
          {activeCategory && (
            <Tag closable onClose={() => setSelectedCategory('')}>
              Đang lọc: {activeCategory.label}
            </Tag>
          )}
        </div>
        <div className="category-scroll">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.value}
              className={`category-chip ${selectedCategory === cat.value ? 'is-active' : ''}`}
              onClick={() => handleCategoryClick(cat.value)}
              aria-pressed={selectedCategory === cat.value}
            >
              <Avatar size={58} icon={cat.icon} />
              <Text>{cat.label}</Text>
            </button>
          ))}
        </div>
      </div>

      <div className="section-card home-toolbar">
        <div style={{ flex: 1, minWidth: 220 }}>
          <Search placeholder="Tìm kiếm sản phẩm..." enterButton="Tìm ngay" size="large" onSearch={onSearch} loading={loading} />
        </div>
        <Space align="center">
          <FilterOutlined style={{ fontSize: 18, color: '#888' }} />
          <Text strong>Sắp xếp:</Text>
          <Select defaultValue="newest" style={{ width: 180 }} size="large" onChange={handleSortChange}>
            <Option value="newest">Mới nhất</Option>
            <Option value="price_asc">Giá: Thấp đến cao</Option>
            <Option value="price_desc">Giá: Cao đến thấp</Option>
          </Select>
        </Space>
      </div>

      <div style={{ padding: '10px 0' }} ref={gridRef}>
        <div className="section-card home-highlight">
          <Title level={3} style={{ color: '#ee4d2d', margin: 0 }}>
            <ThunderboltFilled /> GỢI Ý HÔM NAY
          </Title>
          <Text type="secondary">
            Hiển thị {products.length} / {totalItems || products.length} sản phẩm
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          {products.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', padding: 50 }}>
              <Text type="secondary" style={{ fontSize: 18 }}>
                Không tìm thấy sản phẩm phù hợp.
              </Text>
            </div>
          ) : (
            products.map((product) => {
              const randomDiscount = 10 + (product.Id % 41);
              const fakeOriginalPrice = product.Price / (1 - randomDiscount / 100);

              return (
                <Col xs={12} sm={8} md={6} lg={4} key={product.Id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    styles={{ body: { padding: 10 } }}
                    cover={
                      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                        <Tag color="red" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                          -{randomDiscount}%
                        </Tag>
                        <img
                          alt={product.Name}
                          src={getImageUrl(product.Image)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/300x200?text=Error';
                          }}
                        />
                      </div>
                    }
                    actions={[
                      <Button
                        type="primary"
                        size="small"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => handleAddToCart(product.Id)}
                        className="product-card__cta"
                      >
                        Thêm
                      </Button>,
                    ]}
                    className="product-card"
                  >
                    <div style={{ height: 40, overflow: 'hidden', marginBottom: 5 }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {product.Name}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text delete type="secondary" style={{ fontSize: 12 }}>
                        {formatCurrencyVND(fakeOriginalPrice)}
                      </Text>
                      <Text type="danger" strong style={{ fontSize: 16 }}>
                        {formatCurrencyVND(product.Price)}
                      </Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          Đã bán {product.Id * 3 + 15}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          Hà Nội
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })
          )}
        </Row>

        {totalItems > PAGE_SIZE && (
          <div className="pagination-bar">
            <Pagination current={page} total={totalItems} pageSize={PAGE_SIZE} showSizeChanger={false} onChange={handlePageChange} />
          </div>
        )}
      </div>

      <BackTop />
    </div>
  );
}

export default HomePage;
