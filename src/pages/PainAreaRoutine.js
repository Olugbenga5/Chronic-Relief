import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {
  getRoutine,
  getProgress,
  saveProgress,
  saveRoutine,
  saveHistoryEntry,
} from "../firebaseHelper";
import { fetchData, exerciseOptions } from "../services/fetchData";
import ExerciseCard from "../components/ExerciseCard";
import Loader from "../components/Loader";
import { faTrophy, faDumbbell, faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const EXDB = "https://exercisedb.p.rapidapi.com";

// Route params we expect: "back", "knee", "ankle"
const bodyPartMap = {
  back: "back",
  knee: "upper legs",  // NOTE: route uses 'knee' (singular)
  ankle: "lower legs",
};

// Fetch helpers ---------------------------------------------------------------

const fetchByBodyPart = async (part) => {
  const url = `${EXDB}/exercises/bodyPart/${encodeURIComponent(part)}?limit=500`;
  const data = await fetchData(url, exerciseOptions);
  return Array.isArray(data) ? data : [];
};

const fetchExerciseById = async (id) => {
  // Fetch one exercise by API id; useful if it wasn’t in the bulk payload
  try {
    const url = `${EXDB}/exercises/exercise/${encodeURIComponent(id)}`;
    const data = await fetchData(url, exerciseOptions);
    // API returns a single object
    if (data && data.id) return data;
  } catch (e) {
    // ignore; we’ll just skip missing ones
  }
  return null;
};

const getChronicPool = async () => {
  // Try bulk first
  const bulk = (await fetchData(`${EXDB}/exercises?limit=1500`, exerciseOptions)) || [];
  let pool = Array.isArray(bulk) ? bulk : [];

  // If capped/small, merge per-body-part endpoints and dedupe
  if (pool.length < 50) {
    const [back, upperLegs, lowerLegs] = await Promise.all([
      fetchByBodyPart("back"),
      fetchByBodyPart("upper legs"),
      fetchByBodyPart("lower legs"),
    ]);
    const map = new Map();
    [...back, ...upperLegs, ...lowerLegs].forEach((ex) => {
      const key = String(ex?.id ?? ex?._id ?? Math.random());
      if (!map.has(key)) map.set(key, ex);
    });
    pool = Array.from(map.values());
  }

  // Keep only chronic‑relevant body parts
  const relevant = ["back", "lower back", "upper legs", "lower legs"];
  return pool.filter((ex) => relevant.includes(String(ex.bodyPart || "").toLowerCase()));
};

// Component -------------------------------------------------------------------

const PainAreaRoutine = () => {
  const { area } = useParams(); // 'back' | 'knee' | 'ankle'
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCongrats, setOpenCongrats] = useState(false);

  const validBodyPart = bodyPartMap[area]; // e.g., 'upper legs'
  const areaLabel = area || "back";

  const generateAndSaveRoutine = async (uid) => {
    if (!validBodyPart) {
      console.warn("Unknown focus area:", area);
      setRoutine([]);
      setCompleted([]);
      return;
    }

    const pool = await getChronicPool();
    const filtered = pool.filter(
      (ex) => String(ex.bodyPart || "").toLowerCase() === validBodyPart
    );

    // Random 5 (or fewer if not enough)
    const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
    const newIds = selected.map((ex) => String(ex.id));

    await saveRoutine(uid, areaLabel, newIds);
    await saveProgress(uid, areaLabel, []);
    setRoutine(selected);
    setCompleted([]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRoutine([]);
        setCompleted([]);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setLoading(true);

      try {
        // 1) Load saved routine ids for this focus area
        const routineIds = await getRoutine(currentUser.uid, areaLabel); // array of strings

        // 2) Build a reliable pool (handles capped bulk endpoint)
        const pool = await getChronicPool();

        if (!routineIds || routineIds.length === 0) {
          // No saved routine -> create a new one
          await generateAndSaveRoutine(currentUser.uid);
          setLoading(false);
          return;
        }

        // 3) Try to reconstruct the saved routine from the pool first
        const poolById = new Map(
          pool.map((ex) => [String(ex.id ?? ex._id), ex])
        );

        const fromPool = routineIds
          .map((id) => poolById.get(String(id)))
          .filter(Boolean);

        // 4) If some ids were not in the pool (because the bulk list missed them),
        // fetch them one-by-one via /exercises/exercise/:id
        if (fromPool.length < routineIds.length) {
          const missingIds = routineIds.filter(
            (id) => !poolById.has(String(id))
          );
          const fetchedMissing = (
            await Promise.all(missingIds.map((id) => fetchExerciseById(id)))
          ).filter(Boolean);

          fromPool.push(...fetchedMissing);
        }

        // 5) Load progress and set state
        const progress = await getProgress(currentUser.uid, areaLabel);
        setRoutine(fromPool);
        setCompleted((progress || []).map((id) => String(id)));
      } catch (err) {
        console.error("Error loading routine:", err);
        alert("Something went wrong loading your routine.");
        setRoutine([]);
        setCompleted([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [areaLabel, validBodyPart]);

  const handleToggleComplete = async (id) => {
    if (!user) return;
    const idStr = String(id);
    const updated = completed.includes(idStr)
      ? completed.filter((x) => x !== idStr)
      : [...completed, idStr];

    setCompleted(updated);
    await saveProgress(user.uid, areaLabel, updated);
  };

  const handleResetRoutine = async () => {
    if (!user) return;
    setCompleted([]);
    await saveProgress(user.uid, areaLabel, []);
    setOpenCongrats(false);
  };

  const handleGenerateNewRoutine = async () => {
    if (!user) return;
    await generateAndSaveRoutine(user.uid);
    setOpenCongrats(false);
  };

  const progressPercent =
    routine.length === 0 ? 0 : Math.floor((completed.length / routine.length) * 100);

  useEffect(() => {
    const maybeSaveHistory = async () => {
      if (progressPercent === 100 && user && routine.length > 0) {
        const routineIds = routine.map((ex) => String(ex.id));
        await saveHistoryEntry(user.uid, areaLabel, routineIds);
        setOpenCongrats(true);
      }
    };
    maybeSaveHistory();
  }, [progressPercent, user, routine, areaLabel]);

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
        Your {areaLabel} Routine
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
                  completed.includes(String(exercise.id)) ? "contained" : "outlined"
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
            You've completed your {areaLabel} routine!
          </Typography>
          <FontAwesomeIcon icon={faTrophy} style={{ fontSize: "40px", color: "#ff9529" }} />
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
