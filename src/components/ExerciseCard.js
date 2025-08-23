import React, { useMemo, useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';

const cap = (s) => (s ? String(s).toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()) : '');

const ExerciseCard = ({ exercise }) => {
  if (!exercise) return null;

  const [imgError, setImgError] = useState(false);

  // Ensure HTTPS to avoid mixed‑content blocking on Vercel
  const safeGifUrl = useMemo(() => {
    const url = exercise.gifUrl || '';
    return url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url;
  }, [exercise.gifUrl]);

  const id = exercise.id ?? exercise._id ?? '';
  const name = cap(exercise.name || 'Exercise');
  const bodyPart = cap(exercise.bodyPart || '');
  const target = cap(exercise.target || '');

  return (
    <Link className="exercise-card" to={`/exercise/${id}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          width: 260,
          border: '1px solid #e7e7e7',
          borderRadius: '12px',
          p: '12px',
          mb: '20px',
          textAlign: 'center',
          bgcolor: '#f8f8f8',
          transition: 'transform 0.2s ease, border-top-color 0.2s ease',
          position: 'relative',
          borderTop: '4px solid transparent',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderTop: '4px solid #ff2625',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          },
        }}
      >
        {/* Image / Fallback */}
        {!imgError && safeGifUrl ? (
          <img
            src={safeGifUrl}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              borderRadius: 8,
              background: '#fff',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              bgcolor: '#ffffff',
              border: '1px dashed #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#777',
            }}
          >
            Image not available
          </Box>
        )}

        {/* Tags */}
        <Stack direction="row" spacing={1} justifyContent="center" mt={1.25} mb={1}>
          {bodyPart && (
            <Button
              sx={{
                backgroundColor: '#ffa9a9',
                color: '#fff',
                fontSize: 13,
                borderRadius: '20px',
                textTransform: 'capitalize',
                px: 1.75,
                py: 0.5,
                minWidth: 'fit-content',
                '&:hover': { backgroundColor: '#ff7f7f' },
              }}
            >
              {bodyPart}
            </Button>
          )}
          {target && (
            <Button
              sx={{
                backgroundColor: '#fcc757',
                color: '#fff',
                fontSize: 13,
                borderRadius: '20px',
                textTransform: 'capitalize',
                px: 1.75,
                py: 0.5,
                minWidth: 'fit-content',
                '&:hover': { backgroundColor: '#f7b632' },
              }}
            >
              {target}
            </Button>
          )}
        </Stack>

        {/* Name */}
        <Typography
          mt="10px"
          fontWeight="bold"
          textTransform="none"
          sx={{
            color: '#222',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 44,
          }}
        >
          {name}
        </Typography>
      </Box>
    </Link>
  );
};

export default ExerciseCard;
