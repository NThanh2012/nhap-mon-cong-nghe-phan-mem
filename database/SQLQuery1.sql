USE master;
GO

IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'SalesOrderDB')
BEGIN
    ALTER DATABASE SalesOrderDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SalesOrderDB;
END
GO

CREATE DATABASE SalesOrderDB;
GO

USE SalesOrderDB;
GO

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100),
    Email NVARCHAR(255),
    Role VARCHAR(20) DEFAULT 'user',
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Products (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Sku VARCHAR(50) UNIQUE NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    Description NVARCHAR(MAX),
    Image NVARCHAR(255),
    Category NVARCHAR(50) DEFAULT 'other'
);

CREATE TABLE ShippingMethods (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    EstimatedDays NVARCHAR(50),
    IsActive BIT DEFAULT 1
);

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
    CouponCode VARCHAR(50) NULL,
    CONSTRAINT FK_SalesOrders_ShippingMethods FOREIGN KEY (ShippingMethodId) REFERENCES ShippingMethods(Id)
);

CREATE TABLE SalesOrderLines (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id) ON DELETE CASCADE,
    ProductId INT FOREIGN KEY REFERENCES Products(Id),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL,
    LineTotal DECIMAL(18, 2) NOT NULL
);

CREATE TABLE CartItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    AddedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CartItems_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id)
);

CREATE TABLE Payments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Method VARCHAR(50),
    Amount DECIMAL(18, 2) NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending',
    TransactionId VARCHAR(100),
    PaidAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Shipments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Carrier VARCHAR(50),
    TrackingNumber VARCHAR(50),
    ShippedAt DATETIME,
    DeliveredAt DATETIME,
    SLAFlag BIT DEFAULT 0
);

CREATE TABLE ReturnOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES SalesOrders(Id),
    Reason NVARCHAR(MAX),
    RefundAmount DECIMAL(18, 2),
    Status VARCHAR(20) DEFAULT 'Requested',
    RequestedAt DATETIME DEFAULT GETDATE(),
    ProcessedAt DATETIME NULL,
    ProcessedBy INT NULL,
    CONSTRAINT FK_ReturnOrders_Users FOREIGN KEY (ProcessedBy) REFERENCES Users(Id)
);

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
