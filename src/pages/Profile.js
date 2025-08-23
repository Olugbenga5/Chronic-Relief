import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, Select, MenuItem, Button, Divider, TextField,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import {
  ensureUserDoc, getUserDoc, getRoutineHistoryCount,
  updateSelectedArea, resetAppData, deleteAccountFully
} from "../firebaseHelper";

const AREAS = ["back", "knee", "ankle"];

export default function Profile() {
  const [uid, setUid] = useState(null);
  const [email, setEmail] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [routinesCompleted, setRoutinesCompleted] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUid(u?.uid || null);
      setEmail(u?.email || "");
      if (u?.uid) {
        await ensureUserDoc(u.uid);
        const doc = await getUserDoc(u.uid);
        setSelectedArea(doc?.selectedArea || "");
        setRoutinesCompleted(doc?.routinesCompleted || 0);
        const count = await getRoutineHistoryCount(u.uid).catch(() => 0);
        setHistoryCount(count);
      } else {
        setSelectedArea("");
        setRoutinesCompleted(0);
        setHistoryCount(0);
      }
    });
    return () => unsub();
  }, []);

  const canSaveArea = useMemo(
    () => uid && selectedArea && AREAS.includes(selectedArea),
    [uid, selectedArea]
  );

  const onSaveArea = async () => {
    if (!canSaveArea) return;
    setBusy(true);
    try {
      await updateSelectedArea(uid, selectedArea);
      alert("Pain area updated.");
    } catch (e) {
      console.error(e);
      alert("Could not update the pain area.");
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!uid) return;
    if (!window.confirm("Reset app data (favorites & history)? This cannot be undone.")) return;
    setBusy(true);
    try {
      await resetAppData(uid);
      setHistoryCount(0);
      alert("App data reset.");
    } catch (e) {
      console.error(e);
      alert("Failed to reset data.");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!uid) return;
    const emailInput = window.prompt("Confirm your email to delete account:", email || "");
    const pw = window.prompt("Enter your password for re-authentication:");
    if (!emailInput || !pw) return;
    if (!window.confirm("This will permanently delete your account and data. Continue?")) return;
    setBusy(true);
    try {
      await deleteAccountFully(auth, emailInput, pw);
      alert("Account deleted.");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to delete account. Re-check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  if (!uid) {
    return <Typography sx={{ p: 3 }}>Please log in to view your profile.</Typography>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4" mb={2}>Profile</Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Account</Typography>
          <Typography>Email: {email}</Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Selected Pain Area
          </Typography>
          <Stack direction="row" spacing={2}>
            <Select
              size="small"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              displayEmpty
              sx={{ minWidth: 200 }}
            >
              <MenuItem value=""><em>Not set</em></MenuItem>
              {AREAS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
            <Button variant="contained" onClick={onSaveArea} disabled={!canSaveArea || busy}>
              Save
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="text.secondary">Stats</Typography>
          <Typography>Total routines completed (field): {routinesCompleted}</Typography>
          <Typography>History entries (subcollection count): {historyCount}</Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="text.secondary">Danger Zone</Typography>
          <Stack direction="row" spacing={2}>
            <Button color="warning" variant="outlined" onClick={onReset} disabled={busy}>
              Reset app data
            </Button>
            <Button color="error" variant="contained" onClick={onDeleteAccount} disabled={busy}>
              Delete account
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
