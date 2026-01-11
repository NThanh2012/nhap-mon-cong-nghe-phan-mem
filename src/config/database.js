const sql = require('mssql');
require('dotenv').config();

const config = {
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}

async function connectDB() {
    try{
        let pool = await sql.connect(config);
        console.log('thanh cong');
        return pool;
    } catch (err){
        console.log(" Lỗi kết nối:", err);
    }
}

module.exports = { connectDB, sql , config};