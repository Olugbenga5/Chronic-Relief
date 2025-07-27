import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { exerciseOptions, fetchData } from '../services/fetchData';
import HorizontalScrollbar from './HorizontalScrollbar';

const CHRONIC_BODY_PART_LABELS = ['All', 'Back', 'Knees', 'Ankle'];

const CHRONIC_BODY_PART_MATCHES = {
  Back: ['back'],
  Knees: ['upper legs'],
  Ankle: ['lower legs'],
};

const SearchExercises = ({ setExercises, bodyPart, setBodyPart }) => {
  const [search, setSearch] = useState('');
  const [bodyParts, setBodyParts] = useState(CHRONIC_BODY_PART_LABELS);
  const [allChronicExercises, setAllChronicExercises] = useState([]);
  const [noResults, setNoResults] = useState(false); 


  useEffect(() => {
   const fetchChronicPainExercises = async () => {
      try {
        const data = await fetchData(
          'https://exercisedb.p.rapidapi.com/exercises?limit=1500',
          exerciseOptions
        );

        const relevantParts = ['back', 'upper legs', 'lower legs'];
        const chronic = data.filter((ex) =>
          relevantParts.includes(ex.bodyPart.toLowerCase())
        );

        setAllChronicExercises(chronic);
        setExercises(chronic);
      } catch (err) {
        console.warn('Failed to load chronic pain exercises:', err);
      }
    };

    fetchChronicPainExercises();
  }, [setExercises]);

  const handleSearch = () => {
    if (search && allChronicExercises.length > 0) {
      const filtered = allChronicExercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(search) ||
          ex.target.toLowerCase().includes(search) ||
          ex.equipment.toLowerCase().includes(search) ||
          ex.bodyPart.toLowerCase().includes(search)
      );

      setSearch('');
      setExercises(filtered);
      setNoResults(filtered.length === 0); 
      window.scrollTo({ top: 1800, left: 100, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const normalized = bodyPart.toLowerCase();

    if (normalized === 'all') {
      setExercises(allChronicExercises);
    } else {
      const matchKey = Object.keys(CHRONIC_BODY_PART_MATCHES).find(
        key => key.toLowerCase() === normalized
      );

      const matches = CHRONIC_BODY_PART_MATCHES[matchKey];

      if (!matches) {
        console.warn(` No match config for bodyPart: ${bodyPart}`);
        setExercises([]);
        return;
      }

      const filtered = allChronicExercises.filter((ex) =>
        matches.includes(ex.bodyPart.toLowerCase())
      );
      setExercises(filtered);
    }

    // Clear search warning if they change tab
    setNoResults(false);
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

      <Box position="relative" mb="72px">
        <TextField
          sx={{
            input: { fontWeight: '700' },
            width: { lg: '800px', xs: '350px' },
            backgroundColor: '#fff',
            borderRadius: '40px',
          }}
          height="76px"
          value={search}
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
          placeholder="Search exercises by name, target, or equipment"
          type="text"
        />
        <Button
          sx={{
            backgroundColor: '#FF2625',
            color: '#fff',
            textTransform: 'none',
            width: { lg: '175px', xs: '80px' },
            fontSize: { lg: '20px', xs: '14px' },
            height: '56px',
            position: 'absolute',
            right: '0',
          }}
          onClick={handleSearch}
        >
          Search
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
