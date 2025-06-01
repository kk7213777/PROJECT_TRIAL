import React, { useState, useEffect, useContext, useRef } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from './UserContext';
import { useSocket } from '../contexts/SocketContext';
import Navbar from '../components/Navbar';

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserName, currentUser, setCurrentUser } = useContext(UserContext);
  const { 
    isConnected, 
    onlineUsers, 
    messages, 
    setMessages, 
    conversations,
    setConversations,
    sendMessage, 
    typingUsers,
    sendTypingIndicator,
  } = useSocket();
  
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userFromState = location.state?.user;
        
        if (userFromState && userFromState.name) {
          setCurrentUser(userFromState);
          setUserName(userFromState.name);
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8080/validate-token', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success && data.user) {
          const user = {
            name: data.user.name,
            email: data.user.email,
            id: data.user.id,
            profile_pic: data.user.profile_pic
          };
          setCurrentUser(user);
          setUserName(user.name);
          localStorage.setItem('userName', user.name);
          
          // Load conversations
          await loadConversations();
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error validating user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [location.state, navigate, setUserName, setCurrentUser]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/search-user?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startConversation = (user) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    
    // Find existing conversation or create new one
    const existingConversation = conversations.find(conv => 
      conv.participants.some(p => p._id === user._id)
    );
    
    if (existingConversation) {
      setCurrentConversationId(existingConversation._id);
      // Load messages for this conversation
      loadConversationMessages(existingConversation._id);
    } else {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedUser && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(selectedUser._id, true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedUser) {
        sendTypingIndicator(selectedUser._id, false);
      }
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser || !selectedUser) return;

    const messageData = {
      text: newMessage,
      msgByUserId: currentUser.id,
      senderName: currentUser.name,
      senderProfilePic: currentUser.profile_pic,
      seen: false,
      createdAt: new Date(),
      _id: Date.now().toString() // Temporary ID
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, messageData]);
    
    // Send through socket
    sendMessage(selectedUser._id, newMessage, currentConversationId);
    
    setNewMessage("");
    
    // Stop typing indicator
    setIsTyping(false);
    sendTypingIndicator(selectedUser._id, false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter current conversation messages
  const currentMessages = messages.filter(msg => {
    if (!currentConversationId && selectedUser) {
      // New conversation - show messages between current user and selected user
      return (msg.msgByUserId === currentUser?.id && msg.recipientId === selectedUser._id) ||
             (msg.msgByUserId === selectedUser._id && msg.recipientId === currentUser?.id);
    }
    return msg.conversationId === currentConversationId;
  });

  if (loading) {
    return (
      <ChatContainer>
        <LoadingMessage>Loading chat...</LoadingMessage>
      </ChatContainer>
    );
  }

  if (!currentUser) {
    return (
      <ChatContainer>
        <LoadingMessage>Unable to load user data. Please try logging in again.</LoadingMessage>
      </ChatContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <ChatContainer>
        <ChatSidebar>
          <SidebarHeader>
            <UserInfo>
              <Avatar src={currentUser.profile_pic || '/default-avatar.png'} alt={currentUser.name} />
              <div>
                <UserName>{currentUser.name}</UserName>
                <ConnectionStatus isConnected={isConnected}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </ConnectionStatus>
              </div>
            </UserInfo>
          </SidebarHeader>

          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchResults.length > 0 && (
              <SearchResults>
                {searchResults.map(user => (
                  <SearchResultItem 
                    key={user._id} 
                    onClick={() => startConversation(user)}
                  >
                    <Avatar src={user.profile_pic || '/default-avatar.png'} alt={user.name} />
                    <div>
                      <div>{user.name}</div>
                      <OnlineIndicator isOnline={user.isOnline}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </OnlineIndicator>
                    </div>
                  </SearchResultItem>
                ))}
              </SearchResults>
            )}
          </SearchContainer>

          <OnlineUsersSection>
            <SectionTitle>Online Users ({onlineUsers.length})</SectionTitle>
            <OnlineUsersList>
              {onlineUsers
                .filter(user => user.userId !== currentUser.id)
                .map(user => (
                <OnlineUserItem 
                  key={user.userId}
                  onClick={() => startConversation({
                    _id: user.userId,
                    name: user.name,
                    email: user.email,
                    profile_pic: user.profile_pic
                  })}
                  isActive={selectedUser?._id === user.userId}
                >
                  <Avatar src={user.profile_pic || '/default-avatar.png'} alt={user.name} />
                  <div>
                    <div>{user.name}</div>
                    <StatusIndicator status={user.status}>
                      {user.status}
                    </StatusIndicator>
                  </div>
                </OnlineUserItem>
              ))}
            </OnlineUsersList>
          </OnlineUsersSection>
        </ChatSidebar>

        <ChatMain>
          {selectedUser ? (
            <>
              <ChatHeader>
                <SelectedUserInfo>
                  <Avatar src={selectedUser.profile_pic || '/default-avatar.png'} alt={selectedUser.name} />
                  <div>
                    <SelectedUserName>{selectedUser.name}</SelectedUserName>
                    <UserStatus>
                      {onlineUsers.find(u => u.userId === selectedUser._id) ? 'Online' : 'Offline'}
                    </UserStatus>
                  </div>
                </SelectedUserInfo>
              </ChatHeader>

              <ChatBox>
                {currentMessages.length > 0 ? (
                  currentMessages.map((msg) => (
                    <ChatMessage key={msg._id} isOwnMessage={msg.msgByUserId === currentUser.id}>
                      <MessageHeader>
                        <Sender>{msg.msgByUserId === currentUser.id ? 'You' : msg.senderName || selectedUser.name}</Sender>
                        <Timestamp>{new Date(msg.createdAt).toLocaleTimeString()}</Timestamp>
                      </MessageHeader>
                      <Message>{msg.text}</Message>
                      {msg.seen && msg.msgByUserId === currentUser.id && (
                        <SeenIndicator>✓✓</SeenIndicator>
                      )}
                    </ChatMessage>
                  ))
                ) : (
                  <Placeholder>Start your conversation with {selectedUser.name}!</Placeholder>
                )}
                
                {typingUsers.find(u => u.userId === selectedUser._id) && (
                  <TypingIndicator>
                    {selectedUser.name} is typing...
                  </TypingIndicator>
                )}
                
                <div ref={messagesEndRef} />
              </ChatBox>
              
              <ChatInputContainer>
                <ChatInput
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${selectedUser.name}...`}
                />
                <SendButton onClick={handleSendMessage}>Send</SendButton>
              </ChatInputContainer>
            </>
          ) : (
            <WelcomeScreen>
              <WelcomeText>Welcome to Chat App!</WelcomeText>
              <WelcomeSubtext>Select a user to start chatting</WelcomeSubtext>
            </WelcomeScreen>
          )}
        </ChatMain>
      </ChatContainer>
    </PageContainer>
  );
};

export default ChatPage;

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Poppins", sans-serif;
`;

const ChatContainer = styled.div`
  display: flex;
  flex: 1;
  background: linear-gradient(135deg, #6a1b9a, #ab47bc);
`;

const ChatSidebar = styled.div`
  width: 300px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
`;

const UserName = styled.div`
  font-weight: bold;
  font-size: 16px;
`;

const ConnectionStatus = styled.div`
  font-size: 12px;
  color: ${props => props.isConnected ? '#4caf50' : '#f44336'};
`;

const SearchContainer = styled.div`
  padding: 15px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 55px;
  left: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  cursor: pointer;
  color: #333;
  
  &:hover {
    background: rgba(106, 27, 154, 0.1);
  }
`;

const OnlineUsersSection = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
`;

const SectionTitle = styled.h3`
  color: white;
  font-size: 14px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const OnlineUsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const OnlineUserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  color: white;
  background: ${props => props.isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const OnlineIndicator = styled.div`
  font-size: 12px;
  color: ${props => props.isOnline ? '#4caf50' : '#999'};
`;

const StatusIndicator = styled.div`
  font-size: 12px;
  color: ${props => {
    switch(props.status) {
      case 'online': return '#4caf50';
      case 'away': return '#ff9800';
      case 'busy': return '#f44336';
      default: return '#999';
    }
  }};
`;

const ChatMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
`;

const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
`;

const SelectedUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const SelectedUserName = styled.h2`
  margin: 0;
  color: #333;
  font-size: 18px;
`;

const UserStatus = styled.div`
  font-size: 14px;
  color: #666;
`;

const ChatBox = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f5f5;
`;

const ChatMessage = styled.div`
  background: ${props => props.isOwnMessage ? '#e3f2fd' : '#ffffff'};
  margin-bottom: 15px;
  padding: 12px 16px;
  border-radius: 15px;
  max-width: 70%;
  margin-left: ${props => props.isOwnMessage ? 'auto' : '0'};
  margin-right: ${props => props.isOwnMessage ? '0' : 'auto'};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const Sender = styled.span`
  font-weight: bold;
  color: #6a1b9a;
  font-size: 14px;
`;

const Message = styled.div`
  word-wrap: break-word;
  line-height: 1.4;
  color: #333;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #666;
`;

const SeenIndicator = styled.div`
  text-align: right;
  color: #4caf50;
  font-size: 12px;
  margin-top: 5px;
`;

const TypingIndicator = styled.div`
  color: #666;
  font-style: italic;
  padding: 10px;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const Placeholder = styled.p`
  color: #aaa;
  text-align: center;
  font-style: italic;
  padding: 40px 0;
`;

const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
`;

const WelcomeText = styled.h1`
  color: #6a1b9a;
  font-size: 48px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const WelcomeSubtext = styled.p`
  color: #666;
  font-size: 18px;
`;

const ChatInputContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: #6a1b9a;
  }
`;

const SendButton = styled.button`
  background-color: #6a1b9a;
  color: #fff;
  padding: 15px 25px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #7b1fa2;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 24px;
  color: white;
`;