import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token for a given user ID
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'annapurna_dev_secret_key_12345';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Verifies a JWT token and returns decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'annapurna_dev_secret_key_12345';
  return jwt.verify(token, secret);
};
