const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
require('dotenv').config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connectionString = process.env.DATABASE_URL;
console.log(connectionString);

const pool = new Pool({
  connectionString,
});
async function createUsersTable() {
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
createUsersTable();

app.get('/', async (req, res) => {
  try {

    const client = await pool.connect();
    const result = await client.query('SELECT now() as current_time');
    const currentTime = result.rows[0].current_time;
    res.send(`Current time from CockroachDB: ${currentTime}`);
    client.release();
  } catch (err) {

    console.error('Error executing query', err);
    res.status(500).send('Error retrieving data');
  }
});

// Obtener todos los usuarios
app.get('/users', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
    client.release();
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).send('Error retrieving users');
  }
});

// Crear un nuevo usuario
app.post('/users', async (req, res) => {
  const { username, email } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
      [username, email]
    );
    res.status(201).json(result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Error creating user', err);
    res.status(500).send('Error creating user');
  }
});

// Actualizar un usuario existente
app.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *',
      [username, email, userId]
    );
    res.json(result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Error updating user', err);
    res.status(500).send('Error updating user');
  }
});

// Eliminar un usuario
app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    res.send('User deleted successfully');
    client.release();
  } catch (err) {
    console.error('Error deleting user', err);
    res.status(500).send('Error deleting user');
  }
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
