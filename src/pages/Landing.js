import React from 'react';
import { Box } from '@mui/material';
import Exercises from '../components/Exercises';
import SearchExercises from '../components/SearchExercises';
import HeroBanner from '../components/HeroBanner';

const Landing = () => {
  return (
    <Box className="landing-wrapper">
      <HeroBanner />
      <SearchExercises />
      <Exercises />
    </Box>
  );
};

export default Landing;
