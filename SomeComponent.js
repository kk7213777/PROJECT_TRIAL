//THis file is src/componets/SomeComponents.js

import React, { useContext } from 'react';
import { UserContext } from '../pages/UserContext'; 

const WelcomeUser = () => {
  const { userName } = useContext(UserContext);

  return (
    <div>
      Welcome, {userName || 'Guest'}!
    </div>
  );
};

export default WelcomeUser;
