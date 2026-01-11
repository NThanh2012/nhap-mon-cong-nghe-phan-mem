USE master;
GO

-- 1. Nếu đã có database cũ thì xóa đi làm lại cho chuẩn
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'SalesOrderDB')
BEGIN
    ALTER DATABASE SalesOrderDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SalesOrderDB;
END
GO

-- 2. Tạo lại Database mới
CREATE DATABASE SalesOrderDB;
GO

USE SalesOrderDB;
GO

-- =============================================
-- BẢNG 1: USERS & PRODUCTS (GIỮ NGUYÊN NHƯ CŨ)
-- =============================================

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100),
    Role VARCHAR(20) DEFAULT 'customer' -- admin, operations, customer
);

CREATE TABLE Products (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Sku VARCHAR(50) UNIQUE NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    Description NVARCHAR(MAX)
);

-- =============================================
-- BẢNG 2: SALES ORDERS (ĐƠN HÀNG - ĐÃ NÂNG CẤP)
-- =============================================
-- Cập nhật theo ý bạn: Thêm customer_info snapshot, tách tiền nong rõ ràng
CREATE TABLE SalesOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderCode VARCHAR(50) UNIQUE NOT NULL, -- Mã đơn
    UserId INT FOREIGN KEY REFERENCES Users(Id), -- Ai đặt?
    
    -- Thông tin Snapshot (Lưu cứng tại thời điểm đặt, khách đổi địa chỉ sau này không ảnh hưởng đơn cũ)
    CustomerName NVARCHAR(100), 
    ShippingAddress NVARCHAR(MAX),
    PhoneNumber VARCHAR(20),

    -- Các cột tiền nong
    SubTotal DECIMAL(18, 2) DEFAULT 0, -- Tiền hàng
    ShippingFee DECIMAL(18, 2) DEFAULT 0, -- Phí ship
    Discount DECIMAL(18, 2) DEFAULT 0, -- Giảm giá
    TotalAmount DECIMAL(18, 2) DEFAULT 0, -- Tổng thanh toán cuối cùng

    Status VARCHAR(20) DEFAULT 'New', -- New, Paid, Packed, Shipped, Delivered, Cancelled
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG 3: SALES ORDER LINES (CHI TIẾT - ĐÃ NÂNG CẤP)
-- =============================================
CREATE TABLE SalesOrderLines (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id) ON DELETE CASCADE,
    ProductId INT FOREIGN KEY REFERENCES Products(Id),
    
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL, -- Giá lúc mua (quan trọng)
    LineTotal DECIMAL(18, 2) NOT NULL -- = Quantity * UnitPrice
);

-- =============================================
-- BẢNG 4: PAYMENTS (THANH TOÁN - MỚI)
-- =============================================
-- Quan hệ 1-Nhiều: Một đơn có thể thanh toán lỗi rồi thanh toán lại
CREATE TABLE Payments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Method VARCHAR(50), -- COD, VNPay, MoMo
    Amount DECIMAL(18, 2) NOT NULL, -- Số tiền giao dịch
    Status VARCHAR(20) DEFAULT 'Pending', -- Pending, Success, Failed
    TransactionId VARCHAR(100), -- Mã giao dịch từ phía Ngân hàng/Momo trả về
    PaidAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG 5: SHIPMENTS (VẬN CHUYỂN - MỚI)
-- =============================================
-- Quan hệ 1-1 (hoặc 0-1): Mỗi đơn hàng thường chỉ có 1 vận đơn
CREATE TABLE Shipments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Carrier VARCHAR(50), -- GHN, GHTK, ViettelPost
    TrackingNumber VARCHAR(50), -- Mã vận đơn
    ShippedAt DATETIME, -- Ngày kho giao cho ship
    DeliveredAt DATETIME, -- Ngày khách nhận
    SLAFlag BIT DEFAULT 0 -- 0: Đúng giờ, 1: Trễ (Đánh dấu để phạt hãng vận chuyển)
);

-- =============================================
-- BẢNG 6: RETURN ORDERS (ĐỔI TRẢ - MỚI)
-- =============================================
CREATE TABLE ReturnOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Reason NVARCHAR(MAX), -- Lý do trả hàng (Hàng hỏng, sai màu...)
    RefundAmount DECIMAL(18, 2), -- Số tiền hoàn lại
    Status VARCHAR(20) DEFAULT 'Requested', -- Requested, Approved, Refunded, Rejected
    RequestedAt DATETIME DEFAULT GETDATE()
)USE master;
GO

-- 1. Nếu đã có database cũ thì xóa đi làm lại cho chuẩn
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'SalesOrderDB')
BEGIN
    ALTER DATABASE SalesOrderDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SalesOrderDB;
END
GO

-- 2. Tạo lại Database mới
CREATE DATABASE SalesOrderDB;
GO

USE SalesOrderDB;
GO

-- =============================================
-- BẢNG 1: USERS & PRODUCTS (GIỮ NGUYÊN NHƯ CŨ)
-- =============================================

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100),
    Role VARCHAR(20) DEFAULT 'customer' -- admin, operations, customer
);

CREATE TABLE Products (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Sku VARCHAR(50) UNIQUE NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    Description NVARCHAR(MAX)
);

