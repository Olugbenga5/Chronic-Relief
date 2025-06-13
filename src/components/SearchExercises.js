import React,{useEffect, useState } from 'react';
import {Box, Button,Stack, TextField, Typography} from '@mui/material';


function SearchExercises() {
    const [search, setSearch] = useState('')
    const handleSearch = async () => {
      if(search){
        // const exercisesData = await fetchData();
        
      }
    }
  return (
    <Stack alignItems={'center'} mt="37px" justifyContent={"center"} p="20px">
      <Typography fontWeight={700} xs ={{fontSize: {lg:'44px', xs:'30px'}}} mb={"50px"} textAlign={"center"}>Here Are Some Exercises <br/>You Should Try</Typography>
      <Box position= "relative" mb={"72px"}>
        <TextField sx ={{input: {fontweight: '700',border:'none', borderRadius:'4px'}, width:{lg: '800px',xs:'350px'},backgroundColor:'#FFFF',borderRadius:'40px'}} height = "76px" value="search" onChange={(e)=> setSearch(e.target.value.toLowerCase())} placeholder='Search Exercises' type='text'/>
          <Button className='search-btn' sx={{ backgroundColor: '#FF2625', color: '#FFFF', textTransform:'none', width: {lg:'175px', xs: '80px'}, fontSize: {lg:'20px', xs: '14px'}, height: '56px', position:'absolute', right: '0'}} onClick={handleSearch}>Search</Button>
          </Box>
    </Stack>
  )
}

export default SearchExercises
