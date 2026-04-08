const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSql() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1754',
    database: process.env.DB_DATABASE || 'benyaptim',
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(__dirname, 'sql_scripts', 'full_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⏳ Running full migration...');
    await connection.query(sql);
    console.log('✅ Full migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSql();
