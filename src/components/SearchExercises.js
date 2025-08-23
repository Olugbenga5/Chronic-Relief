import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { exerciseOptions, fetchData } from '../services/fetchData';
import HorizontalScrollbar from './HorizontalScrollbar';

const CHRONIC_BODY_PART_LABELS = ['All', 'Back', 'Knees', 'Ankle'];
const CHRONIC_MATCHES = {
  Back: ['back', 'lower back'],
  Knees: ['upper legs'],
  Ankle: ['lower legs'],
};

const EXDB = 'https://exercisedb.p.rapidapi.com';

const SearchExercises = ({ setExercises, bodyPart, setBodyPart }) => {
  const [search, setSearch] = useState('');
  const [bodyParts] = useState(CHRONIC_BODY_PART_LABELS);
  const [allChronic, setAllChronic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Helper to fetch one bodyPart list (with a generous limit param for plans that honor it)
  const fetchByBodyPart = async (part) => {
    return await fetchData(`${EXDB}/exercises/bodyPart/${encodeURIComponent(part)}?limit=500`, exerciseOptions) || [];
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        // Try the big dump first
        const bulk = await fetchData(`${EXDB}/exercises?limit=1500`, exerciseOptions) || [];
        let pool = bulk;

        // If we look capped (RapidAPI plan/region sometimes returns ~10/20),
        // fall back to merging body-part endpoints we care about.
        if (!Array.isArray(bulk) || bulk.length < 50) {
          const [back, upperLegs, lowerLegs] = await Promise.all([
            fetchByBodyPart('back'),
            fetchByBodyPart('upper legs'),
            fetchByBodyPart('lower legs'),
          ]);

          // Deduplicate by id
          const map = new Map();
          [...back, ...upperLegs, ...lowerLegs].forEach((ex) => {
            const id = String(ex.id ?? ex._id ?? Math.random());
            if (!map.has(id)) map.set(id, ex);
          });
          pool = Array.from(map.values());
        }

        // Keep only chronic‑relevant areas
        const relevantParts = ['back', 'lower back', 'upper legs', 'lower legs'];
        const chronic = (pool || []).filter(
          (ex) => relevantParts.includes(String(ex.bodyPart || '').toLowerCase())
        );

        if (!alive) return;
        setAllChronic(chronic);
        setExercises(chronic);

        console.log('[SearchExercises] Loaded:', {
          total: pool?.length ?? 0,
          chronic: chronic.length,
        });
      } catch (e) {
        console.error('Failed to load exercises:', e);
        if (!alive) return;
        setAllChronic([]);
        setExercises([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [setExercises]);

  // Search
  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    const filtered = allChronic.filter((ex) => {
      const name = ex.name?.toLowerCase() || '';
      const target = ex.target?.toLowerCase() || '';
      const equip = ex.equipment?.toLowerCase() || '';
      const part = ex.bodyPart?.toLowerCase() || '';
      return name.includes(q) || target.includes(q) || equip.includes(q) || part.includes(q);
    });

    setExercises(filtered);
    setNoResults(filtered.length === 0);
    window.scrollTo({ top: 1800, behavior: 'smooth' });
  };

  // Tab switching (All / Back / Knees / Ankle)
  useEffect(() => {
    const bp = (bodyPart || 'all').toLowerCase();
    if (bp === 'all') {
      setExercises(allChronic);
    } else {
      const key = Object.keys(CHRONIC_MATCHES).find((k) => k.toLowerCase() === bp);
      const matches = key ? CHRONIC_MATCHES[key] : [];
      const filtered = allChronic.filter((ex) =>
        matches.includes(String(ex.bodyPart || '').toLowerCase())
      );
      setExercises(filtered);
    }
    setNoResults(false);
  }, [bodyPart, allChronic, setExercises]);

  return (
    <Stack alignItems="center" mt="37px" justifyContent="center" p="20px">
      <Typography fontWeight={700} sx={{ fontSize: { lg: '44px', xs: '30px' } }} mb="50px" textAlign="center">
        Here Are Some Exercises <br />For Chronic Pain Relief
      </Typography>

      <Box position="relative" mb="72px" display="flex" gap={1}>
        <TextField
          sx={{
            input: { fontWeight: 700 },
            width: { lg: '800px', xs: '350px' },
            backgroundColor: '#fff',
            borderRadius: '40px',
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={loading ? 'Loading exercises…' : 'Search exercises by name, target, or equipment'}
          type="text"
          disabled={loading}
        />
        <Button
          sx={{
            backgroundColor: '#FF2625',
            color: '#fff',
            textTransform: 'none',
            width: { lg: '175px', xs: '80px' },
            fontSize: { lg: '20px', xs: '14px' },
            height: '56px',
          }}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Search'}
        </Button>
      </Box>

      {noResults && (
        <Typography color="red" fontSize="16px" mb="20px" textAlign="center">
          No exercises found. Try a different term.
        </Typography>
      )}

      <Box sx={{ position: 'relative', width: '100%', p: '20px' }}>
        <HorizontalScrollbar
          data={bodyParts}
          bodyPart={bodyPart}
          setBodyPart={setBodyPart}
          isBodyParts
        />
      </Box>
    </Stack>
  );
};

export default SearchExercises;
