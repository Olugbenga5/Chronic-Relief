import React, { useState, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Exercises from "../components/Exercises";
import SearchExercises from "../components/SearchExercises";
import HeroBanner from "../components/HeroBanner";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { savePainArea, saveRoutine } from "../firebaseHelper";

const LAST_AREA_KEY = "cr:lastPainArea";

const Landing = () => {
  const [exercises, setExercises] = useState([]);
  const [bodyPart, setBodyPart] = useState("all");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Keep track of auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Hydrate the last selected area from localStorage on first mount
  useEffect(() => {
    const last = localStorage.getItem(LAST_AREA_KEY);
    if (last) setBodyPart(last);
  }, []);

  const handleSelectArea = async (area) => {
    // Update UI + persist
    setBodyPart(area);
    localStorage.setItem(LAST_AREA_KEY, area);
    if (user) {
      // fire-and-forget; don’t block UX if this fails
      savePainArea(user.uid, area).catch(() => {});
    }

    // Map UI area -> ExerciseDB bodyPart for quick client-side pick
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

    // Try to pick 5 from what we already have loaded
    const filtered = exercises.filter(
      (ex) => String(ex.bodyPart || "").toLowerCase() === validBodyPart
    );
    if (filtered.length === 0) {
      // It's okay if nothing is loaded yet—the routine page can generate/fetch.
      // We still navigate so the user flow continues smoothly.
      navigate(`/routine/${area}`);
      return;
    }

    const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);

    if (user && selected.length > 0) {
      try {
        const ids = selected.map((ex) => String(ex.id));
        await saveRoutine(user.uid, area, ids);
      } catch {
        // ignore save errors here; routine page can regenerate
      }
    }

    navigate(`/routine/${area}`);
  };

  // Wrapper so SearchExercises tab changes also persist the choice
  const setBodyPartAndPersist = (bp) => {
    setBodyPart(bp);
    if (bp && bp !== "all") {
      localStorage.setItem(LAST_AREA_KEY, bp);
      if (user) savePainArea(user.uid, bp).catch(() => {});
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
        setBodyPart={setBodyPartAndPersist}
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
