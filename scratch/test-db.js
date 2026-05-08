const { Client } = require('pg');
require('dotenv').config();

async function test() {
  console.log("Testing connection to:", process.env.DATABASE_URL);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    console.log("Connection successful!");
    const res = await client.query('SELECT NOW()');
    console.log("Current time from DB:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
