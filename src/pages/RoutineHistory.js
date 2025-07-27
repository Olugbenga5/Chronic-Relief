import React, { useEffect, useState } from "react";
import {Accordion,AccordionSummary,AccordionDetails,Typography,CircularProgress,Box} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { fetchRoutineHistory } from "../firebaseHelper";
import { fetchData, exerciseOptions } from "../services/fetchData";
import { formatDistanceToNow } from "date-fns";

const RoutineHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      try {
        const [rawHistory, allExercises] = await Promise.all([
          fetchRoutineHistory(currentUser.uid),
          fetchData(
            "https://exercisedb.p.rapidapi.com/exercises?limit=1500",
            exerciseOptions
          ),
        ]);

        const enrichedHistory = rawHistory.map((entry) => {
          const exerciseNames = entry.exerciseIds.map((id) => {
            const match = allExercises.find(
              (ex) => String(ex.id) === String(id)
            );
            return match ? match.name : `(Unknown ID: ${id})`;
          });

          return {
            ...entry,
            exerciseNames,
          };
        });

        setHistory(enrichedHistory);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
        <Typography mt={2}>Loading your routine history...</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth="800px" mx="auto" mt={5} px={2}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
        Completed Routine History
      </Typography>

      {history.length === 0 ? (
        <Typography textAlign="center">
          You have not completed any routines yet.
        </Typography>
      ) : (
        history.map((entry, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight="bold">
                {entry.area.toUpperCase()} Routine {" "}
                {formatDistanceToNow(new Date(entry.completedAt), {
                  addSuffix: true,
                })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography fontWeight="bold" gutterBottom>
                Exercises:
              </Typography>
              <ul style={{ marginLeft: "20px" }}>
                {entry.exerciseNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default RoutineHistory;
