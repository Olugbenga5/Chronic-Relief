import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, CardMedia, Typography, IconButton, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { listenFavorites, removeFavorite } from "../firebaseHelper";
import { Link } from "react-router-dom";

// get RapidAPI key (Vite or CRA)
const resolveRapidKey = () =>
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_RAPID_API_KEY) ||
  process.env.REACT_APP_RAPID_API_KEY ||
  "";

const IMAGE_RESOLUTION = "360"; // 180 | 360 | 720 | 1080

// Build a display-safe image src
const computeImageSrc = (ex, rapidKey) => {
  const url = ex?.gifUrl || "";
  // If gifUrl is from dataset (NOT the RapidAPI /image domain), use it
  if (url && !String(url).includes("exercisedb.p.rapidapi.com/image")) {
    return url;
  }
  // Else rebuild the RapidAPI /image link using the saved id 
  if (ex?.id && rapidKey) {
    return `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(
      ex.id
    )}&resolution=${IMAGE_RESOLUTION}&rapidapi-key=${encodeURIComponent(rapidKey)}`;
  }
  return "";
};

export default function Favorites() {
  const [uid, setUid] = useState(null);
  const [items, setItems] = useState([]);
  const rapidKey = useMemo(resolveRapidKey, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
      if (!u) setItems([]);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsub = listenFavorites(uid, setItems);
    return () => unsub();
  }, [uid]);

  const onRemove = async (id) => {
    if (!uid) return;
    await removeFavorite(uid, id);
  };

  if (!uid) {
    return <Typography sx={{ p: 3 }}>Please log in to view your favorites.</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" mb={2}>Your Favorites</Typography>
      {items.length === 0 ? (
        <Typography>No favorites yet. Tap the heart on any exercise!</Typography>
      ) : (
        <Stack direction="row" gap={2} flexWrap="wrap">
          {items.map((ex) => {
            const imgSrc = computeImageSrc(ex, rapidKey);
            return (
              <Card key={ex.id} sx={{ width: 320 }}>
                {imgSrc ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={imgSrc}
                    alt={ex.name}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <CardContent>
                  <Typography variant="h6" gutterBottom>{ex.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ex.bodyPart} • {ex.target} • {ex.equipment}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" mt={1}>
                    <IconButton onClick={() => onRemove(ex.id)} aria-label="remove">
                      <DeleteIcon />
                    </IconButton>
                    <Link to={`/exercise/${ex.id}`} style={{ textDecoration: "none" }}>
                      <Typography variant="button">Open</Typography>
                    </Link>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
