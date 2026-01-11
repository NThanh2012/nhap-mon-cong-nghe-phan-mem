const dashboardModel = require('../models/dashboardModel'); // Import Model vừa tạo

async function getDashboardStats(req, res) {
    try {
        // Gọi Model để lấy số liệu (Không cần viết SQL ở đây nữa)
        const stats = await dashboardModel.getSystemStats();

        res.status(200).json({
            message: "Lấy thống kê thành công",
            data: stats
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lỗi hệ thống thống kê" });
    }
}

module.exports = { getDashboardStats };