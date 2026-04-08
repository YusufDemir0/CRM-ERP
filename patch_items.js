const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runPatch() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1754',
    database: process.env.DB_DATABASE || 'benyaptim',
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(__dirname, 'sql_scripts', 'patch_items_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⏳ Running items table patch...');
    await connection.query(sql);
    console.log('✅ Patch applied successfully!');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('⚠️ Column already exists, skipping patch.');
    } else {
      console.error('❌ Patch error:', err.message);
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

runPatch();
