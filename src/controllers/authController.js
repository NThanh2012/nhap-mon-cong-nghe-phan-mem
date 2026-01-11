const userModel = require('../models/authModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function Register(req, res) {
    try {
        const data = req.body;
        const checkExistAcc = await userModel.findByUsername(data.username);
        
        if(checkExistAcc) {
            return res.status(400).json({message: "Tên đăng nhập đã tồn tại"});
        }
        
        const Salt = await bcrypt.genSalt(10);
        const newPass = await bcrypt.hash(data.password, Salt);
        
        const NewUser = {
            username: data.username,
            password: newPass,
            fullname: data.fullname,
            email: data.email,
        }
        
        await userModel.createUser(NewUser);
        res.status(201).json({message: "Tạo tài khoản thành công"});
        
    } catch(err) {
        console.log("Lỗi Register:", err);
        res.status(500).json({message:"Lỗi hệ thống"});
    }
}

async function login(req, res) {
    try {
        const data = req.body;
        const user = await userModel.findByUsername(data.username);
        
        if(!user) {
            return res.status(401).json({message: "Tài khoản không tồn tại"});
        }
        const isMatch = await bcrypt.compare(data.password, user.Password);
        if(!isMatch) {
            return res.status(401).json({message: "Sai mật khẩu"});
        }
        const payload = {
            Id: user.Id,     
            Role: user.Role  
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); // Tăng lên 1 ngày cho thoải mái test

       res.status(200).json({
            message: "Đăng nhập thành công",
            token: token,
            user: {
                Id: user.Id,
                Role: user.Role
            }
        });
    } catch(err) {
        console.log("Lỗi Login:", err);
        res.status(500).json({message:"Lỗi hệ thống"});
    }
}

// 3. Lấy thông tin cá nhân
async function getMyProfile(req, res) {
    try {
        const userId = req.user.Id;
        const userData = await userModel.getUserById(userId);
        
        if (!userData) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        
        delete userData.Password; 
        res.status(200).json(userData);
    } catch(err) {
        console.log("Lỗi Profile:", err);
        res.status(500).json({message:"Lỗi hệ thống"});
    } 
}

module.exports = {Register, login, getMyProfile};