const { sql, config } = require('../config/database');

async function getDashboardStats(req, res) {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        
        // 1. Tổng doanh thu (Chỉ tính đơn đã hoàn thành 'Completed')
        const totalRevenue = await pool.request().query(
            "SELECT SUM(TotalAmount) as total FROM SalesOrders WHERE Status = 'Completed'"
        );

        // 2. Tổng số đơn hàng
        const totalOrders = await pool.request().query("SELECT COUNT(*) as count FROM SalesOrders");

        // 3. Tổng số khách hàng
        const totalUsers = await pool.request().query(
            "SELECT COUNT(*) as count FROM Users WHERE Role IN ('user', 'customer')"
        );

        // 4. Thong ke tra hang
        const totalReturns = await pool.request().query("SELECT COUNT(*) as count FROM ReturnOrders");
        const pendingReturns = await pool.request().query("SELECT COUNT(*) as count FROM ReturnOrders WHERE Status = 'Requested'");
        const refundedAmount = await pool.request().query(
            "SELECT ISNULL(SUM(RefundAmount), 0) as total FROM ReturnOrders WHERE Status = 'Refunded'"
        );
        const returnsByStatus = await pool.request().query(
            "SELECT Status, COUNT(*) as count FROM ReturnOrders GROUP BY Status"
        );

        // 4. Dữ liệu biểu đồ (Doanh thu theo ngày trong 7 ngày gần nhất)
        const chartData = await pool.request().query(`
            WITH Daily AS (
                SELECT 
                    CAST(CreatedAt AS DATE) as date, 
                    SUM(TotalAmount) as revenue 
                FROM SalesOrders 
                WHERE Status = 'Completed'
                GROUP BY CAST(CreatedAt AS DATE)
            )
            SELECT * FROM (
                SELECT TOP 7 * FROM Daily ORDER BY date DESC
            ) d
            ORDER BY date ASC
        `);

        res.status(200).json({
            revenue: totalRevenue.recordset[0].total || 0,
            orders: totalOrders.recordset[0].count,
            users: totalUsers.recordset[0].count,
            returns: {
                total: totalReturns.recordset[0].count,
                pending: pendingReturns.recordset[0].count,
                refundedAmount: refundedAmount.recordset[0].total || 0,
                byStatus: returnsByStatus.recordset
            },
            chart: chartData.recordset
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê" });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // Ví dụ: 'Completed', 'Cancelled'

        const pool = await new sql.ConnectionPool(config).connect();
        await pool.request()
            .input('id', sql.Int, orderId)
            .input('status', sql.NVarChar, status)
            .query("UPDATE SalesOrders SET Status = @status WHERE Id = @id");

        res.status(200).json({ message: "Cập nhật trạng thái thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật đơn hàng" });
    }
}

module.exports = { getDashboardStats, updateOrderStatus };
