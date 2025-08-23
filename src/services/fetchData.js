import axios from 'axios';

const RAPID_KEY = process.env.REACT_APP_RAPID_API_KEY;

export const exerciseOptions = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': RAPID_KEY,
    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
  },
};

export const youtubeOptions = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': RAPID_KEY,
    'x-rapidapi-host': 'youtube-search-and-download.p.rapidapi.com',
  },
};

export const fetchWithAxios = async (url, options) => {
  try {
    if (!RAPID_KEY) {
      throw new Error('Missing REACT_APP_RAPID_API_KEY');
    }
    const response = await axios.request({ url, ...options });
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('Axios fetch error:', status, data || error.message);
    throw error;
  }
};

export const fetchData = async (url, options) => {
  try {
    if (!RAPID_KEY) {
      throw new Error('Missing REACT_APP_RAPID_API_KEY');
    }
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      console.error('Fetch error:', res.status, text);
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Fetch network error:', error.message || error);
    throw error;
  }
};
