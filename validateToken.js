//This is server/controller/validateToken.js


const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const jwtSecretKey = process.env.JWT_SECRET_KEY;

async function validateToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    const user = await UserModel.findById(decoded.id).select('name email');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        id: user._id,
      },
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = validateToken;