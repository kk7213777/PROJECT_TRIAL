
//This is src/pages/LoginPage.js

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from './UserContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserName } = useContext(UserContext);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const response = await fetch('http://localhost:8080/validate-token', {
            method: 'GET',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();

          if (data.success && data.user) {
            // User is already logged in, set context and redirect
            setUserName(data.user.name);
            localStorage.setItem('userName', data.user.name);
            navigate('/chat', { 
              state: { 
                user: {
                  name: data.user.name,
                  email: data.user.email,
                  id: data.user.id
                }
              } 
            });
          } else {
            // Token is invalid, clean up
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
          }
        } catch (err) {
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
        }
      }
    };

    validateToken();
  }, [navigate, setUserName]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Both fields are required!');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.name);
        
        // Update context
        setUserName(data.name);

        // Navigate to chat with user data
        navigate('/chat', { 
          state: { 
            user: { 
              name: data.name, 
              email: email,
              id: data.userId 
            } 
          } 
        }); 
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginBox>
        <Logo>संवाद</Logo>
        <Title>Welcome Back</Title>
        <Subtitle>Sign in to continue chatting</Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <LoginForm onSubmit={handleLogin}>
          <InputGroup>
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </SubmitButton>
        </LoginForm>
        
        <LinksContainer>
          <LinkText>
            Don't have an account?{' '}
            <Link onClick={() => navigate('/signup')}>Sign Up</Link>
          </LinkText>
          <LinkText>
            <Link onClick={() => navigate('/')}>Back to Home</Link>
          </LinkText>
        </LinksContainer>
      </LoginBox>
    </LoginContainer>
  );
};

export default LoginPage;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #6a1b9a, #ab47bc);
  padding: 20px;
  font-family: "Poppins", sans-serif;
`;

const LoginBox = styled.div`
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Logo = styled.h1`
  font-size: 42px;
  font-family: 'Lohit Devanagari', sans-serif;
  color: #6a1b9a;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    border-color: #6a1b9a;
    box-shadow: 0 0 10px rgba(106, 27, 154, 0.2);
    transform: translateY(-2px);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 15px;
  margin-top: 10px;
  background: linear-gradient(135deg, #6a1b9a, #8e24aa);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(106, 27, 154, 0.4);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #f44336;
  font-size: 14px;
`;

const LinksContainer = styled.div`
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LinkText = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0;
`;

const Link = styled.span`
  color: #6a1b9a;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.3s ease;
  
  &:hover {
    color: #8e24aa;
    text-decoration: underline;
  }
`;