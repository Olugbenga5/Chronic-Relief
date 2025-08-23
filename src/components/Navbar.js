// Navbar.js
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Stack, Button } from "@mui/material";
import Logo from "../assets/images/Logo.png";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state + selectedArea fetch
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

  // Determine the routines href
  const routineHref = useMemo(() => {
    if (!user) return "/login";
    return selectedArea ? `/routine/${selectedArea}` : "/landing";
  }, [user, selectedArea]);

  // Active link styles (supports startsWith for grouped routes)
  const isActive = (path, opts = {}) => {
    const { startsWith = false } = opts;
    if (startsWith) return location.pathname.startsWith(path);
    return location.pathname === path;
  };

  const linkStyle = (path, opts) => ({
    textDecoration: "none",
    color: "#3A1212",
    fontWeight: 700,
    borderBottom: (opts?.startsWith ? isActive(path, { startsWith: true }) : isActive(path))
      ? "3px solid #FF2625"
      : "3px solid transparent",
    paddingBottom: 4,
  });

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      px="20px"
      py="10px"
      sx={{
        position: "sticky",
        top: 0,
        width: "100%",
        zIndex: 1000,
        backgroundColor: "#fff",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Link to={user ? "/landing" : "/"}>
        <img src={Logo} alt="logo" style={{ width: 48, height: 48 }} />
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
              to={routineHref}
              style={linkStyle("/routine", { startsWith: true })}
            >
              Routines{selectedArea ? ` (${selectedArea})` : ""}
            </Link>

            <Link to="/history" style={linkStyle("/history")}>History</Link>
            <Link to="/favorites" style={linkStyle("/favorites")}>Favorites</Link>
            <Link to="/faq" style={linkStyle("/faq")}>FAQ</Link>
            <Link to="/profile" style={linkStyle("/profile")}>Profile</Link>

            <Button
              onClick={handleLogout}
              sx={{ color: "#d32f2f", fontWeight: 700, textTransform: "none" }}
            >
              Logout
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default Navbar;
