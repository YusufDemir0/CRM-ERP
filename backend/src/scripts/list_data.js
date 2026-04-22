const { createConnection } = require('mysql2/promise');
const fs = require('fs');
const dotenv = require('dotenv');

async function run() {
  const env = dotenv.parse(fs.readFileSync('/home/yusuf/ermany/ermaycrmerp/backend/.env'));
  const connection = await createConnection({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  const tables = ['items', 'parties', 'departments', 'users'];
  for (const table of tables) {
    try {
        const [rows] = await connection.query(`SELECT * FROM ${table} LIMIT 10`);
        console.log(`--- Table: ${table} ---`);
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.log(`Failed to read table ${table}: ${e.message}`);
    }
  }

  await connection.end();
}

run().catch(console.error);
