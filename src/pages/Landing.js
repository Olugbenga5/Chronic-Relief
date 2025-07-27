import React, { useState, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Exercises from "../components/Exercises";
import SearchExercises from "../components/SearchExercises";
import HeroBanner from "../components/HeroBanner";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { savePainArea, saveRoutine } from "../firebaseHelper";

const Landing = () => {
  const [exercises, setExercises] = useState([]);
  const [bodyPart, setBodyPart] = useState("all");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectArea = async (area) => {
    setBodyPart(area);

    const bodyPartMap = {
      back: "back",
      knee: "upper legs",
      ankle: "lower legs",
    };

    const validBodyPart = bodyPartMap[area];
    if (!validBodyPart) {
      alert("Invalid selection.");
      return;
    }

    const filtered = exercises.filter(
      (ex) => ex.bodyPart.toLowerCase() === validBodyPart
    );

    if (filtered.length === 0) {
      alert(`No exercises found for "${area}".`);
      return;
    }

    const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);

    if (user && selected.length > 0) {
      const ids = selected.map((ex) => String(ex.id)); 
      await savePainArea(user.uid, area);
      await saveRoutine(user.uid, area, ids);
      navigate(`/routine/${area}`);
    }
  };

  return (
    <Box className="landing-wrapper">
      <HeroBanner />

      <Typography variant="h5" textAlign="center" mt={3} mb={2}>
        What's your pain focus?
      </Typography>

      <Stack direction="row" justifyContent="center" spacing={3} mb={4}>
        {["back", "knee", "ankle"].map((area) => (
          <Button
            key={area}
            variant={bodyPart === area ? "contained" : "outlined"}
            onClick={() => handleSelectArea(area)}
            sx={{
              borderRadius: "20px",
              padding: "10px 20px",
              textTransform: "capitalize",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {area}
          </Button>
        ))}
      </Stack>

      <SearchExercises
        setExercises={setExercises}
        bodyPart={bodyPart}
        setBodyPart={setBodyPart}
      />
      <Exercises
        exercises={exercises}
        setExercises={setExercises}
        bodyPart={bodyPart}
      />
    </Box>
  );
};

export default Landing;
