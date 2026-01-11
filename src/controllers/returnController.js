const returnModel = require('../models/returnModel');
const allowedStatuses = ['Requested', 'Approved', 'Refunded', 'Rejected'];

async function createReturnRequest(req, res) {
  try {
    const userId = req.user ? (req.user.Id || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Lỗi xác thực' });
    }

    const { orderId, reason, refundAmount } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Thiếu orderId' });
    }

    const result = await returnModel.createReturnRequest(userId, orderId, reason, refundAmount);
    res.status(201).json({
      message: 'Đã gửi yêu cầu trả hàng',
      returnId: result.id,
      refundAmount: result.refundAmount,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Lỗi hệ thống' });
  }
}

async function getMyReturns(req, res) {
  try {
    const userId = req.user ? (req.user.Id || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Lỗi xác thực' });
    }
    const data = await returnModel.getReturnsByUser(userId);
    res.status(200).json({ message: 'Thành công', data });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
}

async function getAllReturns(req, res) {
  try {
    const data = await returnModel.getAllReturns();
    res.status(200).json({ message: 'Thành công', data });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
}

async function getReturnDetailAdmin(req, res) {
  try {
    const { id } = req.params;
    const data = await returnModel.getReturnDetail(id);
    if (!data) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    res.status(200).json({ message: 'Thành công', data });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
}

async function updateReturnStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note, refundAmount } = req.body;
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    const adminId = req.user ? (req.user.Id || req.user.id) : null;
    const result = await returnModel.updateReturnStatus(id, status, note, refundAmount, adminId);
    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Đã cập nhật trạng thái trả hàng' });
    } else {
      res.status(400).json({ message: 'Cập nhật thất bại' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
}

module.exports = { createReturnRequest, getMyReturns, getAllReturns, getReturnDetailAdmin, updateReturnStatus };
