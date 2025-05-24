
//This is src/pages/SettingsPage.js

import React, { useState, useContext } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { UserContext } from './UserContext';
import Navbar from '../components/Navbar';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { userName } = useContext(UserContext);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailChange = (e) => {
    setEmailData({
      ...emailData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/update-user-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    
    if (!emailData.newEmail || !emailData.newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/update-user-email', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Email updated successfully!');
        setEmailData({ newEmail: '' });
      } else {
        setError(data.message || 'Failed to update email');
      }
    } catch (err) {
      console.error('Email update error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  if (!userName) {
    return (
      <PageContainer>
        <Navbar />
        <SettingsSection>
          <MessageText>Please log in to access settings.</MessageText>
        </SettingsSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <SettingsSection>
        <SettingsHeader>
          <h1>Settings</h1>
          <p>Manage your account preferences and security settings</p>
        </SettingsHeader>

        {message && <SuccessMessage>{message}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <SettingsContainer>
          {/* Password Change Section */}
          <SettingsCard>
            <CardTitle>Change Password</CardTitle>
            <SettingsForm onSubmit={handlePasswordUpdate}>
              <FormField>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  required
                />
              </FormField>
              <FormField>
                <Label>New Password</Label>
                <Input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  required
                />
              </FormField>
              <FormField>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                />
              </FormField>
              <SaveButton type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </SaveButton>
            </SettingsForm>
          </SettingsCard>

          {/* Email Update Section */}
          <SettingsCard>
            <CardTitle>Update Email</CardTitle>
            <SettingsForm onSubmit={handleEmailUpdate}>
              <FormField>
                <Label>New Email Address</Label>
                <Input
                  type="email"
                  name="newEmail"
                  value={emailData.newEmail}
                  onChange={handleEmailChange}
                  placeholder="Enter new email address"
                  required
                />
              </FormField>
              <SaveButton type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Email'}
              </SaveButton>
            </SettingsForm>
          </SettingsCard>

          {/* Preferences Section */}
          <SettingsCard>
            <CardTitle>Preferences</CardTitle>
            <FormField>
              <Label>Language Preference</Label>
              <Select>
                <Option value="english">English</Option>
                <Option value="marathi">Marathi</Option>
                <Option value="hindi">Hindi</Option>
              </Select>
            </FormField>
            <FormField>
              <Label>Theme</Label>
              <Select>
                <Option value="light">Light</Option>
                <Option value="dark">Dark</Option>
                <Option value="auto">Auto</Option>
              </Select>
            </FormField>
            <SaveButton type="button">
              Save Preferences
            </SaveButton>
          </SettingsCard>
        </SettingsContainer>
      </SettingsSection>
    </PageContainer>
  );
};

export default SettingsPage;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Poppins", "Lohit Devanagari", sans-serif;
`;

const SettingsSection = styled.section`
  flex: 1;
  background: linear-gradient(135deg, #6a1b9a, #ab47bc);
  color: #fff;
  padding: 40px 20px;
`;

const SettingsHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
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
    opacity: 0.9;
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
`;

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SettingsCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const CardTitle = styled.h2`
  color: #6a1b9a;
  font-size: 24px;
  margin-bottom: 20px;
  border-bottom: 2px solid #6a1b9a;
  padding-bottom: 10px;
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 600;
  color: #6a1b9a;
`;

const Input = styled.input`
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: #6a1b9a;
    box-shadow: 0 0 5px rgba(106, 27, 154, 0.3);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  background-color: white;
  
  &:focus {
    border-color: #6a1b9a;
  }
`;

const Option = styled.option``;

const SaveButton = styled.button`
  background-color: #6a1b9a;
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  
  &:hover:not(:disabled) {
    background-color: #8e24aa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  background-color: #4caf50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background-color: #f44336;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
`;

const MessageText = styled.p`
  font-size: 18px;
  text-align: center;
  margin-top: 50px;
`;