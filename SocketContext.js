// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { UserContext } from '../pages/UserContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const { currentUser } = useContext(UserContext) || {};

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && currentUser) {
      // Initialize socket connection
      const newSocket = io('http://localhost:8080', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Handle connection errors
      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Online users management
      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('userOnline', (user) => {
        setOnlineUsers(prev => {
          const existingUser = prev.find(u => u.userId === user.userId);
          if (existingUser) {
            return prev.map(u => u.userId === user.userId ? { ...u, ...user } : u);
          }
          return [...prev, user];
        });
      });

      newSocket.on('userOffline', (user) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
      });

      newSocket.on('userStatusUpdate', (user) => {
        setOnlineUsers(prev => 
          prev.map(u => u.userId === user.userId ? { ...u, ...user } : u)
        );
      });

      // Message handling
      newSocket.on('newMessage', (messageData) => {
        setMessages(prev => [...prev, messageData]);
        
        // Update conversation with new message
        setConversations(prev => 
          prev.map(conv => 
            conv._id === messageData.conversationId 
              ? { ...conv, lastMessage: messageData, updatedAt: messageData.createdAt }
              : conv
          )
        );
      });

      newSocket.on('messageDelivered', (data) => {
        console.log('Message delivered:', data);
      });

      newSocket.on('messageSeenUpdate', (data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, seen: true, seenAt: data.seenAt }
              : msg
          )
        );
      });

      // Typing indicators
      newSocket.on('userTyping', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (!prev.find(u => u.userId === data.userId)) {
              return [...prev, data];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });

      // Profile updates
      newSocket.on('userProfileUpdate', (data) => {
        setOnlineUsers(prev => 
          prev.map(u => u.userId === data.userId ? { ...u, ...data } : u)
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [currentUser]);

  // Socket utility functions
  const sendMessage = (recipientId, message, conversationId) => {
    if (socket && isConnected) {
      socket.emit('privateMessage', {
        recipientId,
        message,
        conversationId
      });
    }
  };

  const updateUserStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('updateStatus', status);
    }
  };

  const sendTypingIndicator = (recipientId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { recipientId, isTyping });
    }
  };

  const markMessageAsSeen = (messageId, conversationId) => {
    if (socket && isConnected) {
      socket.emit('messageSeen', { messageId, conversationId });
    }
  };

  const joinConversation = (conversationId) => {
    setCurrentConversation(conversationId);
  };

  const leaveConversation = () => {
    setCurrentConversation(null);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    messages,
    setMessages,
    conversations,
    setConversations,
    currentConversation,
    typingUsers,
    sendMessage,
    updateUserStatus,
    sendTypingIndicator,
    markMessageAsSeen,
    joinConversation,
    leaveConversation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;