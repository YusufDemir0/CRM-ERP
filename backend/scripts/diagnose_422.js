const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
  console.log('Connecting to database...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_DATABASE);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'erp_user',
    password: process.env.DB_PASSWORD || 'ermay_db_2026',
    database: process.env.DB_DATABASE || 'ERPCRMDB',
  });

  try {
    console.log('\n--- 1. List of Tables ---');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(tables.map(t => Object.values(t)[0]));

    // Check sales table
    console.log('\n--- 2. Columns in sales ---');
    try {
      const [salesCols] = await connection.query('SHOW COLUMNS FROM sales');
      console.table(salesCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
    } catch (e) {
      console.error('Error fetching sales columns:', e.message);
    }

    // Check items table
    console.log('\n--- 3. Columns in items ---');
    try {
      const [itemsCols] = await connection.query('SHOW COLUMNS FROM items');
      console.table(itemsCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
    } catch (e) {
      console.error('Error fetching items columns:', e.message);
    }

    // Check dashboards / other related tables
    console.log('\n--- 4. Columns in other tables ---');
    for (const tbl of ['sale_sequences', 'parties', 'users', 'departments']) {
      try {
        const [cols] = await connection.query(`SHOW COLUMNS FROM \`${tbl}\``);
        console.log(`\nColumns in ${tbl}:`);
        console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));
      } catch (e) {
        console.error(`Error in ${tbl}:`, e.message);
      }
    }

  } catch (err) {
    console.error('Main diagnosis error:', err);
  } finally {
    await connection.end();
  }
}

diagnose();
