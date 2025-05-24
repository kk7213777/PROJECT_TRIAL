//This is server/index.js


require('dotenv').config({ path: '/home/nikhil/Music/Chat-App/server/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userDetails = require('./controller/userDetails');
const { registerUser, loginUser, logoutUser } = require('./controller/authController');
const UserModel = require('./models/UserModel');
const { MessageModel, ConversationModel } = require('./models/ConversationModel');
const validateToken = require('./helpers/validateToken');

const app = express();
const PORT = process.env.PORT || 8080;
const mongoURI = process.env.MONGODB_URI;
const frontendURL = 'http://localhost:3000';

if (!mongoURI) {
  console.error("Error: MONGODB_URI is not defined in the .env file.");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: frontendURL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(cookieParser());

function verifyToken(req, res, next) {
  const token =
    req.cookies.token ||
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    return res.status(403).json({ message: "No token provided", error: true });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired", error: true });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token", error: true });
    }
    return res.status(500).json({ message: "Failed to authenticate token", error: true });
  }
}

// Enhanced loginUser function that returns user data
async function enhancedLoginUser(req, res) {
  let { email, password } = req.body;

  email = email?.trim();
  password = password?.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required.", error: true });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found.", error: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password.", error: true });
    }

    const tokenData = { id: user._id, email: user.email };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });

    return res
      .cookie('token', token, { httpOnly: true, sameSite: 'Strict', secure: false })
      .status(200)
      .json({ 
        message: "Login successful.", 
        success: true, 
        token,
        name: user.name,
        userId: user._id
      });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "Server error", error: true });
  }
}

// Routes
app.post('/register', registerUser);
app.post('/login', enhancedLoginUser);
app.post('/logout', logoutUser);

app.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Welcome to the protected route', user: req.user });
});

app.get('/validate-token', validateToken);

app.get('/user-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true });
    }
    
    res.status(200).json({ data: user, success: true });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: err.message || "Internal server error", error: true });
  }
});

// Update user profile
app.put('/update-user', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, profile_pic } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required", error: true });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, profile_pic },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    res.status(200).json({ 
      message: "Profile updated successfully", 
      success: true, 
      data: updatedUser 
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Update user email
app.put('/update-user-email', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ 
        message: "Valid email address is required", 
        error: true 
      });
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ 
        message: "Email address is already in use", 
        error: true 
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { email: newEmail },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    res.status(200).json({ 
      message: "Email updated successfully", 
      success: true, 
      data: updatedUser 
    });
  } catch (err) {
    console.error("Error updating email:", err);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Update user password
app.put('/update-user-password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required", 
        error: true 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long", 
        error: true 
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: "Current password is incorrect", 
        error: true 
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await UserModel.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.status(200).json({ 
      message: "Password updated successfully", 
      success: true 
    });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

app.get('/conversations', verifyToken, async (req, res) => {
  try {
    const conversations = await ConversationModel.find({ participants: req.user.id })
      .populate('participants', 'name email profile_pic')
      .populate('messages');
    res.status(200).json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching conversations', error: true });
  }
});

// API endpoint to save messages (for now, without Socket.IO)
app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { text, receiverId } = req.body;
    
    const newMessage = new MessageModel({
      text: text,
      msgByUserId: req.user.id,
      seen: false
    });
    
    await newMessage.save();
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
    
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: true 
    });
  }
});

// Search users endpoint
app.get('/search-user', verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required", error: true });
    }

    const users = await UserModel.find({
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email profile_pic').limit(10);

    res.status(200).json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: true 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found", 
    error: true 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('POST /register - User registration');
  console.log('POST /login - User login');
  console.log('POST /logout - User logout');
  console.log('GET /validate-token - Validate JWT token');
  console.log('GET /user-profile - Get user profile');
  console.log('PUT /update-user - Update user profile');
  console.log('PUT /update-user-password - Update user password');
  console.log('PUT /update-user-email - Update user email');
  console.log('GET /conversations - Get user conversations');
  console.log('POST /api/messages - Send message');
  console.log('GET /search-user - Search users');
});