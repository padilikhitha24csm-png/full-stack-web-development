import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/.env is loaded whether run from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback

// Create connection pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Return date as 'YYYY-MM-DD' string for clean display
});

// Test connection on startup
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database:', process.env.DB_NAME || 'library_db');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Please verify your MySQL server is running and credentials in backend/.env are correct.');
    return false;
  }
};

export default pool;
