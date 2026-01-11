const { sql } = require('../config/database');

async function findByUsername(username) {
    try {
        const req = new sql.Request();
        req.input("username", sql.VarChar, username);
        const Query = `SELECT * FROM Users WHERE Username = @username`;
        const res = await req.query(Query);
        return res.recordset[0];
    } catch(err) {
        console.log("Lỗi findByUsername:", err);
        throw err;
    }
}

async function createUser(data) {
    try {
        const req = new sql.Request();
        req.input("Uname", sql.VarChar, data.username);
        req.input("Pass", sql.VarChar, data.password);
        req.input("fullN", sql.NVarChar, data.fullname);
        req.input("email", sql.VarChar, data.email);
        // 👇 THÊM DÒNG NÀY: Để đảm bảo user mới luôn có quyền 'user' thay vì NULL
        req.input("role", sql.VarChar, 'user'); 

        const Query = `
            INSERT INTO Users (Username, Password, FullName, Email, Role)
            VALUES (@Uname, @Pass, @fullN, @email, @role)
        `;
        const res = await req.query(Query);
        return res;
    } catch(err) {
        console.log("Lỗi createUser:", err);
        throw err;
    }
}

async function getUserById(id) {
    try {
        const req = new sql.Request();
        req.input("id", sql.Int, id); // Input là "id"
        const Query = 'SELECT * FROM Users WHERE Id = @id'; // Query dùng @id
        const res = await req.query(Query);
        return res.recordset[0];
    } catch(err) {
        throw err;
    }
}
module.exports = { findByUsername, createUser, getUserById };