import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { exerciseOptions, fetchData } from '../services/fetchData';
import HorizontalScrollbar from './HorizontalScrollbar';

const CHRONIC_BODY_PART_LABELS = ['All', 'Back', 'Knees', 'Ankle'];

const CHRONIC_BODY_PART_MATCHES = {
  Back: ['back', 'lower back'],   // include lower back for broader coverage
  Knees: ['upper legs'],
  Ankle: ['lower legs'],
};

const SearchExercises = ({ setExercises, bodyPart, setBodyPart }) => {
  const [search, setSearch] = useState('');
  const [bodyParts] = useState(CHRONIC_BODY_PART_LABELS);
  const [allChronicExercises, setAllChronicExercises] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initial fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchData(
          'https://exercisedb.p.rapidapi.com/exercises?limit=1500',
          exerciseOptions
        );

        if (!alive) return;

        if (!Array.isArray(data)) {
          console.error('Exercises API returned non-array:', data);
          setAllChronicExercises([]);
          setExercises([]);
          return;
        }

        const relevantParts = ['back', 'lower back', 'upper legs', 'lower legs'];
        const chronic = data.filter((ex) =>
          relevantParts.includes((ex.bodyPart || '').toLowerCase())
        );

        setAllChronicExercises(chronic);
        setExercises(chronic);
      } catch (err) {
        console.warn('Failed to load chronic pain exercises:', err);
        setAllChronicExercises([]);
        setExercises([]);
      } finally {
        alive && setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [setExercises]);

  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    const src = allChronicExercises;
    const filtered = src.filter((ex) => {
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

  // Tab switching
  useEffect(() => {
    const normalized = (bodyPart || 'all').toLowerCase();

    if (normalized === 'all') {
      setExercises(allChronicExercises);
    } else {
      const matchKey = Object.keys(CHRONIC_BODY_PART_MATCHES).find(
        (key) => key.toLowerCase() === normalized
      );
      const matches = matchKey ? CHRONIC_BODY_PART_MATCHES[matchKey] : null;

      if (!matches) {
        console.warn(`No match config for bodyPart: ${bodyPart}`);
        setExercises([]);
      } else {
        const filtered = allChronicExercises.filter((ex) =>
          matches.includes((ex.bodyPart || '').toLowerCase())
        );
        setExercises(filtered);
      }
    }

    setNoResults(false); // clear search warning on tab change
  }, [bodyPart, allChronicExercises, setExercises]);

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
          No exercises found. Try using a more common term like "pull-up" or "squat".
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
