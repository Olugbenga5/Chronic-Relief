import React, { useEffect, useMemo, useState } from 'react';
import { Box, Pagination, Stack, Typography } from '@mui/material';
import ExerciseCard from './ExerciseCard';

const Exercises = ({ exercises, setExercises, bodyPart }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const exercisePerPage = 8;

  // Filter first
  const filteredExercises = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    const bp = (bodyPart || 'all').toLowerCase();

    if (bp === 'all') return exercises;

    return exercises.filter((ex) =>
      (bodyPart === 'Back' && (ex.bodyPart === 'back' || ex.bodyPart === 'lower back')) ||
      (bodyPart === 'Knees' && ex.bodyPart === 'upper legs') ||
      (bodyPart === 'Ankle' && ex.bodyPart === 'lower legs')
    );
  }, [exercises, bodyPart]);

  // Compute current page after filtering
  const indexOfLastExercise = currentPage * exercisePerPage;
  const indexOfFirstExercise = indexOfLastExercise - exercisePerPage;
  const currentExercises = filteredExercises.slice(indexOfFirstExercise, indexOfLastExercise);

  // Reset pagination when filters or dataset change
  useEffect(() => {
    setCurrentPage(1);
  }, [bodyPart, exercises]);

  const paginate = (_e, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 1800, behavior: 'smooth' });
  };

  return (
    <Box id="exercises" sx={{ mt: { lg: '110px' } }} mt="50px" p="20px">
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

      <Stack mt="100px" alignItems="center">
        {filteredExercises.length > exercisePerPage && (
          <Pagination
            color="standard"
            shape="rounded"
            page={currentPage}
            count={Math.ceil(filteredExercises.length / exercisePerPage)}
            onChange={paginate}
            size="large"
          />
        )}
      </Stack>
    </Box>
  );
};

export default Exercises;
