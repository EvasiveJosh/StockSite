import React, { useState } from 'react';
import "../styling/Signup.css";

export const Login = () => {
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      username:username,
      password:password,
      email:email
    };

    try {
      const response = await fetch('http://localhost:5069/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
        onSignup(result.id);
        setUsername('');
        setPassword('');
        setEmail('');
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className='flex'>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Enter Email" id="email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
        <input type="text" placeholder="Enter Username" id="username" value={username} onChange={(e)=>setUsername(e.target.value)}/>
        <input type="text" placeholder="Enter Password" id="password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
        <button type="submit">Confirm and Pay</button>
      </form>
    </div>
  );
};
