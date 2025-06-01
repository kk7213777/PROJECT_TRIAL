// src/pages/UserContext.js - Updated version
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get userName from localStorage on component mount
    const storedUserName = localStorage.getItem('userName');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUserName) {
      setUserName(storedUserName);
    }
    
    // Try to parse stored user data
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    // Save userName to localStorage whenever it changes
    if (userName) {
      localStorage.setItem('userName', userName);
    } else {
      localStorage.removeItem('userName');
    }
  }, [userName]);

  useEffect(() => {
    // Save currentUser to localStorage whenever it changes
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const logout = () => {
    setUserName('');
    setCurrentUser(null);
    localStorage.removeItem('userName');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    const user = {
      name: userData.name,
      email: userData.email,
      id: userData.id,
      profile_pic: userData.profile_pic
    };
    setCurrentUser(user);
    setUserName(user.name);
  };

  const value = {
    userName,
    setUserName,
    currentUser,
    setCurrentUser,
    logout,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};