import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { fetchRoutineHistory } from "../firebaseHelper";
import { fetchData, exerciseOptions } from "../services/fetchData";
import { formatDistanceToNow } from "date-fns";

const EXDB = "https://exercisedb.p.rapidapi.com";

function stripZeros(s) {
  return String(s || "").replace(/^0+/, "") || "0";
}
function pad4(s) {
  const t = stripZeros(s);
  return t.padStart(4, "0");
}
function addNameKeys(map, id, name) {
  const raw = String(id || "");
  const no0 = stripZeros(raw);
  const p4 = pad4(raw);
  [raw, no0, p4].forEach((k) => {
    if (k && !map.has(k)) map.set(k, name);
  });
}

const RoutineHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1) Load user history + bulk exercise catalog
        const [rawHistory, allExercises] = await Promise.all([
          fetchRoutineHistory(currentUser.uid),
          fetchData(`${EXDB}/exercises?limit=1500`, exerciseOptions),
        ]);

        // 2) Build robust lookup (handles "29" vs "0029")
        const nameById = new Map();
        (allExercises || []).forEach((ex) =>
          addNameKeys(nameById, ex?.id, ex?.name)
        );

        // 3) First pass: map names; collect any truly missing ids
        const missingIds = new Set();
        const prelim = (rawHistory || []).map((entry) => {
          const names = (entry.exerciseIds || []).map((id) => {
            const idStr = String(id);
            const name =
              nameById.get(idStr) ||
              nameById.get(stripZeros(idStr)) ||
              nameById.get(pad4(idStr));
            if (!name) missingIds.add(idStr);
            return name || `(Unknown ID: ${id})`;
          });
          return { ...entry, exerciseNames: names };
        });

        // 4) If any are missing, fetch each by id (small number) and update map
        if (missingIds.size > 0) {
          const fetched = await Promise.all(
            Array.from(missingIds).map(async (idStr) => {
              try {
                const ex = await fetchData(
                  `${EXDB}/exercises/exercise/${encodeURIComponent(
                    stripZeros(idStr)
                  )}`,
                  exerciseOptions
                );
                if (ex && ex.id && ex.name) {
                  addNameKeys(nameById, ex.id, ex.name);
                  return { idStr, name: ex.name };
                }
              } catch (_) {}
              return { idStr, name: null };
            })
          );

          // 5) Second pass: replace unknowns with fetched names where available
          const fetchedMap = new Map(
            fetched.filter((f) => f.name).map((f) => [f.idStr, f.name])
          );

          prelim.forEach((entry) => {
            entry.exerciseNames = (entry.exerciseIds || []).map((id) => {
              const idStr = String(id);
              return (
                nameById.get(idStr) ||
                nameById.get(stripZeros(idStr)) ||
                nameById.get(pad4(idStr)) ||
                fetchedMap.get(idStr) ||
                `(Unknown ID: ${id})`
              );
            });
          });
        }

        setHistory(prelim);
      } catch (err) {
        console.error("Error loading history:", err);
        setHistory([]);
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
                {entry.area?.toUpperCase()} Routine{" "}
                {entry.completedAt
                  ? formatDistanceToNow(new Date(entry.completedAt), {
                      addSuffix: true,
                    })
                  : ""}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography fontWeight="bold" gutterBottom>
                Exercises:
              </Typography>
              <ul style={{ marginLeft: "20px" }}>
                {entry.exerciseNames?.map((name, idx) => (
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
