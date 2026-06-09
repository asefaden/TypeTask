import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306, // ይህንን አዲስ መስመር ይጨምሩ
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'task_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection immediately on startup
pool.getConnection()
    .then(connection => {
        console.log(`✅ Connected to database "${process.env.DB_NAME || 'task_manager'}" on ${process.env.DB_HOST || 'localhost'}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ DATABASE CONNECTION ERROR ❌');
        console.error(`Code: ${err.code}`);
        console.error(`Message: ${err.message}`);
    });

export default pool;
