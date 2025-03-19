import React from 'react';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...'
}: SearchBarProps) => {
  const handleKeyDown = (e: { key: string }) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton onClick={() => onChange('')} edge="end">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
}; 