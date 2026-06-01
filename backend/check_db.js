const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'erp_user',
    password: process.env.DB_PASSWORD || 'ermay_db_2026',
    database: process.env.DB_DATABASE || 'ERPCRMDB',
  });
  console.log('Connected to DB.');
  
  // Check stock_movements columns
  const [columns] = await connection.query('SHOW COLUMNS FROM stock_movements;');
  console.log('--- stock_movements columns ---');
  console.log(JSON.stringify(columns, null, 2));

  // Check last few records of audit logs or if there are any activity logs
  try {
    const [logs] = await connection.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5;');
    console.log('--- last 5 audit logs ---');
    console.log(JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to query audit_logs:', e.message);
  }
  
  await connection.end();
}

main().catch(console.error);
