import React from "react";
import { Stack } from "@mui/material";
import ClipLoader from "react-spinners/ClipLoader";

const Loader = () => {
  return (
    <Stack direction="row" justifyContent="center" alignItems="center" width="100%">
      <ClipLoader color="#646cff" size={50} />
    </Stack>
  );
};

export default Loader;
