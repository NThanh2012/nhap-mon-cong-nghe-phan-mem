const { sql, config } = require('../config/database');

async function createReturnLog(pool, returnId, oldStatus, newStatus, note, changedBy) {
  await pool.request()
    .input('returnId', sql.Int, returnId)
    .input('oldStatus', sql.VarChar, oldStatus || null)
    .input('newStatus', sql.VarChar, newStatus)
    .input('note', sql.NVarChar, note || null)
    .input('changedBy', sql.Int, changedBy || null)
    .query(`
      INSERT INTO ReturnOrderLogs (ReturnOrderId, OldStatus, NewStatus, Note, ChangedBy, ChangedAt)
      VALUES (@returnId, @oldStatus, @newStatus, @note, @changedBy, GETDATE())
    `);
}

async function createReturnRequest(userId, orderId, reason, refundAmount) {
  const pool = await new sql.ConnectionPool(config).connect();
  try {
    const orderRes = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query('SELECT Id, UserId, TotalAmount, Status FROM SalesOrders WHERE Id = @orderId');

    if (orderRes.recordset.length === 0) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    const order = orderRes.recordset[0];
    if (order.UserId !== userId) {
      throw new Error('Bạn không có quyền với đơn hàng này');
    }

    if (order.Status !== 'Completed') {
      throw new Error('Chỉ trả hàng khi đơn đã hoàn thành');
    }

    const existsRes = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query('SELECT Id FROM ReturnOrders WHERE OrderId = @orderId');
    if (existsRes.recordset.length > 0) {
      throw new Error('Đơn hàng đã có yêu cầu trả hàng');
    }

    let refund = refundAmount !== undefined && refundAmount !== null ? parseFloat(refundAmount) : order.TotalAmount;
    if (Number.isNaN(refund) || refund <= 0) {
      refund = order.TotalAmount;
    }
    if (refund > order.TotalAmount) {
      refund = order.TotalAmount;
    }

    const insertRes = await pool.request()
      .input('orderId', sql.Int, orderId)
      .input('reason', sql.NVarChar, reason || null)
      .input('refund', sql.Decimal(18, 2), refund)
      .query(`
        INSERT INTO ReturnOrders (OrderId, Reason, RefundAmount, Status, RequestedAt)
        OUTPUT INSERTED.Id
        VALUES (@orderId, @reason, @refund, 'Requested', GETDATE())
      `);

    const returnId = insertRes.recordset[0].Id;
    await createReturnLog(pool, returnId, null, 'Requested', reason || 'Yêu cầu từ khách hàng', userId);
    return { id: returnId, refundAmount: refund };
  } finally {
    pool.close();
  }
}

async function getReturnsByUser(userId) {
  const pool = await new sql.ConnectionPool(config).connect();
  try {
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.*, o.OrderCode, o.TotalAmount
        FROM ReturnOrders r
        JOIN SalesOrders o ON r.OrderId = o.Id
        WHERE o.UserId = @userId
        ORDER BY r.RequestedAt DESC
      `);
    return result.recordset;
  } finally {
    pool.close();
  }
}

async function getAllReturns() {
  const pool = await new sql.ConnectionPool(config).connect();
  try {
    const result = await pool.request().query(`
      SELECT r.*, o.OrderCode, o.TotalAmount, u.Username, u.FullName
      FROM ReturnOrders r
      JOIN SalesOrders o ON r.OrderId = o.Id
      LEFT JOIN Users u ON o.UserId = u.Id
      ORDER BY r.RequestedAt DESC
    `);
    return result.recordset;
  } finally {
    pool.close();
  }
}

async function getReturnDetail(id) {
  const pool = await new sql.ConnectionPool(config).connect();
  try {
    const returnRes = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT r.*, o.OrderCode, o.TotalAmount, u.Username, u.FullName
        FROM ReturnOrders r
        JOIN SalesOrders o ON r.OrderId = o.Id
        LEFT JOIN Users u ON o.UserId = u.Id
        WHERE r.Id = @id
      `);

    if (returnRes.recordset.length === 0) return null;

    const logsRes = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT l.*, u.Username, u.FullName
        FROM ReturnOrderLogs l
        LEFT JOIN Users u ON l.ChangedBy = u.Id
        WHERE l.ReturnOrderId = @id
        ORDER BY l.ChangedAt DESC
      `);

    return { ...returnRes.recordset[0], logs: logsRes.recordset };
  } finally {
    pool.close();
  }
}

async function updateReturnStatus(id, status, note, refundAmount, adminId) {
  const pool = await new sql.ConnectionPool(config).connect();
  try {
    const currentRes = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT r.Status, r.RefundAmount, o.TotalAmount
        FROM ReturnOrders r
        JOIN SalesOrders o ON r.OrderId = o.Id
        WHERE r.Id = @id
      `);

    if (currentRes.recordset.length === 0) return null;

    const current = currentRes.recordset[0];
    let refund = current.RefundAmount;
    if (refundAmount !== undefined && refundAmount !== null) {
      const parsed = parseFloat(refundAmount);
      if (!Number.isNaN(parsed) && parsed > 0) {
        refund = parsed > current.TotalAmount ? current.TotalAmount : parsed;
      }
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .input('refund', sql.Decimal(18, 2), refund)
      .input('processedBy', sql.Int, adminId || null)
      .query(`
        UPDATE ReturnOrders
        SET Status = @status,
            RefundAmount = @refund,
            ProcessedAt = GETDATE(),
            ProcessedBy = @processedBy
        WHERE Id = @id
      `);

    await createReturnLog(pool, id, current.Status, status, note || null, adminId);
    return result;
  } finally {
    pool.close();
  }
}

module.exports = { createReturnRequest, getReturnsByUser, getAllReturns, getReturnDetail, updateReturnStatus };
