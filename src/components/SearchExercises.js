import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { exerciseOptions, fetchData } from '../services/fetchData';
import HorizontalScrollbar from './HorizontalScrollbar';

const EXDB = 'https://exercisedb.p.rapidapi.com';

// UI labels (what users click)
const CHRONIC_BODY_PART_LABELS = ['All', 'Back', 'Knee', 'Ankle'];

// Internal matching map — **only singular 'knee'**
const CHRONIC_MATCHES = {
  back: ['back', 'lower back'],
  knee: ['upper legs'],
  ankle: ['lower legs'],
};

const SearchExercises = ({ setExercises, bodyPart, setBodyPart }) => {
  const [search, setSearch] = useState('');
  const [allChronic, setAllChronic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const fetchByBodyPart = async (part) => {
    const url = `${EXDB}/exercises/bodyPart/${encodeURIComponent(part)}?limit=500`;
    const data = await fetchData(url, exerciseOptions);
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        // Try bulk first
        const bulk = (await fetchData(`${EXDB}/exercises?limit=1500`, exerciseOptions)) || [];
        let pool = Array.isArray(bulk) ? bulk : [];

        // If capped, pull the three relevant parts and dedupe
        if (pool.length < 50) {
          const [back, upperLegs, lowerLegs] = await Promise.all([
            fetchByBodyPart('back'),
            fetchByBodyPart('upper legs'),
            fetchByBodyPart('lower legs'),
          ]);
          const map = new Map();
          [...back, ...upperLegs, ...lowerLegs].forEach((ex) => {
            const id = String(ex?.id ?? ex?._id ?? Math.random());
            if (!map.has(id)) map.set(id, ex);
          });
          pool = Array.from(map.values());
        }

        const relevant = ['back', 'lower back', 'upper legs', 'lower legs'];
        const chronic = pool.filter((ex) =>
          relevant.includes(String(ex.bodyPart || '').toLowerCase())
        );

        if (!alive) return;
        setAllChronic(chronic);
        setExercises(chronic);
      } catch (e) {
        if (!alive) return;
        console.error('Failed to load exercises:', e);
        setAllChronic([]);
        setExercises([]);
      } finally {
        alive && setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [setExercises]);

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

  // Tab changes: All / Back / Knee / Ankle
  useEffect(() => {
    const bp = String(bodyPart || 'all').toLowerCase();

    if (bp === 'all') {
      setExercises(allChronic);
    } else {
      const matches = CHRONIC_MATCHES[bp];
      const filtered = matches
        ? allChronic.filter((ex) =>
            matches.includes(String(ex.bodyPart || '').toLowerCase())
          )
        : [];
      setExercises(filtered);
    }
    setNoResults(false);
  }, [bodyPart, allChronic, setExercises]);

  return (
    <Stack alignItems="center" mt="37px" justifyContent="center" p="20px">
      <Typography
        fontWeight={700}
        sx={{ fontSize: { lg: '44px', xs: '30px' } }}
        mb="50px"
        textAlign="center"
      >
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
          placeholder={loading ? 'Loading exercises…' : 'Search by name, target, or equipment'}
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
          data={CHRONIC_BODY_PART_LABELS}
          bodyPart={bodyPart}
          setBodyPart={setBodyPart}
          isBodyParts
        />
      </Box>
    </Stack>
  );
};

export default SearchExercises;
