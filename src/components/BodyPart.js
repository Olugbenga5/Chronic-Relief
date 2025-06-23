import React from 'react';
import { Stack, Typography } from '@mui/material';
import Icon from '../assets/icons/cri.png';

const BodyPart = ({ item, setBodyPart, bodyPart }) => {
  const isSelected = bodyPart === item;

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      className="bodyPart-card"
      sx={{
        borderTop: isSelected ? '4px solid #ff2625' : '',
        backgroundColor: '#fff',
        borderBottomLeftRadius: '20px',
        width: '200px',
        height: '200px',
        cursor: 'pointer',
        gap: '20px',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
      onClick={()=> {
        setBodyPart(item);
        window.scrollTo({top: 1800, left : 100, behavior: 'smooth'})
      }}
    >
      <img
        src={Icon}
        alt="dumbbell"
        style={{ width: '60px', height: '60px' }}
      />
      <Typography textTransform="capitalize" fontWeight="bold" color="#3A1212">
        {item}
      </Typography>
    </Stack>
  );
};

export default BodyPart;
