USE SalesOrderDB;
GO

IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username VARCHAR(50) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        FullName NVARCHAR(100),
        Email NVARCHAR(255),
        Role VARCHAR(20) DEFAULT 'user'
    );
END
ELSE
BEGIN
    IF COL_LENGTH('Users', 'Email') IS NULL
        ALTER TABLE Users ADD Email NVARCHAR(255) NULL;
    IF COL_LENGTH('Users', 'Role') IS NULL
        ALTER TABLE Users ADD Role VARCHAR(20) DEFAULT 'user';
END
GO

IF OBJECT_ID('Products', 'U') IS NULL
BEGIN
    CREATE TABLE Products (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Sku VARCHAR(50) UNIQUE NOT NULL,
        Price DECIMAL(18, 2) NOT NULL,
        StockQuantity INT DEFAULT 0,
        Description NVARCHAR(MAX),
        Category NVARCHAR(50) DEFAULT 'other',
        Image NVARCHAR(255)
    );
END
ELSE
BEGIN
    IF COL_LENGTH('Products', 'Category') IS NULL
        ALTER TABLE Products ADD Category NVARCHAR(50) DEFAULT 'other';
    IF COL_LENGTH('Products', 'Image') IS NULL
        ALTER TABLE Products ADD Image NVARCHAR(255) NULL;
END
GO

IF OBJECT_ID('CartItems', 'U') IS NULL
BEGIN
    CREATE TABLE CartItems (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_CartItems_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id)
    );
END
GO

IF OBJECT_ID('ShippingMethods', 'U') IS NULL
BEGIN
    CREATE TABLE ShippingMethods (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Price DECIMAL(18, 2) NOT NULL,
        EstimatedDays NVARCHAR(50),
        IsActive BIT DEFAULT 1
    );
END
GO

IF OBJECT_ID('Coupons', 'U') IS NULL
BEGIN
    CREATE TABLE Coupons (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code VARCHAR(50) UNIQUE NOT NULL,
        DiscountType VARCHAR(20) NOT NULL,
        Value DECIMAL(18, 2) NOT NULL,
        ExpiryDate DATE NOT NULL
    );
END
GO

IF OBJECT_ID('SalesOrders', 'U') IS NULL
BEGIN
    CREATE TABLE SalesOrders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderCode VARCHAR(50) UNIQUE NOT NULL,
        UserId INT FOREIGN KEY REFERENCES Users(Id),
        CustomerName NVARCHAR(100),
        ShippingAddress NVARCHAR(MAX),
        PhoneNumber VARCHAR(20),
        SubTotal DECIMAL(18, 2) DEFAULT 0,
        ShippingFee DECIMAL(18, 2) DEFAULT 0,
        Discount DECIMAL(18, 2) DEFAULT 0,
        TotalAmount DECIMAL(18, 2) DEFAULT 0,
        Status VARCHAR(20) DEFAULT 'Pending',
        CreatedAt DATETIME DEFAULT GETDATE(),
        ShippingMethodId INT NULL,
        CouponCode VARCHAR(50) NULL
    );
END
ELSE
BEGIN
    IF COL_LENGTH('SalesOrders', 'PhoneNumber') IS NULL
        ALTER TABLE SalesOrders ADD PhoneNumber VARCHAR(20) NULL;
    IF COL_LENGTH('SalesOrders', 'SubTotal') IS NULL
        ALTER TABLE SalesOrders ADD SubTotal DECIMAL(18, 2) DEFAULT 0;
    IF COL_LENGTH('SalesOrders', 'ShippingFee') IS NULL
        ALTER TABLE SalesOrders ADD ShippingFee DECIMAL(18, 2) DEFAULT 0;
    IF COL_LENGTH('SalesOrders', 'Discount') IS NULL
        ALTER TABLE SalesOrders ADD Discount DECIMAL(18, 2) DEFAULT 0;
    IF COL_LENGTH('SalesOrders', 'TotalAmount') IS NULL
        ALTER TABLE SalesOrders ADD TotalAmount DECIMAL(18, 2) DEFAULT 0;
    IF COL_LENGTH('SalesOrders', 'Status') IS NULL
        ALTER TABLE SalesOrders ADD Status VARCHAR(20) DEFAULT 'Pending';
    IF COL_LENGTH('SalesOrders', 'CreatedAt') IS NULL
        ALTER TABLE SalesOrders ADD CreatedAt DATETIME DEFAULT GETDATE();
    IF COL_LENGTH('SalesOrders', 'ShippingMethodId') IS NULL
        ALTER TABLE SalesOrders ADD ShippingMethodId INT NULL;
    IF COL_LENGTH('SalesOrders', 'CouponCode') IS NULL
        ALTER TABLE SalesOrders ADD CouponCode VARCHAR(50) NULL;
