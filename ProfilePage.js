import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserContext } from './UserContext';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profile_pic: ''
  });

  const navigate = useNavigate();
  const {setUserName } = useContext(UserContext);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:8080/user-profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success && data.data) {
          setUser(data.data);
          setFormData({
            name: data.data.name,
            profile_pic: data.data.profile_pic || ''
          });
          setUserName(data.data.name); // Update context
        } else {
          throw new Error(data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        if (err.message.includes('401') || err.message.includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
          navigate('/login');
        } else {
          setError('Failed to fetch user profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, setUserName]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/update-user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setUser({ ...user, ...formData });
        setUserName(formData.name);
        localStorage.setItem('userName', formData.name);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <ContentContainer>
          <Message>Loading profile...</Message>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Navbar />
        <ContentContainer>
          <Message>{error}</Message>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <ProfileContainer>
          <Heading>User Profile</Heading>
          <ProfileImage
            src={user?.profile_pic || '/api/placeholder/150/150'}
            alt={`${user?.name}'s profile`}
          />
          
          {editing ? (
            <EditForm onSubmit={handleUpdateProfile}>
              <FormGroup>
                <Label>Name:</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Profile Picture URL:</Label>
                <Input
                  type="url"
                  name="profile_pic"
                  value={formData.profile_pic}
                  onChange={handleInputChange}
                  placeholder="Enter image URL"
                />
              </FormGroup>
              <ButtonGroup>
                <SaveButton type="submit">Save Changes</SaveButton>
                <CancelButton type="button" onClick={() => setEditing(false)}>
                  Cancel
                </CancelButton>
              </ButtonGroup>
            </EditForm>
          ) : (
            <DetailsContainer>
              <Detail>
                <strong>Name:</strong> {user?.name}
              </Detail>
              <Detail>
                <strong>Email:</strong> {user?.email}
              </Detail>
              <Detail>
                <strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Detail>
              <EditButton onClick={() => setEditing(true)}>
                Edit Profile
              </EditButton>
            </DetailsContainer>
          )}
        </ProfileContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default ProfilePage;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: "Poppins", sans-serif;
`;

const ContentContainer = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #6a1b9a, #ab47bc);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
`;

const Heading = styled.h1`
  font-size: 2rem;
  color: #6a1b9a;
  margin-bottom: 20px;
  text-align: center;
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #6a1b9a;
  margin-bottom: 20px;
`;

const DetailsContainer = styled.div`
  text-align: center;
  width: 100%;
`;

const Detail = styled.p`
  font-size: 1.2rem;
  color: #555;
  margin: 15px 0;
  text-align: left;
`;

const EditForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: bold;
  color: #6a1b9a;
  font-size: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: #6a1b9a;
    box-shadow: 0 0 5px rgba(106, 27, 154, 0.3);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
`;

const EditButton = styled.button`
  background-color: #6a1b9a;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #8e24aa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const SaveButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const CancelButton = styled.button`
  background-color: #f44336;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #d32f2f;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const Message = styled.p`
  font-size: 1.5rem;
  color: white;
  text-align: center;
  margin-top: 50px;
`;