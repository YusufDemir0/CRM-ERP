import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'erp_user',
    password: 'ermay_db_2026',
    database: 'ERPCRMDB',
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
