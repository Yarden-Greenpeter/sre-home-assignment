// backend/src/models/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.TIDB_HOST || '127.0.0.1',
  user: process.env.TIDB_USER || 'root',
  password: process.env.TIDB_PASSWORD || '',
  database: process.env.TIDB_DATABASE || 'sre_assignment',
  waitForConnections: true,
  connectionLimit: 10
});

async function connectDB() {
  await pool.getConnection(); // Test connection
  console.log('Connected to TiDB');
}

module.exports = pool;
module.exports.connectDB = connectDB;
