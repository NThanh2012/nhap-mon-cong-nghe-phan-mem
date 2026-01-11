const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const Header = req.header('Authorization');
    if(!Header) 
        return res.status(401).json({message : "Không tìm thấy token"});
    
    const token = Header.split(" ")[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch(err) {
        return res.status(403).json({message: "Token sai hoặc hết hạn"});
    }
}

const checkAdmin = (req, res, next) => {
    // 👇 Thêm dòng log này để nhìn thấy tận mắt Token chứa gì
    console.log("👮 Dữ liệu trong Token:", req.user);

    // 👇 SỬA ĐOẠN NÀY: Lấy Role dù viết hoa hay thường
    const userRole = req.user.Role || req.user.role;

    if (userRole === 'admin') {
        next(); // Duyệt! Mời sếp đi qua
    } else {
        return res.status(403).json({ message: "Bạn chỉ là Khách hàng, không có quyền Admin!" });
    }
}

module.exports = { verifyToken, checkAdmin };