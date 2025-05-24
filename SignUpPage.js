//This is src/pages/SignUpPage.js


import React, { useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiServices';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #6a1b9a, #8e24aa);
  color: #fff;
  font-family: 'Arial', sans-serif;
`;

const FormWrapper = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 30px 40px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  color: #333;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  color: #6a1b9a;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
`;

const Button = styled.button`
  background: #6a1b9a;
  color: #fff;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
  &:hover {
    background: #8e24aa;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 14px;
`;

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profile_pic: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.signUp(formData);
      setSuccess(response.message || 'Sign-up successful!');
      setError('');
    } catch (err) {
      setError(err.message || 'An error occurred.');
      setSuccess('');
    }
  };

  return (
    <Container>
      <FormWrapper>
        <Title>Sign Up</Title>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <Input
            type="text"
            name="profile_pic"
            placeholder="Profile Picture URL (Optional)"
            value={formData.profile_pic}
            onChange={handleChange}
          />
          <Button type="submit">Sign Up</Button>
        </form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </FormWrapper>
    </Container>
  );
};

export default SignUpPage;
