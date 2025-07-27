import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {Box, Typography, Button, LinearProgress, Stack, Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {getRoutine, getProgress, saveProgress, saveRoutine, saveHistoryEntry} from "../firebaseHelper";
import { fetchData, exerciseOptions } from "../services/fetchData";
import ExerciseCard from "../components/ExerciseCard";
import Loader from "../components/Loader";
import {faTrophy, faDumbbell, faSyncAlt} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PainAreaRoutine = () => {
  const { area } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCongrats, setOpenCongrats] = useState(false);

  const bodyPartMap = {
    back: "back",
    knee: "upper legs",
    ankle: "lower legs",
  };

  const generateAndSaveRoutine = async (uid) => {
    const allExercises = await fetchData(
      "https://exercisedb.p.rapidapi.com/exercises?limit=1500",
      exerciseOptions
    );

    const validBodyPart = bodyPartMap[area];
    const filtered = allExercises.filter(
      (ex) => ex.bodyPart.toLowerCase() === validBodyPart
    );

    const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
    const newIds = selected.map((ex) => String(ex.id));

    await saveRoutine(uid, area, newIds);
    await saveProgress(uid, area, []);
    setRoutine(selected);
    setCompleted([]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      setUser(currentUser);

      try {
        const routineIds = await getRoutine(currentUser.uid, area);

        const allExercises = await fetchData(
          "https://exercisedb.p.rapidapi.com/exercises?limit=1500",
          exerciseOptions
        );

        if (!routineIds || routineIds.length === 0) {
          await generateAndSaveRoutine(currentUser.uid);
          setLoading(false);
          return;
        }

        const selected = allExercises.filter((ex) =>
          routineIds.includes(String(ex.id))
        );

        const progress = await getProgress(currentUser.uid, area);
        setRoutine(selected);
        setCompleted((progress || []).map((id) => String(id)));
      } catch (err) {
        console.error("Error loading routine:", err);
        alert("Something went wrong.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [area]);

  const handleToggleComplete = async (id) => {
    if (!user) return;
    const idStr = String(id);
    const updated = completed.includes(idStr)
      ? completed.filter((x) => x !== idStr)
      : [...completed, idStr];

    setCompleted(updated);
    await saveProgress(user.uid, area, updated);
  };

  const handleResetRoutine = async () => {
    if (!user) return;
    setCompleted([]);
    await saveProgress(user.uid, area, []);
    setOpenCongrats(false);
  };

  const handleGenerateNewRoutine = async () => {
    if (!user) return;
    await generateAndSaveRoutine(user.uid);
    setOpenCongrats(false);
  };

  const progressPercent =
    routine.length === 0
      ? 0
      : Math.floor((completed.length / routine.length) * 100);

  useEffect(() => {
    const saveIfCompleted = async () => {
      if (progressPercent === 100 && user && routine.length > 0) {
        const routineIds = routine.map((ex) => String(ex.id));
        await saveHistoryEntry(user.uid, area, routineIds);
        setOpenCongrats(true);
      }
    };
    saveIfCompleted();
  }, [progressPercent, user, routine, area]);

  if (loading) return <Loader />;

  return (
    <Box p={3}>
      <Button
        onClick={() => navigate("/landing")}
        variant="outlined"
        sx={{ marginBottom: 3, display: "block", mx: "auto" }}
      >
        Change Focus Area
      </Button>

      <Typography variant="h4" fontWeight="bold" mb={2} textAlign="center">
        Your {area} Routine
      </Typography>

      <Box
        width="100%"
        mb={4}
        sx={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#f2f2f2",
          borderRadius: "12px",
        }}
      >
        <Typography fontWeight="bold" mb={1} fontSize="18px">
          Routine Progress
        </Typography>

        <FontAwesomeIcon
          icon={progressPercent === 100 ? faTrophy : faDumbbell}
          style={{
            fontSize: "30px",
            color: progressPercent === 100 ? "#ff9529" : "#3f51b5",
            marginBottom: "10px",
          }}
        />

        <Typography fontWeight="medium" mb={1}>
          {progressPercent}% completed
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: "12px",
            borderRadius: "6px",
            backgroundColor: "#ddd",
            "& .MuiLinearProgress-bar": {
              backgroundColor: progressPercent === 100 ? "#ff9529" : "#3f51b5",
            },
          }}
        />
      </Box>

      <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={2}>
        {routine.length === 0 ? (
          <Typography>No exercises found for this routine.</Typography>
        ) : (
          routine.map((exercise) => (
            <Box key={exercise.id} sx={{ position: "relative" }}>
              <ExerciseCard exercise={exercise} />
              <Button
                variant={
                  completed.includes(String(exercise.id))
                    ? "contained"
                    : "outlined"
                }
                size="small"
                onClick={() => handleToggleComplete(exercise.id)}
                sx={{
                  mt: 1,
                  display: "block",
                  mx: "auto",
                  textTransform: "none",
                }}
              >
                {completed.includes(String(exercise.id))
                  ? "✓ Completed"
                  : "Mark as Complete"}
              </Button>
            </Box>
          ))
        )}
      </Stack>

      <Box mt={5} textAlign="center">
        <Button
          startIcon={<FontAwesomeIcon icon={faSyncAlt} />}
          variant="outlined"
          onClick={handleResetRoutine}
        >
          Reset Routine
        </Button>
      </Box>

      <Dialog open={openCongrats} onClose={() => setOpenCongrats(false)}>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          Congratulations!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" mb={2}>
            You've completed your {area} routine!
          </Typography>
          <FontAwesomeIcon
            icon={faTrophy}
            style={{ fontSize: "40px", color: "#ff9529" }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={handleGenerateNewRoutine} variant="outlined">
            Generate New Routine
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenCongrats(false);
              navigate("/landing");
            }}
          >
            Change Focus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PainAreaRoutine;
