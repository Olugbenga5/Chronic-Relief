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

const App = () => {
  return (
    <Box width="400px" sx={{ width: { xl: "1488px" } }} m="auto">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </Box>
  );
};

export default App;
