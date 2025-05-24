//This is src/pages/HomePage.js


import React, { useContext } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { UserContext } from './UserContext';
import Navbar from '../components/Navbar';

const HomePage = () => {
  const navigate = useNavigate();
  const { userName } = useContext(UserContext);

  return (
    <PageContainer>
      <Navbar />
      
      <HeroSection>
        <HeroText>
          <h1>
            Welcome to <Highlight>संवाद</Highlight>
          </h1>
          <p>Connect. Communicate. Collaborate.</p>
          {!userName ? (
            <ActionButton onClick={() => navigate("/signup")}>Get Started</ActionButton>
          ) : (
            <ActionButton onClick={() => navigate("/chat")}>Start Chatting</ActionButton>
          )}
        </HeroText>
      </HeroSection>
      
      <Footer>
        <FooterLinks>
          <FooterLink onClick={() => navigate("/about")}>About</FooterLink>
          <FooterLink>Privacy Policy</FooterLink>
          <FooterLink>Terms of Service</FooterLink>
        </FooterLinks>
      </Footer>
    </PageContainer>
  );
};

export default HomePage;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Poppins", "Lohit Devanagari", sans-serif;
`;

const HeroSection = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background: linear-gradient(135deg, #6a1b9a, #ab47bc);
  color: #fff;
  text-align: center;
  padding: 50px 20px;
`;

const HeroText = styled.div`
  max-width: 600px;
  
  h1 {
    font-size: 48px;
    margin-bottom: 10px;
    font-family: "Lohit Devanagari", sans-serif;
    
    @media (max-width: 768px) {
      font-size: 36px;
    }
  }
  
  p {
    font-size: 18px;
    margin-bottom: 20px;
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
`;

const Highlight = styled.span`
  font-family: "Dancing Script", cursive;
  font-size: 80px;
  color: #FF6F00;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease-in-out;
  
  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    font-size: 60px;
  }
`;

const ActionButton = styled.button`
  background-color: #FF8F00;
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #FFA726;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const Footer = styled.footer`
  background-color: #2d3436;
  color: #dfe6e9;
  padding: 15px 20px;
  text-align: center;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
`;

const FooterLink = styled.span`
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
  
  &:hover {
    text-decoration: underline;
    color: #74b9ff;
  }
`;