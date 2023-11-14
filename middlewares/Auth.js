const jwt = require('jsonwebtoken');

const JWT_SECRET = 'c7c749e0e81c8da50a4d17c8ccbd54277b8c6526795d49a5a3ee109c32e69fb4a66d03b87d91f1d0d0b3d1996f85e5ff0b6a67152bf0a4a34debc78ce0cda4e'; // Replace with a strong and unique secret key

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
