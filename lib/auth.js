const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'bns_bank_nusantara_jwt_secret_key_2026';
const TOKEN_NAME = 'bns_auth_token';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  try {
    if (!password || !hash) return false;
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    return false;
  }
}

async function hashPasswordAsync(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePasswordAsync(password, hash) {
  try {
    if (!password || !hash) return false;
    return await bcrypt.compare(password, hash);
  } catch (err) {
    return false;
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      nama_lengkap: user.nama_lengkap,
      divisi_id: user.divisi_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  JWT_SECRET,
  TOKEN_NAME,
  bcrypt,
  hashPassword,
  comparePassword,
  hashPasswordAsync,
  comparePasswordAsync,
  generateToken,
  verifyToken,
};
