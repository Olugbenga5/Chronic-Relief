import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Stack, Button } from '@mui/material';
import Logo from '../assets/images/Logo.png';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists() && snap.data().selectedArea) {
            setSelectedArea(snap.data().selectedArea);
          }
        } catch (err) {
          console.error('Failed to fetch selected area:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const linkStyle = (path) => ({
    textDecoration: 'none',
    color: '#3A1212',
    fontWeight: 'bold',
    borderBottom: location.pathname === path ? '3px solid #FF2625' : 'none',
  });

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      px="20px"
      py="10px"
      sx={{
        position: 'sticky',
        top: 0,
        width: '100%',
        zIndex: 1000,
        backgroundColor: '#fff',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Link to={user ? "/landing" : "/"}>
        <img src={Logo} alt="logo" style={{ width: '48px', height: '48px' }} />
      </Link>

      <Stack direction="row" gap="20px" alignItems="center">
        {!user ? (
          <>
            <Link to="/" style={linkStyle("/")}>Home</Link>
            <Link to="/login" style={linkStyle("/login")}>Login</Link>
            <Link to="/signup" style={linkStyle("/signup")}>Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/landing" style={linkStyle("/landing")}>Home</Link>
            <Link
              to={selectedArea ? `/routine/${selectedArea}` : '/landing'}
              style={
                location.pathname.startsWith("/routine")
                  ? { ...linkStyle(`/routine/${selectedArea}`), borderBottom: '3px solid #FF2625' }
                  : linkStyle(`/routine/${selectedArea}`)
              }
            >
              Routines
            </Link>
            <Link to="/routine-history" style={linkStyle("/routine-history")}>History</Link>
            <Link to="/profile" style={linkStyle("/profile")}>Profile</Link>
            <Button onClick={handleLogout} sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
              Logout
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default Navbar;
