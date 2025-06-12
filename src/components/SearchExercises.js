import React,{useEffect, useState } from 'react';
import {Box, Button,Stack, TextField, Typography} from '@mui/material';


function SearchExercises() {
  return (
    <Stack alignItems={'center'} mt="37px" justifyContent={"center"} p="20px">
      <Typography fontWeight={700} xs ={{fontSize: {lg:'44px', xs:'30px'}}} mb={"50px"} textAlign={"center"}>Here Are Some Exercises <br/>You Should Try</Typography>
      <Box position= "relative" mb={"72px"}>
        <TextField sx ={{input: {fontweight: '700',border:'none', borderRadius:'4px'}, width:{lg: '1170px',xs:'350px'},backgroundColor:'#fff',borderRadius:'40px'}} height = "76px" value="" onChange={(e)=>{}} placeholder='Search Exercises' type='text'/>
          <Button className='search-btn'>Search</Button>
          </Box>
    </Stack>
  )
}

export default SearchExercises
