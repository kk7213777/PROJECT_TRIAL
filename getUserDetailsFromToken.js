
//This is server/controller/getUserDetailsFromToken.js


const jwt = require('jsonwebtoken')
const UserModel = require('../models/UserModel')

const getUserDetailsFromToken = async (token) => {
  if (!token || typeof token !== 'string') {
    return {
      message: "session out",
      logout: true,
    }
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECREAT_KEY)
    const user = await UserModel.findById(decode.id).select('-password')
    return user
  } catch (error) {
    console.log('[JWT] verify error:', error.message)
    return {
      message: "session out",
      logout: true,
    }
  }
}

module.exports = getUserDetailsFromToken
