

// App.js

import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import "./App.css";
import Signup from "./pages/Signup.js";
import Login from "./pages/Login.js";
import ExerciseDetail from "./pages/ExerciseDetail.js";
import Home from "./pages/Home.js";
import Navbar from "./components/Navbar.js";
import Footer from "./components/Footer.js";
import Landing from "./pages/Landing.js";

const App = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#ffffff",  // ← full‐viewport white
    }}
  >
    <Navbar />

    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>

    <Footer />
  </Box>
);

export default App;