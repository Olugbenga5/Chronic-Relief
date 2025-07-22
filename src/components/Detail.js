import React from 'react';
import { Typography, Stack, Button } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonRunning, faBullseye, faDumbbell } from '@fortawesome/free-solid-svg-icons';

const Detail = ({ exerciseDetail }) => {
  const { bodyPart, gifUrl, name, target, equipment } = exerciseDetail;

  const extraDetail = [
    {
      icon: faPersonRunning,
      name: bodyPart,
    },
    {
      icon: faBullseye,
      name: target,
    },
    {
      icon: faDumbbell,
      name: equipment,
    },
  ];

  return (
    <Stack gap="60px" sx={{ flexDirection: { lg: 'row' }, p: '20px', alignItems: 'center' }}>
      <img src={gifUrl} alt={name} loading="lazy" className="detail-image" />

      <Stack sx={{ gap: { lg: '35px', xs: '20px' } }}>
        <Typography variant="h3" textTransform="capitalize">
          {name}
        </Typography>
        <Typography variant="h6">
          Exercises help you build strength. <strong>{name}</strong> is one of the best exercises to target your <strong>{target}</strong>. It will help you improve your mood and relieve pain in your <strong>{bodyPart}</strong>.
        </Typography>

        {extraDetail.map((item) => (
          <Stack key={item.name} direction="row" gap="24px" alignItems="center">
            <Button sx={{background: '#fff2db', borderRadius: '50%', width: '100px', height: '100px',}}>
              <FontAwesomeIcon icon={item.icon} size="2x" />
            </Button>
            <Typography variant="h5" textTransform="capitalize">
              {item.name}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

export default Detail;
