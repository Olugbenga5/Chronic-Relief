// services/fetchData.js
import axios from "axios";

const RAPID_KEY = process.env.REACT_APP_RAPID_API_KEY;

export const exerciseOptions = {
  method: "GET",
  headers: {
    "x-rapidapi-key": RAPID_KEY,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};

export const youtubeOptions = {
  method: "GET",
  headers: {
    "x-rapidapi-key": RAPID_KEY,
    "x-rapidapi-host": "youtube-search-and-download.p.rapidapi.com",
  },
};

export const fetchWithAxios = async (url, options) => {
  try {
    const res = await axios.request({ url, ...options });
    return res.data;
  } catch (err) {
    console.error("[Axios] request failed:", err?.response?.status, err?.message);
    throw err;
  }
};

export const fetchData = async (url, options) => {
  try {
    if (!RAPID_KEY) {
      console.error(
        "[Fetch] REACT_APP_RAPID_API_KEY is missing. Configure it in your .env (local) and in Vercel → Settings → Environment Variables."
      );
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[Fetch] ${res.status} ${res.statusText} for ${url}`, text?.slice(0, 200));
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[Fetch] request failed:", err?.message);
    throw err;
  }
};
