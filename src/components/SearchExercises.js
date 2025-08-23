import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { exerciseOptions, fetchData } from '../services/fetchData';
import HorizontalScrollbar from './HorizontalScrollbar';

const CHRONIC_LABELS = ['All', 'Back', 'Knees', 'Ankle'];
const MATCHES = {
  Back: ['back', 'lower back'],
  Knees: ['upper legs'],
  Ankle: ['lower legs'],
};

const SearchExercises = ({ setExercises, bodyPart = 'All', setBodyPart }) => {
  const [search, setSearch] = useState('');
  const [allChronic, setAllChronic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Initial fetch (only once)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchData(
          'https://exercisedb.p.rapidapi.com/exercises?limit=1500',
          exerciseOptions
        );

        if (!mounted) return;

        if (!Array.isArray(data)) {
          console.error('Exercises API returned non-array:', data);
          setAllChronic([]);
          setExercises([]);
          return;
        }

        const relevant = ['back', 'lower back', 'upper legs', 'lower legs'];
        const chronic = data.filter(ex =>
          relevant.includes((ex.bodyPart || '').toLowerCase())
        );

        setAllChronic(chronic);
        setExercises(chronic); // seed the main list with everything
      } catch (e) {
        console.warn('Failed to load exercises:', e);
        setAllChronic([]);
        setExercises([]);
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [setExercises]);

  // Filter when a tab/bodyPart changes
  useEffect(() => {
    const label = String(bodyPart || 'All').toLowerCase();
    if (label === 'all') {
      setExercises(allChronic);
      setNoResults(false);
      return;
    }
    const key = Object.keys(MATCHES).find(k => k.toLowerCase() === label);
    const targets = key ? MATCHES[key] : null;
    if (!targets) {
      setExercises([]);
      setNoResults(true);
      return;
    }
    const filtered = allChronic.filter(ex =>
      targets.includes((ex.bodyPart || '').toLowerCase())
    );
    setExercises(filtered);
    setNoResults(filtered.length === 0);
  }, [bodyPart, allChronic, setExercises]);

  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    const filtered = allChronic.filter(ex => {
      const name = ex.name?.toLowerCase() || '';
      const target = ex.target?.toLowerCase() || '';
      const equip = ex.equipment?.toLowerCase() || '';
      const part = ex.bodyPart?.toLowerCase() || '';
      return (
        name.includes(q) || target.includes(q) || equip.includes(q) || part.includes(q)
      );
    });

    setExercises(filtered);
    setNoResults(filtered.length === 0);
    window.scrollTo({ top: 1800, behavior: 'smooth' });
  };

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
          No exercises found. Try using a more common term like “pull-up” or “squat”.
        </Typography>
      )}

      <Box sx={{ position: 'relative', width: '100%', p: '20px' }}>
        <HorizontalScrollbar
          data={CHRONIC_LABELS}
          bodyPart={bodyPart}
          setBodyPart={setBodyPart}
          isBodyParts
        />
      </Box>
    </Stack>
  );
};

export default SearchExercises;
