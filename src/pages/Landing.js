import React from 'react';
import { Box } from '@mui/material';
import Exercises from '../components/Exercises';
import SearchExercises from '../components/SearchExercises';
import HeroBanner from '../components/HeroBanner';
import { useState } from 'react';

const Landing = () => {
    const [exercises, setExercises] = useState([])
    const [bodyPart, setBodyPart] = useState(['all'])

  return (
    <Box className="landing-wrapper">
      <HeroBanner />
      <SearchExercises setExercises={setExercises} bodyPart = {bodyPart} setBodyPart={setBodyPart}/>
      <Exercises exercises={exercises} setExercises={setExercises} bodyPart = {bodyPart} 
      />
    </Box>
  );
};

export default Landing;
