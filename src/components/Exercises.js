import React, { useEffect, useMemo, useState } from "react";
import { Box, Pagination, Stack, Typography } from "@mui/material";
import ExerciseCard from "./ExerciseCard";

const Exercises = ({ exercises, bodyPart }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  // Filter first (case-insensitive, supports “lower back”)
  const filtered = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    const bp = (bodyPart || "all").toLowerCase();
    if (bp === "all") return exercises;

    const match = (ex) => {
      const part = (ex.bodyPart || "").toLowerCase();
      if (bp === "back") return part === "back" || part === "lower back";
      if (bp === "knees") return part === "upper legs";
      if (bp === "ankle") return part === "lower legs";
      return true;
    };

    return exercises.filter(match);
  }, [exercises, bodyPart]);

  // Reset page when dataset or filter changes
  useEffect(() => setCurrentPage(1), [bodyPart, exercises]);

  const last = currentPage * perPage;
  const first = last - perPage;
  const pageItems = filtered.slice(first, last);

  const paginate = (_e, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 1800, behavior: "smooth" });
  };

  return (
    <Box id="exercises" sx={{ mt: { lg: "110px" } }} mt="50px" p="20px">
      <Typography variant="h3" mb="24px">
        Showing Results
      </Typography>

      {/* Debug line: shows how many we actually have in the browser console */}
      {console.log(`[Exercises] filtered=${filtered.length}, page=${currentPage}/${Math.ceil(filtered.length / perPage) || 1}`)}

      <Stack direction="row" sx={{ gap: { lg: "110px", xs: "50px" } }} flexWrap="wrap" justifyContent="center">
        {filtered.length === 0 ? (
          <Typography>No exercises found.</Typography>
        ) : (
          pageItems.map((ex, i) => <ExerciseCard key={ex.id || i} exercise={ex} />)
        )}
      </Stack>

      <Stack mt="60px" alignItems="center">
        {filtered.length > perPage && (
          <Pagination
            color="standard"
            shape="rounded"
            page={currentPage}
            count={Math.ceil(filtered.length / perPage)}
            onChange={paginate}
            size="large"
          />
        )}
      </Stack>
    </Box>
  );
};

export default Exercises;
