const { sql } = require('../config/database');

// 1. Tạo đơn hàng (Transaction an toàn)
async function createOrder(userId, shippingMethodId, shippingAddress, couponCode, phone) {
    const pool = await new sql.ConnectionPool(require('../config/database').config).connect();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const req = new sql.Request(transaction);

        // A. Lấy tên User
        req.input('uId', sql.Int, userId);
        const userRes = await req.query("SELECT FullName FROM Users WHERE Id = @uId");
        const customerName = userRes.recordset.length > 0 ? userRes.recordset[0].FullName : 'Khách';

        // B. Lấy giỏ hàng
        const cartItems = await req.query(`
            SELECT c.ProductId, c.Quantity, p.Price, p.StockQuantity
            FROM CartItems c JOIN Products p ON c.ProductId = p.Id
            WHERE c.UserId = @uId
        `);
        if (cartItems.recordset.length === 0) throw new Error("Giỏ hàng trống!");

        // C. Tính tiền hàng & Check tồn kho
        let subTotal = 0;
        for (const item of cartItems.recordset) {
            if (item.Quantity > item.StockQuantity) throw new Error(`Sản phẩm ID ${item.ProductId} hết hàng!`);
            subTotal += item.Price * item.Quantity;
        }

        // D. Tính Ship
        const reqShip = new sql.Request(transaction);
        reqShip.input('shipId', sql.Int, shippingMethodId);
        const shipRes = await reqShip.query("SELECT Price FROM ShippingMethods WHERE Id = @shipId");
        if (shipRes.recordset.length === 0) throw new Error("Phương thức vận chuyển lỗi!");
        const shippingFee = shipRes.recordset[0].Price;

        // E. Tính Coupon (Nếu có)
        let discountAmount = 0;
        if (couponCode) {
            try {
                const reqCoupon = new sql.Request(transaction);
                reqCoupon.input('code', sql.VarChar, couponCode);
                const couponRes = await reqCoupon.query("SELECT * FROM Coupons WHERE Code = @code");
                if (couponRes.recordset.length > 0) {
                    const coupon = couponRes.recordset[0];
                    if (new Date() > new Date(coupon.ExpiryDate)) throw new Error("Mã hết hạn!");
                    
                    if (coupon.DiscountType === 'PERCENT') discountAmount = (subTotal * coupon.Value) / 100;
                    else discountAmount = coupon.Value;
                    
                    if (discountAmount > subTotal) discountAmount = subTotal;
                }
            } catch (e) { console.log("Lỗi Coupon hoặc chưa có bảng Coupon"); }
        }

        // F. Chốt đơn & Insert
        const grandTotal = subTotal + shippingFee - discountAmount;
        const orderCode = 'ORD-' + Date.now(); 

        const reqOrder = new sql.Request(transaction);
        reqOrder.input('OrderCode', sql.VarChar, orderCode);
        reqOrder.input('UserId', sql.Int, userId);
        reqOrder.input('CustomerName', sql.NVarChar, customerName);
        reqOrder.input('Phone', sql.VarChar, phone);
        reqOrder.input('Address', sql.NVarChar, shippingAddress);
        reqOrder.input('SubTotal', sql.Decimal(18,2), subTotal);
        reqOrder.input('ShipFee', sql.Decimal(18,2), shippingFee);
        reqOrder.input('Discount', sql.Decimal(18,2), discountAmount);
        reqOrder.input('Total', sql.Decimal(18,2), grandTotal);
        reqOrder.input('ShipMethod', sql.Int, shippingMethodId);
        reqOrder.input('CoupCode', sql.VarChar, couponCode || null);

        const orderResult = await reqOrder.query(`
            INSERT INTO SalesOrders 
            (OrderCode, UserId, CustomerName, PhoneNumber, ShippingAddress, SubTotal, ShippingFee, Discount, TotalAmount, Status, CreatedAt, ShippingMethodId, CouponCode)
            OUTPUT INSERTED.Id
            VALUES 
            (@OrderCode, @UserId, @CustomerName, @Phone, @Address, @SubTotal, @ShipFee, @Discount, @Total, 'Pending', GETDATE(), @ShipMethod, @CoupCode);
        `);
        const newOrderId = orderResult.recordset[0].Id;

        // G. Insert Chi tiết & Trừ kho
        for (const item of cartItems.recordset) {
            const lineTotal = item.Quantity * item.Price;
            const reqLine = new sql.Request(transaction);
            reqLine.input('orderId', sql.Int, newOrderId);
            reqLine.input('pId', sql.Int, item.ProductId);
            reqLine.input('qty', sql.Int, item.Quantity);
            reqLine.input('price', sql.Decimal(18, 2), item.Price);
            reqLine.input('lineTotal', sql.Decimal(18, 2), lineTotal); 

            // 3. Sửa câu lệnh INSERT để thêm cột LineTotal
            await reqLine.query(`
                INSERT INTO SalesOrderLines (OrderId, ProductId, Quantity, UnitPrice, LineTotal) 
                VALUES (@orderId, @pId, @qty, @price, @lineTotal)
            `);
            await reqLine.query(`UPDATE Products SET StockQuantity = StockQuantity - @qty WHERE Id = @pId`);
        }

        // H. Xóa giỏ
        const reqClear = new sql.Request(transaction);
        reqClear.input('delUserId', sql.Int, userId);
        await reqClear.query("DELETE FROM CartItems WHERE UserId = @delUserId");

        await transaction.commit();
        return { orderId: newOrderId, orderCode, total: grandTotal };

    } catch (err) {
        await transaction.rollback();
        throw err;
    } finally { pool.close(); }
}

async function getOrdersByUserId(userId) {
    try {
        const req = new sql.Request();
        req.input('UserId', sql.Int, userId);
        const result = await req.query("SELECT * FROM SalesOrders WHERE UserId = @UserId ORDER BY CreatedAt DESC");
        return result.recordset; 
    } catch (err) { throw err; }
}

async function getAllOrders() {
    try {
        const req = new sql.Request();
        const result = await req.query("SELECT * FROM SalesOrders ORDER BY CreatedAt DESC");
        return result.recordset;
    } catch (err) { throw err; }
}

async function updateOrderStatus(id, status) {
    try {
        const req = new sql.Request();
        req.input('Id', sql.Int, id);
        req.input('Status', sql.VarChar, status);
        return await req.query("UPDATE SalesOrders SET Status = @Status WHERE Id = @Id");
    } catch (err) { throw err; }
}

async function getOrderById(orderId) {
    try {
        const req = new sql.Request();
        req.input('Id', sql.Int, orderId);
        const orderResult = await req.query("SELECT * FROM SalesOrders WHERE Id = @Id");
        if (orderResult.recordset.length === 0) return null;
        
        const itemsResult = await req.query(`
            SELECT L.*, P.Name as ProductName, P.Image 
            FROM SalesOrderLines L JOIN Products P ON L.ProductId = P.Id 
            WHERE L.OrderId = @Id
        `);
        return { ...orderResult.recordset[0], items: itemsResult.recordset };
    } catch (err) { throw err; }
}

module.exports = { createOrder, getOrdersByUserId, getAllOrders, updateOrderStatus, getOrderById };