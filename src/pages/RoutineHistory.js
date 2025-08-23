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
import { formatDistanceToNow } from "date-fns";

// ✅ use the cached utilities so we don't burn API calls
import {
  getAllExercisesCached,
  getByIdCached,
} from "../utils/exdbCache";

function stripZeros(s) {
  return String(s || "").replace(/^0+/, "") || "0";
}
function pad4(s) {
  const t = stripZeros(s);
  return t.padStart(4, "0");
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

        // 1) Load user history and the cached exercise catalog
        const [rawHistory, allExercises] = await Promise.all([
          fetchRoutineHistory(currentUser.uid),
          getAllExercisesCached(),
        ]);

        // 2) Build a robust lookup: raw id, de-zeroed, and 4-digit padded -> name
        const nameById = new Map();
        (allExercises || []).forEach((ex) => {
          const raw = String(ex?.id ?? "");
          const no0 = stripZeros(raw);
          const p4 = pad4(raw);
          [raw, no0, p4].forEach((k) => {
            if (k && !nameById.has(k)) nameById.set(k, ex.name);
          });
        });

        // 3) Enrich each history entry with names; fall back to single-id cache if needed
        const enriched = await Promise.all(
          (rawHistory || []).map(async (entry) => {
            const exerciseNames = await Promise.all(
              (entry.exerciseIds || []).map(async (id) => {
                const idStr = String(id);
                const no0 = stripZeros(idStr);
                const p4 = pad4(idStr);

                let name =
                  nameById.get(idStr) || nameById.get(no0) || nameById.get(p4);

                if (!name) {
                  // last resort: fetch this specific exercise via cache (may hit API once)
                  try {
                    const ex = await getByIdCached(idStr);
                    if (ex?.name) {
                      const raw = String(ex.id);
                      const no0e = stripZeros(raw);
                      const p4e = pad4(raw);
                      [raw, no0e, p4e].forEach((k) =>
                        nameById.set(k, ex.name)
                      );
                      name = ex.name;
                    }
                  } catch (_) {}
                }

                return name || `(Unknown ID: ${id})`;
              })
            );

            return {
              ...entry,
              exerciseNames,
            };
          })
        );

        setHistory(enriched);
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
