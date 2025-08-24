import axios from 'axios';
const KEY = process.env.REACT_APP_RAPID_API_KEY;

export const exerciseOptions = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': KEY,
    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
  },
};

export const youtubeOptions = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': KEY,
    'x-rapidapi-host': 'youtube-search-and-download.p.rapidapi.com',
  },
};

export const fetchWithAxios = async (url, options) => {
  try {
    if (!KEY) {
      console.error('[RapidAPI] Missing REACT_APP_RAPID_API_KEY.');
    }
    const { data } = await axios.request({ url, ...options });
    return data;
  } catch (err) {
    console.error('Axios fetch error:', err?.response || err);
    return null;
  }
};

export const fetchData = async (url, options) => {
  try {
    if (!KEY) {
      console.error('[RapidAPI] Missing REACT_APP_RAPID_API_KEY.');
    }
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} – ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
};
