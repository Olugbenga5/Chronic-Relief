import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import "./App.css";

import Signup from "./pages/Signup.js";
import Login from "./pages/Login.js";
import ExerciseDetail from "./pages/ExerciseDetail.js";
import Home from "./pages/Home.js";
import Landing from "./pages/Landing.js";
import PainAreaRoutine from "./pages/PainAreaRoutine.js";
import RoutineHistory from "./pages/RoutineHistory.js";
import Favorites from "./pages/Favorites.js";    
import Profile from "./pages/Profile.js";         

import Navbar from "./components/Navbar.js";
import PrivateRoute from "./components/PrivateRoute";
import FaqAsk from "./components/FaqAsk.js";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Redirect logged-in users who land on "/" to "/landing"
function AuthAwareRedirect() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsAuthed(!!u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (isAuthed && location.pathname === "/") {
      navigate("/landing", { replace: true });
    }
  }, [ready, isAuthed, location.pathname, navigate]);

  return null;
}

const App = () => (
  <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "#ffffff" }}>
    <Navbar />
    <AuthAwareRedirect />

    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/faq" element={<PrivateRoute> <FaqAsk /> </PrivateRoute>}/>
        <Route path="/landing" element={<PrivateRoute> <Landing /> </PrivateRoute>}/>
        <Route path="/exercise/:id" element={<PrivateRoute> <ExerciseDetail /> </PrivateRoute>}/>
        <Route path="/routine/:area" element={<PrivateRoute> <PainAreaRoutine /> </PrivateRoute>}/>
        <Route path="/history" element={<PrivateRoute> <RoutineHistory /> </PrivateRoute>}/>
        <Route path="/favorites" element={<PrivateRoute> <Favorites /> </PrivateRoute>}/>
        <Route path="/profile" element={<PrivateRoute> <Profile /> </PrivateRoute>}/>
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  </Box>
);

export default App;