END
GO

IF OBJECT_ID('SalesOrderLines', 'U') IS NULL
BEGIN
    CREATE TABLE SalesOrderLines (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id) ON DELETE CASCADE,
        ProductId INT FOREIGN KEY REFERENCES Products(Id),
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        LineTotal DECIMAL(18, 2) NOT NULL
    );
END
ELSE
BEGIN
    IF COL_LENGTH('SalesOrderLines', 'LineTotal') IS NULL
        ALTER TABLE SalesOrderLines ADD LineTotal DECIMAL(18, 2) NOT NULL DEFAULT 0;
END
GO

IF OBJECT_ID('ReturnOrders', 'U') IS NULL
BEGIN
    CREATE TABLE ReturnOrders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
        Reason NVARCHAR(MAX),
        RefundAmount DECIMAL(18, 2),
        Status VARCHAR(20) DEFAULT 'Requested',
        RequestedAt DATETIME DEFAULT GETDATE(),
        ProcessedAt DATETIME NULL,
        ProcessedBy INT NULL
    );
END
ELSE
BEGIN
    IF COL_LENGTH('ReturnOrders', 'Status') IS NULL
        ALTER TABLE ReturnOrders ADD Status VARCHAR(20) DEFAULT 'Requested';
    IF COL_LENGTH('ReturnOrders', 'RequestedAt') IS NULL
        ALTER TABLE ReturnOrders ADD RequestedAt DATETIME DEFAULT GETDATE();
    IF COL_LENGTH('ReturnOrders', 'ProcessedAt') IS NULL
        ALTER TABLE ReturnOrders ADD ProcessedAt DATETIME NULL;
    IF COL_LENGTH('ReturnOrders', 'ProcessedBy') IS NULL
        ALTER TABLE ReturnOrders ADD ProcessedBy INT NULL;
END
GO

IF OBJECT_ID('FK_ReturnOrders_Users', 'F') IS NULL AND COL_LENGTH('ReturnOrders', 'ProcessedBy') IS NOT NULL
BEGIN
    ALTER TABLE ReturnOrders
    ADD CONSTRAINT FK_ReturnOrders_Users
    FOREIGN KEY (ProcessedBy) REFERENCES Users(Id);
END
GO

IF OBJECT_ID('ReturnOrderLogs', 'U') IS NULL
BEGIN
    CREATE TABLE ReturnOrderLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ReturnOrderId INT NOT NULL,
        OldStatus VARCHAR(20) NULL,
        NewStatus VARCHAR(20) NOT NULL,
        Note NVARCHAR(MAX) NULL,
        ChangedBy INT NULL,
        ChangedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_ReturnOrderLogs_ReturnOrders FOREIGN KEY (ReturnOrderId) REFERENCES ReturnOrders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_ReturnOrderLogs_Users FOREIGN KEY (ChangedBy) REFERENCES Users(Id)
    );
END
GO

IF OBJECT_ID('FK_SalesOrders_ShippingMethods', 'F') IS NULL AND COL_LENGTH('SalesOrders', 'ShippingMethodId') IS NOT NULL
BEGIN
    ALTER TABLE SalesOrders
    ADD CONSTRAINT FK_SalesOrders_ShippingMethods
    FOREIGN KEY (ShippingMethodId) REFERENCES ShippingMethods(Id);
END
GO

DECLARE @adminPass NVARCHAR(255) = '$2b$10$Mcqth4/K0TcaLJZuvP0zu.3avPwR4ei7KkBVd4j.EUal8BEl2wCC6';

IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, Password, FullName, Email, Role)
    VALUES ('admin', @adminPass, N'Quản trị Demo', 'admin@example.com', 'admin');
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'customer')
BEGIN
    INSERT INTO Users (Username, Password, FullName, Email, Role)
    VALUES ('customer', @adminPass, N'Khách hàng Demo', 'customer@example.com', 'user');
END
GO

IF NOT EXISTS (SELECT 1 FROM ShippingMethods)
BEGIN
    INSERT INTO ShippingMethods (Name, Price, EstimatedDays, IsActive) VALUES
    (N'Giao nhanh', 30000, N'1-2 ngày', 1),
    (N'Giao tiết kiệm', 15000, N'3-5 ngày', 1),
    (N'Hỏa tốc', 50000, N'Trong ngày', 1);
END
GO

IF NOT EXISTS (SELECT 1 FROM Coupons WHERE Code = 'SALE10')
BEGIN
    INSERT INTO Coupons (Code, DiscountType, Value, ExpiryDate)
    VALUES ('SALE10', 'PERCENT', 10, DATEADD(day, 365, GETDATE()));
