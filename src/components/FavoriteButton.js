import React, { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { isFavorite, toggleFavorite } from "../firebaseHelper";

const FavoriteButton = ({ exercise }) => {
  const [uid, setUid] = useState(null);
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUid(user ? user.uid : null);
      if (user && exercise?.id) {
        const f = await isFavorite(user.uid, exercise.id);
        setFav(f);
      } else {
        setFav(false);
      }
    });
    return () => unsub();
  }, [exercise?.id]);

  const onClick = async () => {
    if (!uid) {
      alert("Please login to save favorites.");
      return;
    }
    setBusy(true);
    try {
      const clean = {
        id: String(exercise.id),
        name: exercise.name || "",
        bodyPart: exercise.bodyPart || "",
        target: exercise.target || "",
        equipment: exercise.equipment || "",
        gifUrl:
          exercise.gifUrl &&
          !String(exercise.gifUrl).includes("exercisedb.p.rapidapi.com/image")
            ? exercise.gifUrl
            : "", 
      };

      const nowFav = await toggleFavorite(uid, clean);
      setFav(nowFav);
    } catch (e) {
      console.error(e);
      alert("Could not update favorites. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title={uid ? (fav ? "Remove from Favorites" : "Save to Favorites") : "Login to save"}>
      <span>
        <IconButton onClick={onClick} disabled={busy} aria-label="favorite">
          {fav ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default FavoriteButton;
