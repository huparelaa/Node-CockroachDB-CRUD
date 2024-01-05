const { Pool } = require('pg');

async function createUsersTable(pool) {
    const client = await pool.connect();
    try {
        await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `);
        console.log('Users table created');
    } catch (err) {
        console.error('Error creating users table', err);
    } finally {
        client.release();
    }
}
module.exports = {
    createUsersTable,
};