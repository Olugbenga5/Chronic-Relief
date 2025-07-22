import React,{useEffect, useState} from 'react';
import { Box, Pagination, Stack, Typography } from '@mui/material';
import ExerciseCard from './ExerciseCard';

const Exercises = ({ exercises, setExercises, bodyPart }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const exercisePerPage = 8;

  const indexOfLastExercise = currentPage * exercisePerPage;
  const indexOfFirstExercise = indexOfLastExercise - exercisePerPage;
  const currentExercises = exercises.slice(indexOfFirstExercise, indexOfLastExercise);

  const paginate = (e, value)=> {
    setCurrentPage(value);
    window.scrollTo({top:1800, behavior: 'smooth'})
    
  }

  const filteredExercises =
    bodyPart.toLowerCase() === 'all'
      ? exercises
      : exercises.filter((ex) =>
          (bodyPart === 'Back' && (ex.bodyPart === 'back' || ex.bodyPart === 'lower back')) ||
          (bodyPart === 'Knees' && ex.bodyPart === 'upper legs') ||
          (bodyPart === 'Ankle' && ex.bodyPart === 'lower legs')
        );

  return (
    <Box
      id="exercises"
      sx={{ mt: { lg: '110px' } }}
      mt="50px"
      p="20px"
    >
      <Typography variant="h3" mb="46px">
        Showing Results
      </Typography>

      <Stack
        direction="row"
        sx={{ gap: { lg: '110px', xs: '50px' } }}
        flexWrap="wrap"
        justifyContent="center"
      >
        {filteredExercises.length === 0 ? (
          <Typography>No exercises found.</Typography>
        ) : (
          currentExercises.map((exercise, index) => (
            <ExerciseCard key={exercise.id || index} exercise={exercise} />
          ))
        )}
      </Stack>
      <Stack mt= "100px" alignItems="center">
        {exercises.length > 9 && (
          <Pagination color ="standard" shape = "rounded" defaultPage={1} count={Math.ceil(exercises.length/exercisePerPage)} page = {currentPage} onChange={paginate} size = "large"/>
        )}
      </Stack>
    </Box>
  );
};

export default Exercises;
