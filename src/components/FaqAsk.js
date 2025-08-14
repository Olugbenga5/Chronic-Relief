import React, { useState } from "react";

function FaqAsk() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setA("Thinking…");

    try {
      const r = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!r.ok) {
        const msg = await r.text();
        setA(`Server error (${r.status}): ${msg || "Unable to answer."}`);
        return;
      }

      const data = await r.json();
      setA(data.answer || "No answer.");
    } catch (e) {
      console.error(e);
      setA("Sorry—something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-xl">
      <h2 className="text-xl font-semibold mb-2">Ask our AI FAQ</h2>
      <input
        className="border p-2 w-full rounded mb-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="e.g., How do I change my pain area?"
      />
      <button
        onClick={ask}
        disabled={loading}
        className="bg-black text-white px-3 py-2 rounded"
      >
        {loading ? "Answering..." : "Ask"}
      </button>
      <div className="mt-4 whitespace-pre-wrap">{a}</div>
    </div>
  );
}

export default FaqAsk;
