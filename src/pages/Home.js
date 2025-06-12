import React, { useState } from 'react';
import "../App.css"; // Ensure styles are applied`

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to Chronic Relief</h1>
      <p>Your guide to personalized exercises for pain relief.</p>

      <div className="home-content">
        <p>Choose an area of discomfort and explore exercises tailored to your needs.</p>
      </div>
    </div>
  );
};

export default Home;
