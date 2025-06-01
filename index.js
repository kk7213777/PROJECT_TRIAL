require('dotenv').config({ path: '/home/nikhil/Music/Chat-App/server/.env' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
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

// New Friend Request Model
const FriendRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FriendRequestModel = mongoose.model('FriendRequest', FriendRequestSchema);

// Update User Model to include friends array (add this to your existing UserModel)
const updateUserModelWithFriends = async () => {
  try {
    // This will add the friends field to existing users if it doesn't exist
    await UserModel.updateMany(
      { friends: { $exists: false } },
      { $set: { friends: [] } }
    );
  } catch (error) {
    console.log('Friends field already exists or error updating:', error.message);
  }
};

const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 8080;
const mongoURI = process.env.MONGODB_URI;
const frontendURL = 'http://localhost:3000';

// Store online users
const onlineUsers = new Map();

if (!mongoURI) {
  console.error("Error: MONGODB_URI is not defined in the .env file.");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    updateUserModelWithFriends();
  })
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

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO Connection Handling
io.on('connection', async (socket) => {
  try {
    // Get user details from database
    const user = await UserModel.findById(socket.userId).select('name email profile_pic friends');
    
    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`User ${user.name} (${user.email}) connected with socket ID: ${socket.id}`);

    // Add user to online users
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      name: user.name,
      email: user.email,
      profile_pic: user.profile_pic,
      status: 'online',
      lastSeen: new Date(),
      friends: user.friends || []
    });

    // Join user to their own room for private messaging
    socket.join(socket.userId);

    // Broadcast to all clients that user is online
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      name: user.name,
      email: user.email,
      profile_pic: user.profile_pic,
      status: 'online',
      lastSeen: new Date()
    });

    // Send current online users to the newly connected user
    const onlineUsersList = Array.from(onlineUsers.values());
    socket.emit('onlineUsers', onlineUsersList);

    // Send pending friend requests to user
    const pendingRequests = await FriendRequestModel.find({
      $or: [
        { receiver: socket.userId, status: 'pending' },
        { sender: socket.userId, status: 'pending' }
      ]
    }).populate('sender receiver', 'name email profile_pic');
    
    socket.emit('friendRequests', pendingRequests);

    // Handle friend request
    socket.on('sendFriendRequest', async (data) => {
      try {
        const { receiverId } = data;
        
        // Check if request already exists
        const existingRequest = await FriendRequestModel.findOne({
          $or: [
            { sender: socket.userId, receiver: receiverId },
            { sender: receiverId, receiver: socket.userId }
          ]
        });

        if (existingRequest) {
          return socket.emit('friendRequestError', { 
            message: 'Friend request already exists' 
          });
        }

        // Check if already friends
        const currentUser = await UserModel.findById(socket.userId);
        if (currentUser.friends && currentUser.friends.includes(receiverId)) {
          return socket.emit('friendRequestError', { 
            message: 'Already friends with this user' 
          });
        }

        const friendRequest = new FriendRequestModel({
          sender: socket.userId,
          receiver: receiverId,
          status: 'pending'
        });

        await friendRequest.save();
        await friendRequest.populate('sender receiver', 'name email profile_pic');

        // Notify receiver if online
        const receiver = onlineUsers.get(receiverId);
        if (receiver) {
          io.to(receiver.socketId).emit('newFriendRequest', friendRequest);
        }

        socket.emit('friendRequestSent', { 
          message: 'Friend request sent successfully',
          request: friendRequest
        });

      } catch (error) {
        console.error('Error sending friend request:', error);
        socket.emit('friendRequestError', { 
          message: 'Failed to send friend request' 
        });
      }
    });

    // Handle friend request response
    socket.on('respondToFriendRequest', async (data) => {
      try {
        const { requestId, response } = data; // response: 'accepted' or 'declined'
        
        const friendRequest = await FriendRequestModel.findById(requestId)
          .populate('sender receiver', 'name email profile_pic');

        if (!friendRequest || friendRequest.receiver._id.toString() !== socket.userId) {
          return socket.emit('friendRequestError', { 
            message: 'Invalid friend request' 
          });
        }

        friendRequest.status = response;
        friendRequest.updatedAt = new Date();
        await friendRequest.save();

        if (response === 'accepted') {
          // Add each other as friends
          await UserModel.findByIdAndUpdate(
            friendRequest.sender._id,
            { $addToSet: { friends: friendRequest.receiver._id } }
          );
          
          await UserModel.findByIdAndUpdate(
            friendRequest.receiver._id,
            { $addToSet: { friends: friendRequest.sender._id } }
          );

          // Update online users friends list
          if (onlineUsers.has(friendRequest.sender._id.toString())) {
            const senderOnline = onlineUsers.get(friendRequest.sender._id.toString());
            senderOnline.friends.push(friendRequest.receiver._id.toString());
          }
          
          if (onlineUsers.has(friendRequest.receiver._id.toString())) {
            const receiverOnline = onlineUsers.get(friendRequest.receiver._id.toString());
            receiverOnline.friends.push(friendRequest.sender._id.toString());
          }

          // Notify sender if online
          const sender = onlineUsers.get(friendRequest.sender._id.toString());
          if (sender) {
            io.to(sender.socketId).emit('friendRequestAccepted', {
              friend: friendRequest.receiver,
              message: `${friendRequest.receiver.name} accepted your friend request`
            });
          }

          socket.emit('friendAdded', {
            friend: friendRequest.sender,
            message: `You are now friends with ${friendRequest.sender.name}`
          });
        }

        // Notify both users about the response
        const sender = onlineUsers.get(friendRequest.sender._id.toString());
        if (sender) {
          io.to(sender.socketId).emit('friendRequestResponse', {
            requestId,
            response,
            user: friendRequest.receiver.name
          });
        }

      } catch (error) {
        console.error('Error responding to friend request:', error);
        socket.emit('friendRequestError', { 
          message: 'Failed to respond to friend request' 
        });
      }
    });

    // Handle private messages (updated to check friendship)
    socket.on('privateMessage', async (data) => {
      try {
        const { recipientId, message, conversationId } = data;
        
        // Check if users are friends
        const currentUser = await UserModel.findById(socket.userId);
        if (!currentUser.friends || !currentUser.friends.includes(recipientId)) {
          return socket.emit('messageError', { 
            error: 'You can only message friends' 
          });
        }
        
        // Save message to database
        const newMessage = new MessageModel({
          text: message,
          msgByUserId: socket.userId,
          seen: false,
          createdAt: new Date()
        });
        
        await newMessage.save();

        // Create or update conversation
        let conversation = await ConversationModel.findById(conversationId);
        if (!conversation) {
          conversation = new ConversationModel({
            participants: [socket.userId, recipientId],
            messages: [newMessage._id],
            lastMessage: newMessage._id
          });
        } else {
          conversation.messages.push(newMessage._id);
          conversation.lastMessage = newMessage._id;
          conversation.updatedAt = new Date();
        }
        
        await conversation.save();

        const messageData = {
          _id: newMessage._id,
          text: message,
          msgByUserId: socket.userId,
          senderName: user.name,
          senderProfilePic: user.profile_pic,
          seen: false,
          createdAt: newMessage.createdAt,
          conversationId: conversation._id
        };

        // Send message to recipient if online
        const recipient = onlineUsers.get(recipientId);
        if (recipient) {
          io.to(recipient.socketId).emit('newMessage', messageData);
        }
        
        // Send confirmation back to sender
        socket.emit('messageDelivered', {
          messageId: newMessage._id,
          conversationId: conversation._id,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error handling private message:', error);
        socket.emit('messageError', { 
          error: 'Failed to send message' 
        });
      }
    });

    // Handle group message creation
    socket.on('createGroupConversation', async (data) => {
      try {
        const { participantIds, groupName } = data;
        
        // Verify all participants are friends
        const currentUser = await UserModel.findById(socket.userId);
        const userFriends = currentUser.friends || [];
        
        const areAllFriends = participantIds.every(id => userFriends.includes(id));
        if (!areAllFriends) {
          return socket.emit('groupError', { 
            error: 'You can only create groups with friends' 
          });
        }

        // Create group conversation
        const groupConversation = new ConversationModel({
          participants: [socket.userId, ...participantIds],
          messages: [],
          isGroup: true,
          groupName: groupName || 'Group Chat',
          groupAdmin: socket.userId
        });

        await groupConversation.save();
        await groupConversation.populate('participants', 'name email profile_pic');

        // Notify all participants
        participantIds.forEach(participantId => {
          const participant = onlineUsers.get(participantId);
          if (participant) {
            io.to(participant.socketId).emit('addedToGroup', {
              conversation: groupConversation,
              addedBy: user.name
            });
          }
        });

        socket.emit('groupCreated', {
          conversation: groupConversation,
          message: 'Group created successfully'
        });

      } catch (error) {
        console.error('Error creating group:', error);
        socket.emit('groupError', { 
          error: 'Failed to create group' 
        });
      }
    });

    // Other existing socket handlers remain the same...
    socket.on('updateStatus', (status) => {
      if (onlineUsers.has(socket.userId)) {
        onlineUsers.get(socket.userId).status = status;
        onlineUsers.get(socket.userId).lastSeen = new Date();
        
        io.emit('userStatusUpdate', {
          userId: socket.userId,
          name: user.name,
          status: status,
          lastSeen: new Date()
        });
      }
    });

    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      const recipient = onlineUsers.get(recipientId);
      
      if (recipient) {
        io.to(recipient.socketId).emit('userTyping', {
          userId: socket.userId,
          name: user.name,
          isTyping: isTyping
        });
      }
    });

    socket.on('messageSeen', async (data) => {
      try {
        const { messageId, conversationId } = data;
        
        await MessageModel.findByIdAndUpdate(messageId, { seen: true });
        
        const conversation = await ConversationModel.findById(conversationId)
          .populate('participants', '_id');
        
        const otherParticipant = conversation.participants.find(
          p => p._id.toString() !== socket.userId
        );
        
        if (otherParticipant) {
          const sender = onlineUsers.get(otherParticipant._id.toString());
          if (sender) {
            io.to(sender.socketId).emit('messageSeenUpdate', {
              messageId: messageId,
              seenBy: socket.userId,
              seenAt: new Date()
            });
          }
        }
        
      } catch (error) {
        console.error('Error updating message seen status:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${user.name} disconnected`);
      
      onlineUsers.delete(socket.userId);
      
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        name: user.name,
        status: 'offline',
        lastSeen: new Date()
      });
    });

  } catch (error) {
    console.error('Socket connection error:', error);
    socket.disconnect();
  }
});

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

