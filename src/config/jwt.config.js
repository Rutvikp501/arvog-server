import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // use env in production
const JWT_EXPIRES_IN = "7d"; // token validity

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode in token (e.g. { id, email })
 * @returns {string} - Signed JWT token
 *
 * Example:
 * generateToken({ id: user._id })
 */
export function generateToken(payload) {
  const data = {
    UserId: payload._id,
    name: payload.name,
    role: payload.role,
    email: payload.email,
  };

  return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT string
 * @returns {Object|null} - Decoded payload or null if invalid
 *
 * Example:
 * const data = verifyToken(token);
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Invalid token", error.message);
    return null;
  }
}
