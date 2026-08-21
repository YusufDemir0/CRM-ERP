import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ERPCRMDB',
    multipleStatements: true,
  });

  console.log('Successfully connected.');

  const sqlPath = '/home/yusuf/ermany/ermaycrmerp/sql_update_installments.sql';
  console.log(`Reading SQL script from: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing SQL statements...');
  await connection.query(sql);

  console.log('✅ Database migration executed successfully!');
  await connection.end();
}

run().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
