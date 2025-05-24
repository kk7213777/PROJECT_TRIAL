//This is src/pages/LogoutPage.js
import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from './UserContext';
import { apiService } from '../services/apiServices';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout } = useContext(UserContext);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await apiService.logout(token);
        }
        logout();
        navigate('/');
      } catch (error) {
        console.error('Logout error:', error);
        // Still logout locally even if server request fails
        logout();
        navigate('/');
      }
    };

    handleLogout();
  }, [logout, navigate]);

  return (
    <LogoutContainer>
      <LogoutMessage>Logging you out...</LogoutMessage>
    </LogoutContainer>
  );
};

const LogoutContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #6a1b9a, #ab47bc);
`;

const LogoutMessage = styled.h2`
  color: white;
  font-size: 24px;
`;

export default LogoutPage;