// App.js

import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import "./App.css";
import Signup from "./pages/Signup.js";
import Login from "./pages/Login.js";
import ExerciseDetail from "./pages/ExerciseDetail.js";
import Home from "./pages/Home.js";
import Landing from "./pages/Landing.js";
import PainAreaRoutine from "./pages/PainAreaRoutine.js";
import RoutineHistory from "./pages/RoutineHistory.js";
import Navbar from "./components/Navbar.js";
import PrivateRoute from "./components/PrivateRoute";
import FaqAsk from "./components/FaqAsk.js";

const App = () => (
  <Box
    sx={{
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
    }}
  >
    <Navbar />

    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/faq" element={<FaqAsk />} />

        <Route
          path="/landing"
          element={
            <PrivateRoute>
              <Landing />
            </PrivateRoute>
          }
        />
        <Route
          path="/exercise/:id"
          element={
            <PrivateRoute>
              <ExerciseDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/routine/:area"
          element={
            <PrivateRoute>
              <PainAreaRoutine />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <RoutineHistory />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  </Box>
);

export default App;
