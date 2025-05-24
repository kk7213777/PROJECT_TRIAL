//THis file is src/componets/Navbar.js
import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from '../pages/UserContext';

const Navbar = () => {
  const { userName, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Nav>
      <Logo>
        <span className="english">Samvad</span>
        <span className="marathi">संवाद</span>
      </Logo>
      
      <NavList>
        <NavItem>
          <StyledNavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Home
          </StyledNavLink>
        </NavItem>
        
        {userName ? (
          <>
            <NavItem>
              <StyledNavLink to="/chat" className={({ isActive }) => isActive ? 'active' : ''}>
                Chat
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                Profile
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                Settings
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
                About
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <LogoutButton onClick={handleLogout}>
                Logout
              </LogoutButton>
            </NavItem>
          </>
        ) : (
          <>
            <NavItem>
              <StyledNavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
                About
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
                Login
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <SignUpButton onClick={() => navigate('/signup')}>
                Sign Up
              </SignUpButton>
            </NavItem>
          </>
        )}
      </NavList>

      {userName && (
        <WelcomeMessage>
          Welcome, {userName}!
        </WelcomeMessage>
      )}
    </Nav>
  );
};

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #6a1b9a;
  padding: 15px 20px;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .english {
    font-family: "Poppins", sans-serif;
    font-weight: bold;
    font-size: 28px;
    color: #ffffff;
    letter-spacing: 2px;
    margin-bottom: 2px;
  }

  .marathi {
    font-family: "Lohit Devanagari", sans-serif;
    font-size: 28px;
    color: #FF6F00;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 768px) {
    .english {
      font-size: 24px;
    }
    .marathi {
      font-size: 24px;
    }
  }
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
`;

const NavItem = styled.li`
  margin: 0;
`;

const StyledNavLink = styled(NavLink)`
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 20px;
  transition: all 0.3s ease;
  display: block;

  &.active {
    background-color: #ab47bc;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const SignUpButton = styled.button`
  background-color: #FF8F00;
  border: none;
  color: #fff;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #FFA726;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const LogoutButton = styled.button`
  background-color: #f44336;
  border: none;
  color: #fff;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #d32f2f;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const WelcomeMessage = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px 15px;
  border-radius: 20px;

  @media (max-width: 768px) {
    font-size: 14px;
    text-align: center;
  }
`;

export default Navbar;