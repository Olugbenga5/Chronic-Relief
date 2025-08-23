import React, { useMemo, useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";

const cap = (s) =>
  s ? String(s).toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : "";

const ExerciseCard = ({ exercise }) => {
  // 🔒 Always call hooks first, unconditionally
  const [imgError, setImgError] = useState(false);

  // Safe reads (handle undefined exercise without branching before hooks)
  const id = exercise?.id ?? exercise?._id ?? "";
  const name = cap(exercise?.name || "Exercise");
  const bodyPart = cap(exercise?.bodyPart || "");
  const target = cap(exercise?.target || "");

  // Env key (supports Vite and CRA)
  const rapidKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_RAPID_API_KEY) ||
    process.env.REACT_APP_RAPID_API_KEY ||
    "";

  // Build STABLE image URL from /image endpoint (don’t use exercise.gifUrl)
  const resolution = "360"; // 180 | 360 | 720 | 1080 (plan-dependent)
  const imgSrc = useMemo(() => {
    if (!id || !rapidKey) return "";
    return `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(
      id
    )}&resolution=${resolution}&rapidapi-key=${encodeURIComponent(rapidKey)}`;
  }, [id, rapidKey]);

  // You can return null AFTER hooks (order is still consistent)
  if (!exercise) return null;

  return (
    <Link
      className="exercise-card"
      to={`/exercise/${id}`}
      style={{ textDecoration: "none" }}
      aria-label={`Open details for ${name}`}
    >
      <Box
        sx={{
          width: 260,
          border: "1px solid #e7e7e7",
          borderRadius: "12px",
          p: "12px",
          mb: "20px",
          textAlign: "center",
          bgcolor: "#f8f8f8",
          transition: "transform .2s, border-top-color .2s",
          position: "relative",
          borderTop: "4px solid transparent",
          "&:hover": {
            transform: "translateY(-2px)",
            borderTop: "4px solid #ff2625",
            boxShadow: "0 6px 20px rgba(0,0,0,.08)",
          },
        }}
      >
        {!imgError && imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              borderRadius: 8,
              background: "#fff",
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: 200,
              borderRadius: 8,
              bgcolor: "#ffffff",
              border: "1px dashed #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#777",
            }}
          >
            Image not available
          </Box>
        )}

        <Stack direction="row" spacing={1} justifyContent="center" mt={1.25} mb={1}>
          {bodyPart && (
            <Button
              aria-label={`Body part ${bodyPart}`}
              sx={{
                backgroundColor: "#ffa9a9",
                color: "#fff",
                fontSize: 13,
                borderRadius: "20px",
                textTransform: "capitalize",
                px: 1.75,
                py: 0.5,
                minWidth: "fit-content",
                "&:hover": { backgroundColor: "#ff7f7f" },
              }}
            >
              {bodyPart}
            </Button>
          )}
          {target && (
            <Button
              aria-label={`Target ${target}`}
              sx={{
                backgroundColor: "#fcc757",
                color: "#fff",
                fontSize: 13,
                borderRadius: "20px",
                textTransform: "capitalize",
                px: 1.75,
                py: 0.5,
                minWidth: "fit-content",
                "&:hover": { backgroundColor: "#f7b632" },
              }}
            >
              {target}
            </Button>
          )}
        </Stack>

        <Typography
          mt="10px"
          fontWeight="bold"
          sx={{
            color: "#222",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 44,
          }}
        >
          {name}
        </Typography>
      </Box>
    </Link>
  );
};

export default ExerciseCard;
