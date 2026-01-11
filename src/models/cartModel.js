const { sql } = require('../config/database');

// 1. Lấy giỏ hàng (Có kèm thông tin tồn kho StockQuantity)
async function getCartByUserId(userId) {
    try {
        const req = new sql.Request();
        req.input('userId', sql.Int, userId);
        const query = `
            SELECT 
                c.Id as CartItemId,
                c.ProductId,
                c.Quantity,
                p.Name as ProductName,
                p.Price,
                p.Image,
                p.StockQuantity, 
                (p.Price * c.Quantity) as TotalLine
            FROM CartItems c
            JOIN Products p ON c.ProductId = p.Id
            WHERE c.UserId = @userId
        `;
        const result = await req.query(query);
        return result.recordset;
    } catch (err) {
        throw err;
    }
}

// 2. Thêm vào giỏ (Có kiểm tra tồn kho)
async function addToCart(userId, productId, quantity) {
    try {
        const req = new sql.Request();
        req.input('userId', sql.Int, userId);
        req.input('productId', sql.Int, productId);
        req.input('quantity', sql.Int, quantity);

        // Logic: Kiểm tra xem cộng thêm vào có bị vượt quá kho không
        const query = `
            DECLARE @CurrentStock INT;
            DECLARE @CurrentCartQty INT;

            SELECT @CurrentStock = StockQuantity FROM Products WHERE Id = @productId;

            SELECT @CurrentCartQty = ISNULL(SUM(Quantity), 0) 
            FROM CartItems 
            WHERE UserId = @userId AND ProductId = @productId;

            IF (@CurrentCartQty + @quantity) > @CurrentStock
            BEGIN
                THROW 50000, 'Kho khong du hang', 1;
            END

            IF EXISTS (SELECT * FROM CartItems WHERE UserId = @userId AND ProductId = @productId)
            BEGIN
                UPDATE CartItems 
                SET Quantity = Quantity + @quantity 
                WHERE UserId = @userId AND ProductId = @productId
            END
            ELSE
            BEGIN
                INSERT INTO CartItems (UserId, ProductId, Quantity)
                VALUES (@userId, @productId, @quantity)
            END
        `;
        await req.query(query);
        return { message: "Đã cập nhật giỏ hàng" };
    } catch (err) {
        throw err;
    }
}

// 3. Xóa món
async function removeFromCart(cartItemId, userId) {
    try {
        const req = new sql.Request();
        req.input('id', sql.Int, cartItemId);
        req.input('userId', sql.Int, userId);
        
        const query = "DELETE FROM CartItems WHERE Id = @id AND UserId = @userId";
        return await req.query(query);
    } catch (err) {
        throw err;
    }
}

// 4. Xóa sạch giỏ
async function clearCart(userId) {
    try {
        const req = new sql.Request();
        req.input('userId', sql.Int, userId);
        await req.query("DELETE FROM CartItems WHERE UserId = @userId");
    } catch (err) {
        throw err;
    }
}

module.exports = { getCartByUserId, addToCart, removeFromCart, clearCart };