-- =============================================
-- BẢNG 2: SALES ORDERS (ĐƠN HÀNG - ĐÃ NÂNG CẤP)
-- =============================================
-- Cập nhật theo ý bạn: Thêm customer_info snapshot, tách tiền nong rõ ràng
CREATE TABLE SalesOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderCode VARCHAR(50) UNIQUE NOT NULL, -- Mã đơn
    UserId INT FOREIGN KEY REFERENCES Users(Id), -- Ai đặt?
    
    -- Thông tin Snapshot (Lưu cứng tại thời điểm đặt, khách đổi địa chỉ sau này không ảnh hưởng đơn cũ)
    CustomerName NVARCHAR(100), 
    ShippingAddress NVARCHAR(MAX),
    PhoneNumber VARCHAR(20),

    -- Các cột tiền nong
    SubTotal DECIMAL(18, 2) DEFAULT 0, -- Tiền hàng
    ShippingFee DECIMAL(18, 2) DEFAULT 0, -- Phí ship
    Discount DECIMAL(18, 2) DEFAULT 0, -- Giảm giá
    TotalAmount DECIMAL(18, 2) DEFAULT 0, -- Tổng thanh toán cuối cùng

    Status VARCHAR(20) DEFAULT 'New', -- New, Paid, Packed, Shipped, Delivered, Cancelled
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG 3: SALES ORDER LINES (CHI TIẾT - ĐÃ NÂNG CẤP)
-- =============================================
CREATE TABLE SalesOrderLines (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id) ON DELETE CASCADE,
    ProductId INT FOREIGN KEY REFERENCES Products(Id),
    
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL, -- Giá lúc mua (quan trọng)
    LineTotal DECIMAL(18, 2) NOT NULL -- = Quantity * UnitPrice
);

-- =============================================
-- BẢNG 4: PAYMENTS (THANH TOÁN - MỚI)
-- =============================================
-- Quan hệ 1-Nhiều: Một đơn có thể thanh toán lỗi rồi thanh toán lại
CREATE TABLE Payments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Method VARCHAR(50), -- COD, VNPay, MoMo
    Amount DECIMAL(18, 2) NOT NULL, -- Số tiền giao dịch
    Status VARCHAR(20) DEFAULT 'Pending', -- Pending, Success, Failed
    TransactionId VARCHAR(100), -- Mã giao dịch từ phía Ngân hàng/Momo trả về
    PaidAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- BẢNG 5: SHIPMENTS (VẬN CHUYỂN - MỚI)
-- =============================================
-- Quan hệ 1-1 (hoặc 0-1): Mỗi đơn hàng thường chỉ có 1 vận đơn
CREATE TABLE Shipments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Carrier VARCHAR(50), -- GHN, GHTK, ViettelPost
    TrackingNumber VARCHAR(50), -- Mã vận đơn
    ShippedAt DATETIME, -- Ngày kho giao cho ship
    DeliveredAt DATETIME, -- Ngày khách nhận
    SLAFlag BIT DEFAULT 0 -- 0: Đúng giờ, 1: Trễ (Đánh dấu để phạt hãng vận chuyển)
);

-- =============================================
-- BẢNG 6: RETURN ORDERS (ĐỔI TRẢ - MỚI)
-- =============================================
CREATE TABLE ReturnOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Reason NVARCHAR(MAX), -- Lý do trả hàng (Hàng hỏng, sai màu...)
    RefundAmount DECIMAL(18, 2), -- Số tiền hoàn lại
    Status VARCHAR(20) DEFAULT 'Requested', -- Requested, Approved, Refunded, Rejected
    RequestedAt DATETIME DEFAULT GETDATE()
);

-- =============================================
-- DỮ LIỆU MẪU (TEST DATA)
-- =============================================
INSERT INTO Users (Username, Password, FullName, Role) VALUES 
('admin', '123', N'Admin Đẹp Trai', 'admin'),
('kho', '123', N'Nhân Viên Kho', 'operations'),
('khach', '123', N'Khách Mua Hàng', 'customer');

INSERT INTO Products (Name, Sku, Price, StockQuantity) VALUES 
(N'iPhone 15 Pro Max', 'IP15PM', 30000000, 50),
(N'Tai nghe AirPods', 'AIRPOD', 5000000, 100);

-- Giả sử ông khách đặt 1 đơn
INSERT INTO SalesOrders (OrderCode, UserId, CustomerName, ShippingAddress, SubTotal, TotalAmount, Status)
VALUES ('ORD-001', 3, N'Khách Mua Hàng', N'123 Đường Láng, Hà Nội', 30000000, 30000000, 'New');
GO

-- =============================================
-- DỮ LIỆU MẪU (TEST DATA)
-- =============================================
INSERT INTO Users (Username, Password, FullName, Role) VALUES 
('admin', '123', N'Admin Đẹp Trai', 'admin'),
('kho', '123', N'Nhân Viên Kho', 'operations'),
('khach', '123', N'Khách Mua Hàng', 'customer');

INSERT INTO Products (Name, Sku, Price, StockQuantity) VALUES 
(N'iPhone 15 Pro Max', 'IP15PM', 30000000, 50),
(N'Tai nghe AirPods', 'AIRPOD', 5000000, 100);

-- Giả sử ông khách đặt 1 đơn
INSERT INTO SalesOrders (OrderCode, UserId, CustomerName, ShippingAddress, SubTotal, TotalAmount, Status)
VALUES ('ORD-001', 3, N'Khách Mua Hàng', N'123 Đường Láng, Hà Nội', 30000000, 30000000, 'New');
GO