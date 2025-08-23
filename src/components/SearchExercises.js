import React, { useEffect, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
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
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchData(
          "https://exercisedb.p.rapidapi.com/exercises?limit=1500",
          exerciseOptions
        );

        if (!alive) return;

        if (!Array.isArray(data)) {
          console.error("[Exercises] API did not return an array:", data);
          setAllChronicExercises([]);
          setExercises([]);
          return;
        }

        const relevantParts = ["back", "lower back", "upper legs", "lower legs"];
        const chronic = data.filter((ex) =>
          relevantParts.includes((ex.bodyPart || "").toLowerCase())
        );

        console.log(`[Exercises] Loaded: total=${data.length}, chronic=${chronic.length}`);
        setAllChronicExercises(chronic);
        setExercises(chronic);
      } catch (err) {
        console.error("[Exercises] Failed to load exercises:", err?.message);
        setAllChronicExercises([]);
        setExercises([]);
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setExercises]);

  // search
  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    const filtered = allChronicExercises.filter((ex) => {
      const n = ex.name?.toLowerCase() || "";
      const t = ex.target?.toLowerCase() || "";
      const e = ex.equipment?.toLowerCase() || "";
      const b = ex.bodyPart?.toLowerCase() || "";
      return n.includes(q) || t.includes(q) || e.includes(q) || b.includes(q);
    });

    console.log(`[Search] query="${q}", results=${filtered.length}`);
    setExercises(filtered);
    setNoResults(filtered.length === 0);
    // keep the query text so users can tweak it
  };

  // body part tabs
  useEffect(() => {
    const normalized = (bodyPart || "all").toLowerCase();
    if (normalized === "all") {
      setExercises(allChronicExercises);
      setNoResults(false);
      return;
    }

    const key = Object.keys(CHRONIC_BODY_PART_MATCHES).find(
      (k) => k.toLowerCase() === normalized
    );
    const matches = key ? CHRONIC_BODY_PART_MATCHES[key] : null;
    if (!matches) {
      console.warn(`[Tabs] No config for "${bodyPart}"`);
      setExercises([]);
      setNoResults(true);
      return;
    }

    const filtered = allChronicExercises.filter((ex) =>
      matches.includes((ex.bodyPart || "").toLowerCase())
    );
    console.log(`[Tabs] ${bodyPart} → ${filtered.length} items`);
    setExercises(filtered);
    setNoResults(filtered.length === 0);
  }, [bodyPart, allChronicExercises, setExercises]);

  return (
    <Stack alignItems="center" mt="37px" justifyContent="center" p="20px">
      <Typography fontWeight={700} sx={{ fontSize: { lg: "44px", xs: "30px" } }} mb="24px" textAlign="center">
        Here Are Some Exercises <br />For Chronic Pain Relief
      </Typography>

      <Box position="relative" mb="24px" display="flex" gap={1}>
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
          placeholder={loading ? "Loading exercises…" : "Search exercises by name, target, or equipment"}
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

      {noResults && (
        <Typography color="red" fontSize="16px" mb="10px" textAlign="center">
          No exercises found. Try a broader term like “pull-up” or “squat”.
        </Typography>
      )}

      <Box sx={{ position: "relative", width: "100%", p: "20px" }}>
        <HorizontalScrollbar
          data={CHRONIC_BODY_PART_LABELS}
          bodyPart={bodyPart}
          setBodyPart={setBodyPart}
          isBodyParts
        />
      </Box>
    </Stack>
  );
};

export default SearchExercises;