END

IF NOT EXISTS (SELECT 1 FROM Coupons WHERE Code = 'SHIP30')
BEGIN
    INSERT INTO Coupons (Code, DiscountType, Value, ExpiryDate)
    VALUES ('SHIP30', 'AMOUNT', 30000, DATEADD(day, 365, GETDATE()));
END
GO

IF NOT EXISTS (SELECT 1 FROM Products WHERE Sku = 'FASH-001')
BEGIN
    INSERT INTO Products (Name, Sku, Price, StockQuantity, Description, Category, Image) VALUES
    (N'Áo thun oversize', 'FASH-001', 199000, 120, N'Chất cotton mềm', 'fashion',
     'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80'),
    (N'Quần jean slim', 'FASH-002', 349000, 80, N'Trang phục hằng ngày', 'fashion',
     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'),
    (N'iPhone 15 Pro', 'PHONE-001', 28990000, 25, N'Điện thoại cao cấp', 'phone',
     'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'),
    (N'Galaxy S24', 'PHONE-002', 21990000, 30, N'Android cao cấp', 'phone',
     'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'),
    (N'MacBook Air M3', 'LAP-001', 28900000, 12, N'Laptop nhẹ, pin lâu', 'laptop',
     'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'),
    (N'Vivobook 15', 'LAP-002', 15900000, 18, N'Laptop văn phòng', 'laptop',
     'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'),
    (N'Nồi chiên không dầu', 'HOME-001', 1290000, 40, N'Tiết kiệm dầu mỡ', 'home',
     'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80'),
    (N'Máy hút bụi', 'HOME-002', 1890000, 22, N'Làm sạch nhanh', 'home',
     'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'),
    (N'Lego City', 'TOY-001', 899000, 35, N'Đồ chơi sáng tạo', 'toy',
     'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80'),
    (N'Búp bê', 'TOY-002', 299000, 60, N'Đồ chơi trẻ em', 'toy',
     'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80'),
    (N'Sách lập trình', 'BOOK-001', 199000, 70, N'Tài liệu học tập', 'book',
     'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'),
    (N'Sách kỹ năng', 'BOOK-002', 159000, 55, N'Phát triển bản thân', 'book',
     'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80');
END
GO

UPDATE Products SET Category = 'other' WHERE Category IS NULL;
GO

DECLARE @seedUserId INT = (SELECT Id FROM Users WHERE Username = 'customer');
DECLARE @shipId INT = (SELECT TOP 1 Id FROM ShippingMethods ORDER BY Id);
DECLARE @phone VARCHAR(20) = '0900000000';
DECLARE @address NVARCHAR(255) = N'123 Nguyễn Trãi, Hà Nội';

IF @seedUserId IS NOT NULL AND @shipId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SalesOrders WHERE OrderCode = 'SEED-001')
BEGIN
    DECLARE @p1 INT = (SELECT Id FROM Products WHERE Sku = 'PHONE-001');
    DECLARE @p2 INT = (SELECT Id FROM Products WHERE Sku = 'BOOK-001');
    DECLARE @price1 DECIMAL(18,2) = (SELECT Price FROM Products WHERE Id = @p1);
    DECLARE @price2 DECIMAL(18,2) = (SELECT Price FROM Products WHERE Id = @p2);
    DECLARE @subTotal DECIMAL(18,2) = ISNULL(@price1, 0) + ISNULL(@price2, 0);
    DECLARE @shipFee DECIMAL(18,2) = (SELECT Price FROM ShippingMethods WHERE Id = @shipId);
    DECLARE @total DECIMAL(18,2) = @subTotal + @shipFee;

    INSERT INTO SalesOrders
        (OrderCode, UserId, CustomerName, PhoneNumber, ShippingAddress, SubTotal, ShippingFee, Discount, TotalAmount, Status, CreatedAt, ShippingMethodId, CouponCode)
    VALUES
        ('SEED-001', @seedUserId, N'Khách hàng Demo', @phone, @address, @subTotal, @shipFee, 0, @total, 'Completed', DATEADD(day, -2, GETDATE()), @shipId, NULL);

    DECLARE @orderId INT = SCOPE_IDENTITY();
    IF @p1 IS NOT NULL
        INSERT INTO SalesOrderLines (OrderId, ProductId, Quantity, UnitPrice, LineTotal)
        VALUES (@orderId, @p1, 1, @price1, @price1);
    IF @p2 IS NOT NULL
        INSERT INTO SalesOrderLines (OrderId, ProductId, Quantity, UnitPrice, LineTotal)
        VALUES (@orderId, @p2, 1, @price2, @price2);
END
GO
