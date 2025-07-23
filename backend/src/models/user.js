const pool = require('./db');

async function getUserByEmail(email) {
  try {
    const [rows] = await pool.execute(
      'SELECT email, password FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error('Database query failed');
  }
}

async function createUser(email, hashedPassword) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    return result;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists');
    }
    throw new Error('Database insert failed');
  }
}

module.exports = { getUserByEmail, createUser };