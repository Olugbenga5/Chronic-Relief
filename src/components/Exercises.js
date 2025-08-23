import React, { useEffect, useMemo, useState } from "react";
import { Box, Pagination, Stack, Typography } from "@mui/material";
import ExerciseCard from "./ExerciseCard";

const MAP = {
  back: {
    bodyParts: ["back", "lower back"],
    targets: ["upper back", "lats", "traps", "trapezius", "erector spinae", "spine"],
  },
  knee: {
    bodyParts: ["upper legs", "lower legs"],
    targets: [
      "quads", "quadriceps", "hamstrings", "glutes",
      "adductors", "abductors", "calves", "tibialis anterior", "soleus"
    ],
  },
  ankle: {
    bodyParts: ["lower legs"],
    targets: ["calves", "tibialis anterior", "soleus", "peroneus longus", "peroneus brevis"],
  },
};

const Exercises = ({ exercises = [], bodyPart = "All" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    const bp = String(bodyPart || "all").toLowerCase();
    if (bp === "all") return exercises;

    const cfg = MAP[bp];
    if (!cfg) return exercises;

    return exercises.filter((ex) => {
      const part = String(ex.bodyPart || "").toLowerCase();
      const targ = String(ex.target || "").toLowerCase();
      return cfg.bodyParts.includes(part) || cfg.targets.includes(targ);
    });
  }, [exercises, bodyPart]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [exercises, bodyPart]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const onPageChange = (_e, page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 1800, behavior: "smooth" });
  };

  return (
    <Box id="exercises" sx={{ mt: { lg: "110px" } }} mt="50px" p="20px">
      <Typography variant="h3" mb="24px">
        Showing Results
      </Typography>

      <Stack
        direction="row"
        sx={{ gap: { lg: "110px", xs: "50px" } }}
        flexWrap="wrap"
        justifyContent="center"
      >
        {pageItems.length === 0 ? (
          <Typography>No exercises found.</Typography>
        ) : (
          pageItems.map((ex, i) => (
            <ExerciseCard key={ex.id || ex._id || i} exercise={ex} />
          ))
        )}
      </Stack>

      <Stack mt="60px" alignItems="center">
        {filtered.length > perPage && (
          <Pagination
            color="standard"
            shape="rounded"
            page={currentPage}
            count={totalPages}
            onChange={onPageChange}
            size="large"
          />
        )}
      </Stack>
    </Box>
  );
};

export default Exercises;
