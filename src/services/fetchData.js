// src/services/fetchData.js
import axios from "axios";

const RAPID_KEY = process.env.REACT_APP_RAPID_API_KEY?.trim();

export const exerciseOptions = {
  method: "GET",
  headers: {
    "x-rapidapi-key": RAPID_KEY || "",
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  },
};

export const youtubeOptions = {
  method: "GET",
  headers: {
    "x-rapidapi-key": RAPID_KEY || "",
    "x-rapidapi-host": "youtube-search-and-download.p.rapidapi.com",
  },
};

export const fetchWithAxios = async (url, options) => {
  try {
    const { data, status } = await axios.request({ url, ...options });
    if (status !== 200) {
      console.error("Axios non-200:", status);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Axios fetch error:", err?.response || err?.message || err);
    return null;
  }
};

export const fetchData = async (url, options) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      console.error("Fetch non-OK:", res.status, text);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
};
