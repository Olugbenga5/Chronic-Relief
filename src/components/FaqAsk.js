import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { auth } from "../firebase";

const SUGGESTED = [
  {
    title: "Getting started",
    items: [
      "How do I pick my pain area?",
      "Where do I see my routines?",
      "How do I reset my password?",
    ],
  },
  {
    title: "Routines & exercises",
    items: [
      "How do I generate a new routine for my pain area?",
      "What should I do if an exercise hurts?",
      "Why are no exercises showing after I change pain area?",
    ],
  },
  {
    title: "Progress & history",
    items: [
      "How is my progress saved?",
      "Where can I see my routine history?",
      "My session didn’t save—how do I fix it?",
    ],
  },
  {
    title: "General & safety",
    items: [
      "Is Chronic Relief medical advice?",
      "Which browsers are supported?",
      "Why won’t the exercise video play?",
    ],
  },
];

function isDefinitionQuestion(text) {
  const t = text.trim().toLowerCase();
  return /^(what is|how (to|do) (do|perform)|form|technique)\b/.test(t);
}

function extractNameFromQuestion(text) {
  const m = text.match(/^what is\s+(.+?)\?*$/i);
  return (m && m[1]) ? m[1].trim() : text.trim();
}

export default function FaqAsk() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const answerRef = useRef(null);

  async function ask(questionOverride) {
    const prompt = (questionOverride ?? q).trim();
    if (!prompt || loading) return;

    setErrorText("");
    setA("Thinking…");
    setLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken?.();

      if (isDefinitionQuestion(prompt)) {
        const nameOrSlug = extractNameFromQuestion(prompt);
        const r = await fetch("/api/exercise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ nameOrSlug }),
        });

        if (r.ok) {
          const data = await r.json();
          setA(data.answer || "No answer.");
          if (!questionOverride) setQ("");
          setTimeout(() => answerRef.current?.focus(), 0);
          return;
        }
      }

      const r = await fetch("/api/faq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ question: prompt }),
      });

      if (!r.ok) {
        const msg = await r.text();
        if (r.status === 401 || r.status === 403) {
          setErrorText("You may need to log in again.");
        } else if (r.status === 429) {
          setErrorText("We’re getting a lot of questions. Please try again shortly.");
        } else {
          setErrorText(`Server error (${r.status})`);
        }
        setA(msg || "Sorry—unable to answer right now.");
        return;
      }

      const data = await r.json();
      setA(data.answer || "No answer.");
      if (!questionOverride) setQ("");
      setTimeout(() => answerRef.current?.focus(), 0);
    } catch (e) {
      console.error(e);
      setErrorText("Network error");
      setA("Sorry—something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const copyAnswer = async () => {
    if (!a) return;
    try {
      await navigator.clipboard.writeText(a);
    } catch {
    }
  };

  const clearAll = () => {
    setQ("");
    setA("");
    setErrorText("");
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          bgcolor: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(4px)",
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={1} sx={{ color: "#fff" }}>
          AI‑Powered FAQ
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }} mb={2}>
          Ask anything about Chronic Relief: exercises, routines, progress tracking, login/signup, etc.
        </Typography>

        {/* Suggested chips */}
        <Stack spacing={1.5} mb={2}>
          {SUGGESTED.map((group) => (
            <Box key={group.title}>
              <Typography
                variant="subtitle2"
                sx={{ color: "rgba(255,255,255,0.85)", mb: 0.5, fontWeight: 600 }}
              >
                {group.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {group.items.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onClick={() => ask(item)}
                    disabled={loading}
                    sx={{
                      borderColor: "rgba(255,255,255,0.15)",
                      bgcolor: "rgba(255,255,255,0.07)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                    }}
                    variant="outlined"
                    clickable
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={2}>
          <TextField
            fullWidth
            placeholder="Type your own question…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) ask();
            }}
            inputProps={{ "aria-label": "FAQ question" }}
            sx={{
              "& .MuiInputBase-root": {
                bgcolor: "rgba(255,255,255,0.08)",
                color: "#fff",
              },
            }}
          />
          <Button
            onClick={() => ask()}
            disabled={loading || !q.trim()}
            variant="contained"
            size="large"
            sx={{ fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={22} /> : "Ask"}
          </Button>
          <Button onClick={clearAll} disabled={loading} variant="outlined" sx={{ color: "#fff" }}>
            Clear
          </Button>
        </Stack>

        {errorText && (
          <Typography sx={{ color: "#ffb4b4" }} fontWeight={700} mb={1}>
            {errorText}
          </Typography>
        )}

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />

        <Box
          ref={answerRef}
          tabIndex={-1}
          aria-live="polite"
          sx={{
            whiteSpace: "pre-wrap",
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            p: 2,
            borderRadius: 1.5,
            minHeight: 64,
          }}
        >
          {a || "Ask a question or tap a suggestion above."}
        </Box>

        <Stack direction="row" spacing={1} mt={1.5} justifyContent="flex-end">
          <Button onClick={copyAnswer} size="small" variant="text" disabled={!a} sx={{ color: "#fff" }}>
            Copy answer
          </Button>
        </Stack>

        <Typography variant="caption" sx={{ display: "block", mt: 2, color: "rgba(255,255,255,0.7)" }}>
          Note: This FAQ helps with app usage and isn’t medical advice.
        </Typography>
      </Paper>
    </Box>
  );
}
