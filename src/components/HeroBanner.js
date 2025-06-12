import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Herobanner from '../assets/images/Herobanner.webp';

function HeroBanner() {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate('/exercises'); 
  };

  return (
    <Box
      sx={{
        mt: { lg: '212px', xs: '70px' },
        display: 'flex',
        flexDirection: { lg: 'row', xs: 'column' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '20px',
      }}
      position="relative"
      p="20px"
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          className="chronic-header"
          fontWeight={800}
          fontSize="28px"
          sx={{ mb: '10px' }}
        >
          Chronic Relief
        </Typography>

        <Typography fontWeight={700} sx={{ fontSize: { lg: '44px', xs: '40px' }}} mb="23px" mt="30px">
          Feel Stronger <br /> Every Step of the Way.
        </Typography>

        <Typography fontSize="22px" lineHeight="35px" mb={4}>
          Check out the most effective exercises.
        </Typography>

        {/* ✅ Button now centers on mobile */}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', lg: 'flex-start' } }}>
          <Button
            variant="contained"
            className="landing-btn"
            onClick={handleExplore}
          >
            Explore All Exercises
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={Herobanner}
          alt="hero banner illustration"
          sx={{
            width: { xs: '100%', sm: '80%', md: '100%' },
            maxWidth: '600px',
            height: 'auto',
            objectFit: 'cover',
          }}
        />
      </Box>
    </Box>
  );
}

export default HeroBanner;
