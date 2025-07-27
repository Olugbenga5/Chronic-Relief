import React from 'react';
import { Box, Typography } from '@mui/material';
import Herobanner from '../assets/images/Herobanner.webp';

function HeroBanner() {
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
      </Box>

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={Herobanner}
          alt="hero banner"
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
