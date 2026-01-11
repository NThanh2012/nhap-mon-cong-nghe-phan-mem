// 👇 1. KHAI BÁO SQL VÀ CONFIG TẠI ĐÂY (BẮT BUỘC)
const { sql, config } = require('../config/database'); 
const cartModel = require('../models/cartModel');

// 1. Thêm món vào giỏ
async function addItemToCart(req, res) {
    try {
        const userId = req.user ? (req.user.Id || req.user.id) : null;

        if (!userId) {
            return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy User ID." });
        }

        const { productId, quantity } = req.body;
        
        if (!productId) return res.status(400).json({ message: "Thiếu productId" });

        const qty = quantity ? parseInt(quantity) : 1;

        await cartModel.addToCart(userId, productId, qty);
        
        res.status(200).json({ message: "Đã thêm vào giỏ hàng thành công" });

    } catch (err) {
        console.log("Lỗi Controller Cart:", err);
        if (err.message && err.message.includes('Kho khong du hang')) {
            return res.status(400).json({ message: "Kho không đủ hàng để thêm số lượng này" });
        }
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
}

// 2. Xem giỏ hàng
async function getMyCart(req, res) {
    try {
        const userId = req.user ? (req.user.Id || req.user.id) : null;
        if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });

        const items = await cartModel.getCartByUserId(userId);
        
        const grandTotal = items.reduce((sum, item) => sum + item.TotalLine, 0);

        res.status(200).json({
            message: "Lấy giỏ hàng thành công",
            cartItems: items,
            grandTotal: grandTotal
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
}

// 3. Xóa món (Sử dụng SQL trực tiếp để debug lỗi 500)
async function removeFromCart(req, res) {
    try {
        const { id } = req.params; 
        console.log("🔥 Đang xóa CartItem ID:", id); 

        // 👇 Cần biến sql và config (đã khai báo ở dòng 1)
        const pool = await new sql.ConnectionPool(config).connect();
        
        // Kiểm tra tồn tại
        const check = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM CartItems WHERE Id = @id");

        if (check.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ để xóa" });
        }

        // Thực hiện xóa
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM CartItems WHERE Id = @id");

        res.status(200).json({ message: "Đã xóa thành công!" });

    } catch (error) {
        console.error("❌ Lỗi xóa giỏ hàng:", error); 
        res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
    }
}

// Xuất khẩu các hàm
module.exports = { getMyCart, addItemToCart, removeFromCart };