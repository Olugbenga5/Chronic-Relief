import React, { useEffect, useMemo, useState } from "react";
import { Box, Pagination, Stack, Typography } from "@mui/material";
import ExerciseCard from "./ExerciseCard";

// Consistent, lowercase mapping (matches SearchExercises)
const MAP = {
  back: ["back", "lower back"],
  knees: ["upper legs"],
  ankle: ["lower legs"],
};

const Exercises = ({ exercises = [], bodyPart = "All" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  // 1) Filter first (so "All" truly shows everything you've allowed)
  const filtered = useMemo(() => {
    if (!Array.isArray(exercises)) return [];
    const bp = String(bodyPart || "all").toLowerCase();
    if (bp === "all") return exercises;

    const matches = MAP[bp];
    if (!matches) return exercises;

    return exercises.filter((ex) =>
      matches.includes(String(ex.bodyPart || "").toLowerCase())
    );
  }, [exercises, bodyPart]);

  // 2) Keep pagination in sync when data/filter changes
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    // reset to page 1 when dataset/filter changes
    setCurrentPage(1);
  }, [exercises, bodyPart]);
  useEffect(() => {
    // clamp if current page exceeds available pages
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // 3) Slice the filtered list for the current page
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
