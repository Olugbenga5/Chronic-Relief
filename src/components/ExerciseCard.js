import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';

const ExerciseCard = ({ exercise }) => {
  if (!exercise) return null; 

  return (
    <Link className="exercise-card" to={`/exercise/${exercise.id}`}>
      <Box
        sx={{
          width: '250px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          padding: '10px',
          marginBottom: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f8f8',
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          borderTop: '4px solid transparent',
          '&:hover': {
            transform: 'scale(1.03)',
            borderTop: '4px solid #ff2625',
          },
        }}
      >
        <img
          src={exercise.gifUrl}
          alt={exercise.name}
          loading="lazy"
          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
        />

        <Stack direction="row" spacing={1} justifyContent="center" mt={1} mb={1}>
          <Button
            sx={{
              backgroundColor: '#ffa9a9',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '20px',
              textTransform: 'capitalize',
              padding: '5px 15px',
              minWidth: 'fit-content',
              '&:hover': {
                backgroundColor: '#ff7f7f',
              },
            }}
          >
            {exercise.bodyPart}
          </Button>

          <Button
            sx={{
              backgroundColor: '#ffa9a9',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '20px',
              textTransform: 'capitalize',
              padding: '5px 15px',
              minWidth: 'fit-content',
              '&:hover': {
                backgroundColor: '#fcc757',
              },
            }}
          >
            {exercise.target}
          </Button>
        </Stack>

        <Typography mt="10px" fontWeight="bold" textTransform="capitalize">
          {exercise.name}
        </Typography>
      </Box>
    </Link>
  );
};

export default ExerciseCard;
