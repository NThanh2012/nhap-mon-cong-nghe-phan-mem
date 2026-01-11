const { sql } = require('../config/database');

// Lấy danh sách tất cả phương thức vận chuyển đang hoạt động
async function getAllShippingMethods() {
    try {
        const req = new sql.Request();
        const query = "SELECT * FROM ShippingMethods WHERE IsActive = 1";
        const result = await req.query(query);
        return result.recordset;
    } catch (err) {
        console.log("Lỗi Model getAllShippingMethods:", err);
        throw err;
    }
}

// Lấy chi tiết giá tiền của 1 phương thức
async function getShippingMethodById(id) {
    try {
        const req = new sql.Request();
        req.input('id', sql.Int, id);
        const query = "SELECT * FROM ShippingMethods WHERE Id = @id";
        const result = await req.query(query);
        return result.recordset[0]; 
    } catch (err) {
        console.log("Lỗi Model getShippingMethodById:", err);
        throw err;
    }
}

module.exports = { getAllShippingMethods, getShippingMethodById };