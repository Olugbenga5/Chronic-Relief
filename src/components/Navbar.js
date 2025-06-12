import React from 'react';
import { Link } from 'react-router-dom';
import { Stack } from '@mui/material';
import Logo from '../assets/images/Logo.png';

const Navbar = () => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      px="20px"
      py="10px"
      sx={{
        position: 'sticky',     // or 'fixed' if you want it always visible
        top: 0,
        width: '100%',
        zIndex: 1000,
        backgroundColor: '#fff',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Link to="/">
        <img src={Logo} alt="logo" style={{ width: '48px', height: '48px' }} />
      </Link>

      <Stack direction="row" gap="20px">
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: '#3A1212',
            borderBottom: '3px solid #FF2625',
            fontWeight: 'bold',
          }}
        >
          Home
        </Link>
        <a
          href="#exercises"
          style={{
            textDecoration: 'none',
            color: '#3A1212',
            fontWeight: 'bold',
          }}
        >
          Exercises
        </a>
      </Stack>
    </Stack>
  );
};

export default Navbar;
