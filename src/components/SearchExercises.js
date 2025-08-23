import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, TextField, Typography, Alert } from "@mui/material";
import { exerciseOptions, fetchData } from "../services/fetchData";
import HorizontalScrollbar from "./HorizontalScrollbar";

const CHRONIC_BODY_PART_LABELS = ["All", "Back", "Knees", "Ankle"];
const CHRONIC_BODY_PART_MATCHES = {
  Back: ["back", "lower back"],
  Knees: ["upper legs"],
  Ankle: ["lower legs"],
};

const SearchExercises = ({ setExercises, bodyPart, setBodyPart }) => {
  const [search, setSearch] = useState("");
  const [allChronicExercises, setAllChronicExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // {severity:'error'|'info'|'success', text:string}

  const bodyParts = useMemo(() => CHRONIC_BODY_PART_LABELS, []);

  // Initial fetch
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setMsg(null);

      // Guard: missing key shows actionable hint
      if (!process.env.REACT_APP_RAPID_API_KEY) {
        setMsg({
          severity: "error",
          text:
            'Missing REACT_APP_RAPID_API_KEY. Add it to your .env and rebuild (in Vercel: Project → Settings → Environment Variables).',
        });
        setLoading(false);
        return;
      }

      const data = await fetchData(
        "https://exercisedb.p.rapidapi.com/exercises?limit=1500",
        exerciseOptions
      );

      if (!alive) return;

      if (!Array.isArray(data)) {
        setMsg({
          severity: "error",
          text:
            "Could not load exercises from the API. Check the browser console for the exact error (401/429 means your RapidAPI key is missing/invalid or rate‑limited).",
        });
        setAllChronicExercises([]);
        setExercises([]);
        setLoading(false);
        return;
      }

      const relevantParts = ["back", "lower back", "upper legs", "lower legs"];
      const chronic = data.filter((ex) =>
        relevantParts.includes((ex.bodyPart || "").toLowerCase())
      );

      setAllChronicExercises(chronic);
      setExercises(chronic);
      setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, [setExercises]);

  // Tab switching
  useEffect(() => {
    const normalized = (bodyPart || "all").toLowerCase();

    if (normalized === "all") {
      setExercises(allChronicExercises);
    } else {
      const matchKey = Object.keys(CHRONIC_BODY_PART_MATCHES).find(
        (k) => k.toLowerCase() === normalized
      );
      const matches = matchKey ? CHRONIC_BODY_PART_MATCHES[matchKey] : null;

      if (!matches) {
        setExercises([]);
      } else {
        const filtered = allChronicExercises.filter((ex) =>
          matches.includes((ex.bodyPart || "").toLowerCase())
        );
        setExercises(filtered);
      }
    }
    // clear info line when the tab changes
    setMsg(null);
  }, [bodyPart, allChronicExercises, setExercises]);

  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    const src = allChronicExercises;
    const filtered = src.filter((ex) => {
      const name = ex.name?.toLowerCase() || "";
      const target = ex.target?.toLowerCase() || "";
      const equip = ex.equipment?.toLowerCase() || "";
      const part = ex.bodyPart?.toLowerCase() || "";
      return name.includes(q) || target.includes(q) || equip.includes(q) || part.includes(q);
    });

    setExercises(filtered);
    setMsg(
      filtered.length === 0
        ? { severity: "info", text: 'No matches. Try terms like "pull-up", "squat", or "hamstrings".' }
        : null
    );
    window.scrollTo({ top: 1800, behavior: "smooth" });
  };

  return (
    <Stack alignItems="center" mt="37px" justifyContent="center" p="20px">
      <Typography fontWeight={700} sx={{ fontSize: { lg: "44px", xs: "30px" } }} mb="28px" textAlign="center">
        Here Are Some Exercises <br /> For Chronic Pain Relief
      </Typography>

      <Box position="relative" mb="20px" display="flex" gap={1} width="100%" justifyContent="center">
        <TextField
          sx={{
            input: { fontWeight: 700 },
            width: { lg: "800px", xs: "350px" },
            backgroundColor: "#fff",
            borderRadius: "40px",
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={loading ? "Loading exercises…" : "Search by name, target, or equipment"}
          type="text"
          disabled={loading}
        />
        <Button
          sx={{
            backgroundColor: "#FF2625",
            color: "#fff",
            textTransform: "none",
            width: { lg: "175px", xs: "80px" },
            fontSize: { lg: "20px", xs: "14px" },
            height: "56px",
          }}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Loading…" : "Search"}
        </Button>
      </Box>

      {msg && (
        <Box mb={2} maxWidth={800} width="100%">
          <Alert severity={msg.severity}>{msg.text}</Alert>
        </Box>
      )}

      <Box sx={{ position: "relative", width: "100%", p: "20px" }}>
        <HorizontalScrollbar
          data={bodyParts}
          bodyPart={bodyPart}
          setBodyPart={setBodyPart}
          isBodyParts
        />
      </Box>
    </Stack>
  );
};

export default SearchExercises;
