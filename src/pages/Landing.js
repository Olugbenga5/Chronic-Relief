import React, { useState, useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Exercises from "../components/Exercises";
import SearchExercises from "../components/SearchExercises";
import HeroBanner from "../components/HeroBanner";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { savePainArea, saveRoutine, getPainArea } from "../firebaseHelper";

const LAST_AREA_KEY = "cr:lastPainArea";

const Landing = () => {
  const [exercises, setExercises] = useState([]);
  const [bodyPart, setBodyPart] = useState("all");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // On auth change, capture user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsub();
  }, []);

  // Hydrate initial selection from Firebase (if logged in) or localStorage
  useEffect(() => {
    let alive = true;

    const hydrate = async () => {
      // 1) Try Firebase if signed in and you have getPainArea
      if (user && typeof getPainArea === "function") {
        try {
          const saved = await getPainArea(user.uid);
          if (alive && saved) {
            setBodyPart(saved);
            localStorage.setItem(LAST_AREA_KEY, saved);
            return;
          }
        } catch {
          // ignore and fall back to localStorage
        }
      }
      // 2) Fallback to localStorage
      const last = localStorage.getItem(LAST_AREA_KEY);
      if (alive && last) {
        setBodyPart(last);
      }
    };

    hydrate();
    return () => {
      alive = false;
    };
  }, [user]);

  const handleSelectArea = async (area) => {
    setBodyPart(area);
    localStorage.setItem(LAST_AREA_KEY, area);

    // Map UI label -> ExerciseDB bodyPart value
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
      (ex) => String(ex.bodyPart || "").toLowerCase() === validBodyPart
    );

    if (filtered.length === 0) {
      alert(`No exercises found for "${area}".`);
      return;
    }

    const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);

    if (user && selected.length > 0) {
      const ids = selected.map((ex) => String(ex.id));
      try {
        // Persist choice so it sticks next visit
        if (typeof savePainArea === "function") {
          await savePainArea(user.uid, area);
        }
        await saveRoutine(user.uid, area, ids);
      } catch {
        // even if Firebase fails, we still have localStorage
      }
      navigate(`/routine/${area}`);
    } else {
      // Not signed in: still navigate using the selection, area persists via localStorage
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
        setBodyPart={(bp) => {
          setBodyPart(bp);
          // keep localStorage in sync when tabs change
          if (bp && bp !== "all") {
            localStorage.setItem(LAST_AREA_KEY, bp);
            if (user && typeof savePainArea === "function") {
              // fire and forget; not critical if it fails
              savePainArea(user.uid, bp).catch(() => {});
            }
          }
        }}
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
