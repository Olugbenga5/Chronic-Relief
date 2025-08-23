// components/Exercises.js
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Pagination, Stack, Typography } from '@mui/material';
import ExerciseCard from './ExerciseCard';

const Exercises = ({ exercises, setExercises, bodyPart }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const exercisePerPage = 8;

  // 1) Filter first
  const filteredExercises = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    const bp = (bodyPart || 'all').toLowerCase();
    if (bp === 'all') return exercises;

    return exercises.filter((ex) =>
      (bodyPart === 'Back'  && (ex.bodyPart?.toLowerCase() === 'back' || ex.bodyPart?.toLowerCase() === 'lower back')) ||
      (bodyPart === 'Knees' &&  ex.bodyPart?.toLowerCase() === 'upper legs') ||
      (bodyPart === 'Ankle' &&  ex.bodyPart?.toLowerCase() === 'lower legs')
    );
  }, [exercises, bodyPart]);

  // 2) Reset page whenever dataset or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [bodyPart, exercises]);

  // 3) Slice AFTER filtering
  const indexOfLast = currentPage * exercisePerPage;
  const indexOfFirst = indexOfLast - exercisePerPage;
  const pageItems = filteredExercises.slice(indexOfFirst, indexOfLast);

  const paginate = (_e, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 1800, behavior: 'smooth' });
  };

  return (
    <Box id="exercises" sx={{ mt: { lg: '110px' } }} mt="50px" p="20px">
      <Typography variant="h3" mb="46px">
        Showing Results
      </Typography>

      <Stack direction="row" sx={{ gap: { lg: '110px', xs: '50px' } }} flexWrap="wrap" justifyContent="center">
        {pageItems.length === 0 ? (
          <Typography>No exercises found.</Typography>
        ) : (
          pageItems.map((exercise, idx) => (
            <ExerciseCard key={exercise.id || idx} exercise={exercise} />
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
