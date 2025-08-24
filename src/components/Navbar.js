import React, { useEffect, useState, useMemo } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Logo from "../assets/images/Logo.png";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);

      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);
          const area = snap.exists() ? snap.data()?.selectedArea || null : null;
          setSelectedArea(area);
        } catch (err) {
          console.error("Failed to fetch selected area:", err);
          setSelectedArea(null);
        }
      } else {
        setSelectedArea(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Sign out failed:", e);
      alert("Sign out failed. Please try again.");
    }
  };

  const routineHref = useMemo(() => {
    if (!user) return "/login";
    return selectedArea ? `/routine/${selectedArea}` : "/landing";
  }, [user, selectedArea]);

  const isActive = (path, opts = {}) => {
    const { startsWith = false } = opts;
    if (startsWith) return location.pathname.startsWith(path);
    return location.pathname === path;
  };

  const linkSx = (path, opts) => ({
    color: "inherit",
    textTransform: "none",
    fontWeight: isActive(path, opts) ? 700 : 500,
    borderBottom: isActive(path, opts) ? "2px solid currentColor" : "2px solid transparent",
    borderRadius: 0,
  });

  const DesktopLinks = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      {!user ? (
        <>
          <Button component={RouterLink} to="/" sx={linkSx("/")}>Home</Button>
          <Button component={RouterLink} to="/login" sx={linkSx("/login")}>Login</Button>
          <Button component={RouterLink} to="/signup" variant="contained" disableElevation sx={{ textTransform: "none", borderRadius: 2 }}>
            Sign Up
          </Button>
        </>
      ) : (
        <>
          <Button component={RouterLink} to="/landing" sx={linkSx("/landing")}>Home</Button>
          <Button component={RouterLink} to={routineHref} sx={linkSx("/routine", { startsWith: true })}>
            Routines{selectedArea ? ` (${selectedArea})` : ""}
          </Button>
          <Button component={RouterLink} to="/history" sx={linkSx("/history")}>History</Button>
          <Button component={RouterLink} to="/favorites" sx={linkSx("/favorites")}>Favorites</Button>
          <Button component={RouterLink} to="/faq" sx={linkSx("/faq")}>FAQ</Button>
          <Button component={RouterLink} to="/profile" sx={linkSx("/profile")}>Profile</Button>
          <Button onClick={handleLogout} sx={{ color: "#d32f2f", textTransform: "none", fontWeight: 700 }}>
            Logout
          </Button>
        </>
      )}
    </Stack>
  );

  const MobileMenu = () => (
    <Box sx={{ width: 280 }} role="presentation" onClick={() => setOpen(false)}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Box component="img" src={Logo} alt="Chronic Relief" sx={{ height: 36 }} />
        <Typography variant="h6" fontWeight={800}>Chronic Relief</Typography>
      </Box>
      <Divider />
      <List>
        {!user ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/">
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/login">
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/signup">
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/landing">
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to={routineHref}>
                <ListItemText primary={`Routines${selectedArea ? ` (${selectedArea})` : ""}`} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/history">
                <ListItemText primary="History" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/favorites">
                <ListItemText primary="Favorites" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/faq">
                <ListItemText primary="FAQ" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/profile">
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>

            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="Logout" sx={{ color: "#d32f2f", fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(53, 52, 52, 0.75)",
          color: "#1a1a1a",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar sx={{ maxWidth: "1200px", mx: "auto", width: "100%", px: 2, minHeight: 72 }}>
          <Box component={RouterLink} to={user ? "/landing" : "/"} sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", color: "inherit" }}>
            <Box component="img" src={Logo} alt="logo" sx={{ width: 40, height: 40, borderRadius: "10px" }} />
            <Typography variant="h6" fontWeight={800}>Chronic Relief</Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <DesktopLinks />
          </Box>

          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <IconButton size="large" edge="end" onClick={() => setOpen(true)} sx={{ color: "inherit" }} aria-label="open navigation">
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <MobileMenu />
      </Drawer>
    </>
  );
};

export default Navbar;
