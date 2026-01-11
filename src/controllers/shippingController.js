const shippingModel = require('../models/shippingModel');

// 1. Lấy danh sách ship
async function getShippingMethods(req, res) {
    try {
        const data = await shippingModel.getAllShippingMethods();
        
        res.status(200).json({
            message: "Lấy danh sách vận chuyển thành công",
            data: data
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
}

// 2. Tính phí ship dựa trên ID gửi lên
async function calculateShippingFee(req, res) {
    try {
        const { methodId } = req.body;
        const method = await shippingModel.getShippingMethodById(methodId);
        
        if (method) {
            res.status(200).json({ 
                message: "Tính phí thành công",
                methodName: method.Name,
                fee: method.Price 
            });
        } else {
            res.status(404).json({ message: "Phương thức vận chuyển không tồn tại" });
        }
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi tính phí" });
    }
}

module.exports = { getShippingMethods, calculateShippingFee };