// Get online users endpoint (updated to include friend status)
app.get('/online-users', verifyToken, async (req, res) => {
  try {
    const currentUser = await UserModel.findById(req.user.id).select('friends');
    const userFriends = currentUser.friends || [];
    
    const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
      userId: user.userId,
      name: user.name,
      email: user.email,
      profile_pic: user.profile_pic,
      status: user.status,
      lastSeen: user.lastSeen,
      isFriend: userFriends.includes(user.userId),
      canMessage: userFriends.includes(user.userId)
    }));
    
    res.status(200).json({ 
      success: true, 
      data: onlineUsersList 
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Get user's friends
app.get('/friends', verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .populate('friends', 'name email profile_pic')
      .select('friends');
    
    // Add online status to friends
    const friendsWithStatus = user.friends.map(friend => ({
      ...friend.toObject(),
      isOnline: onlineUsers.has(friend._id.toString()),
      status: onlineUsers.get(friend._id.toString())?.status || 'offline'
    }));

    res.status(200).json({ 
      success: true, 
      data: friendsWithStatus 
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Get friend requests
app.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    const requests = await FriendRequestModel.find({
      $or: [
        { receiver: req.user.id, status: 'pending' },
        { sender: req.user.id }
      ]
    }).populate('sender receiver', 'name email profile_pic');

    res.status(200).json({ 
      success: true, 
      data: requests 
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Search users endpoint (updated to show friend status)
app.get('/search-user', verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required", error: true });
    }

    const currentUser = await UserModel.findById(req.user.id).select('friends');
    const userFriends = currentUser.friends || [];

    const users = await UserModel.find({
      $and: [
        { _id: { $ne: req.user.id } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email profile_pic').limit(10);

    // Check friend request status for each user
    const userIds = users.map(u => u._id);
    const friendRequests = await FriendRequestModel.find({
      $or: [
        { sender: req.user.id, receiver: { $in: userIds } },
        { receiver: req.user.id, sender: { $in: userIds } }
      ]
    });

    const usersWithStatus = users.map(user => {
      const friendRequest = friendRequests.find(fr => 
        fr.sender.toString() === user._id.toString() || 
        fr.receiver.toString() === user._id.toString()
      );

      return {
        ...user.toObject(),
        isOnline: onlineUsers.has(user._id.toString()),
        status: onlineUsers.get(user._id.toString())?.status || 'offline',
        isFriend: userFriends.includes(user._id.toString()),
        friendRequestStatus: friendRequest ? friendRequest.status : null,
        friendRequestId: friendRequest ? friendRequest._id : null,
        canSendFriendRequest: !userFriends.includes(user._id.toString()) && !friendRequest
      };
    });

    res.status(200).json({ 
      success: true, 
      data: usersWithStatus 
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: "Internal server error", error: true });
  }
});

// Rest of the existing routes remain the same...
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

    if (onlineUsers.has(userId)) {
      const onlineUser = onlineUsers.get(userId);
      onlineUser.name = name;
      onlineUser.profile_pic = profile_pic;
      
      io.emit('userProfileUpdate', {
        userId: userId,
        name: name,
        profile_pic: profile_pic
      });
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

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: "Current password is incorrect", 
        error: true 
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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

server.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
  console.log('Socket.IO server is ready for connections');
  console.log('Available routes:');
  console.log('POST /register - User registration');
  console.log('POST /login - User login');
  console.log('POST /logout - User logout');
  console.log('GET /validate-token - Validate JWT token');
  console.log('GET /user-profile - Get user profile');
  console.log('GET /online-users - Get online users with friend status');
  console.log('GET /friends - Get user friends');
  console.log('GET /friend-requests - Get friend requests');
  console.log('GET /search-user - Search users');
  console.log('PUT /update-user - Update user profile');
  console.log('PUT /update-user-email - Update user email');
  console.log('PUT /update-user-password - Update user password');
  console.log('GET /conversations - Get user conversations');
  console.log('POST /api/messages - Send message');
  console.log('GET /protected - Protected route (test)');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});