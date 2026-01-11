const orderModel = require('../models/orderModel');

// 1. Đặt hàng
async function createNewOrder(req, res) {
    try {
        const userId = req.user ? (req.user.Id || req.user.id) : null;
        if (!userId) return res.status(401).json({ message: "Lỗi xác thực ID" });

        const { shippingMethodId, shippingAddress, couponCode, phone } = req.body;

        if (!shippingMethodId || !shippingAddress || !phone) {
            return res.status(400).json({ message: "Thiếu: Địa chỉ, SĐT hoặc gói Ship!" });
        }

        const result = await orderModel.createOrder(userId, shippingMethodId, shippingAddress, couponCode, phone);

        res.status(201).json({
            message: "🎉 Đặt hàng thành công!",
            orderCode: result.orderCode,
            orderId: result.orderId,
            totalAmount: result.total
        });
    } catch (err) {
        console.log("Lỗi:", err);
        res.status(400).json({ message: err.message || "Lỗi hệ thống" });
    }
}

// 2. Xem đơn của tôi
async function getMyOrders(req, res) {
    try {
        const userId = req.user ? (req.user.Id || req.user.id) : null;
        const orders = await orderModel.getOrdersByUserId(userId);
        res.status(200).json({ message: "Thành công", data: orders });
    } catch (err) { res.status(500).json({ message: "Lỗi hệ thống" }); }
}

// 3. Admin xem tất cả
async function getAllOrdersAdmin(req, res) {
    try {
        const orders = await orderModel.getAllOrders();
        res.status(200).json({ message: "Thành công", data: orders });
    } catch (err) { res.status(500).json({ message: "Lỗi hệ thống" }); }
}

// 4. Admin cập nhật trạng thái
async function updateStatusAdmin(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await orderModel.updateOrderStatus(id, status);
        if (result.rowsAffected[0] > 0) res.status(200).json({ message: "Đã cập nhật trạng thái" });
        else res.status(404).json({ message: "Không tìm thấy đơn" });
    } catch (err) { res.status(500).json({ message: "Lỗi hệ thống" }); }
}

// 5. Xem chi tiết
async function getOrderDetail(req, res) {
    try {
        const { id } = req.params;
        const order = await orderModel.getOrderById(id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });
        res.status(200).json(order);
    } catch (err) { res.status(500).json({ message: "Lỗi hệ thống" }); }
}

module.exports = { createNewOrder, getMyOrders, getAllOrdersAdmin, updateStatusAdmin, getOrderDetail };