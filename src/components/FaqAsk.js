import React, { useState } from "react";

// Preloaded suggestions (tweak to fit your app)
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

function FaqAsk() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function ask(questionOverride) {
    const prompt = (questionOverride ?? q).trim();
    if (!prompt) return;

    setErrorText("");
    setA("Thinking…");
    setLoading(true);

    try {
      const r = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt }),
      });

      if (!r.ok) {
        const msg = await r.text();
        setErrorText(`Server error (${r.status})`);
        setA(msg || "Sorry—unable to answer right now.");
        return;
      }

      const data = await r.json();
      setA(data.answer || "No answer.");
      if (!questionOverride) setQ(""); // clear manual input after success
    } catch (e) {
      console.error(e);
      setErrorText("Network error");
      setA("Sorry—something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="faq-container"
      style={{
        maxWidth: 760,
        margin: "2rem auto",
        padding: "1.5rem",
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #eee",
      }}
    >
      <h2
        className="faq-title"
        style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}
      >
        Ask our AI FAQ
      </h2>

      {/* Suggested question chips */}
      <div className="faq-suggestions" style={{ marginBottom: "1rem" }}>
        {SUGGESTED.map((group) => (
          <div key={group.title} className="faq-group" style={{ marginBottom: ".75rem" }}>
            <div
              className="faq-group-title"
              style={{ fontSize: ".95rem", fontWeight: 600, color: "#374151", marginBottom: ".35rem" }}
            >
              {group.title}
            </div>
            <div className="faq-chip-row" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.items.map((item) => (
                <button
                  key={item}
                  className="faq-chip"
                  onClick={() => ask(item)}
                  disabled={loading}
                  aria-label={`Ask: ${item}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: ".9rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ask row */}
      <div className="faq-ask-row" style={{ display: "flex", gap: 8, margin: "1rem 0" }}>
        <input
          className="faq-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type your own question…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) ask();
          }}
          style={{
            flex: 1,
            padding: ".8rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />
        <button
          onClick={() => ask()}
          disabled={loading}
          className="faq-button"
          style={{
            padding: ".8rem 1.2rem",
            backgroundColor: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Answering..." : "Ask"}
        </button>
      </div>

      {errorText && (
        <div className="faq-error" style={{ color: "#b91c1c", fontWeight: 600, marginBottom: ".5rem" }}>
          {errorText}
        </div>
      )}

      <div
        className="faq-answer"
        style={{
          whiteSpace: "pre-wrap",
          color: "#111827",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          padding: "1rem",
          borderRadius: 8,
          minHeight: 64,
        }}
      >
        {a}
      </div>
    </div>
  );
}

export default FaqAsk;
