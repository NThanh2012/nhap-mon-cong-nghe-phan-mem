const { sql } = require('../config/database');

async function getSystemStats() {
    try {
        const req = new sql.Request();

        // 1. Doanh thu (Chỉ tính đơn Completed)
        const revenueQuery = `
            SELECT ISNULL(SUM(TotalAmount), 0) as TotalRevenue 
            FROM SalesOrders 
            WHERE Status = 'Completed'
        `;
        const revenueRes = await req.query(revenueQuery);
        const totalRevenue = revenueRes.recordset[0].TotalRevenue;

        // 2. Tổng đơn hàng
        const countRes = await req.query(`SELECT COUNT(*) as TotalOrders FROM SalesOrders`);
        const totalOrders = countRes.recordset[0].TotalOrders;

        // 3. Đơn hôm nay
        const todayRes = await req.query(`
            SELECT COUNT(*) as TodayOrders 
            FROM SalesOrders 
            WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
        `);
        const todayOrders = todayRes.recordset[0].TodayOrders;

        // 4. Trạng thái đơn
        const statusRes = await req.query(`
            SELECT Status, COUNT(*) as Count 
            FROM SalesOrders 
            GROUP BY Status
        `);

        // 5. Thong ke tra hang
        const returnsTotalRes = await req.query(`SELECT COUNT(*) as TotalReturns FROM ReturnOrders`);
        const returnsPendingRes = await req.query(`SELECT COUNT(*) as PendingReturns FROM ReturnOrders WHERE Status = 'Requested'`);
        const returnsRefundedRes = await req.query(
            `SELECT ISNULL(SUM(RefundAmount), 0) as RefundedAmount FROM ReturnOrders WHERE Status = 'Refunded'`
        );
        const returnsStatusRes = await req.query(`
            SELECT Status, COUNT(*) as Count
            FROM ReturnOrders
            GROUP BY Status
        `);

        return {
            totalRevenue,
            totalOrders,
            todayOrders,
            ordersByStatus: statusRes.recordset,
            returns: {
                total: returnsTotalRes.recordset[0].TotalReturns,
                pending: returnsPendingRes.recordset[0].PendingReturns,
                refundedAmount: returnsRefundedRes.recordset[0].RefundedAmount,
                byStatus: returnsStatusRes.recordset
            }
        };

    } catch (err) {
        throw err;
    }
}

module.exports = { getSystemStats };
