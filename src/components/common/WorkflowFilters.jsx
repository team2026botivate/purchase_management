import React, { useState, useEffect } from 'react';
import {
  Box, TextField, MenuItem, IconButton, Tooltip, InputAdornment, Divider, useTheme,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

export const defaultFilters = {
  indentNumber: '',
  itemName:     '',
  partyName:    '',
  companyName:  '',
  status:       '',
  dateFrom:     '',
  dateTo:       '',
};

/* ── Shared input sx ── */
const INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    height: 38,
    borderRadius: '8px',
    fontSize: '0.8rem',
    bgcolor: 'background.paper',
  },
  '& .MuiOutlinedInput-input': {
    py: 0,
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.78rem',
    top: '-1px',
  },
  '& .MuiInputLabel-shrink': {
    top: 0,
  },
};

export default function WorkflowFilters({ appliedFilters, onApply, onReset }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => { setFilters(appliedFilters); }, [appliedFilters]);

  const fi = (key) => (e) => {
    const newFilters = { ...filters, [key]: e.target.value };
    setFilters(newFilters);
    onApply(newFilters);
  };

  const handleReset = () => { setFilters(defaultFilters); onReset(); };

  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        px: 2,
        py: 1.25,
        mb: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: '12px',
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
      }}
    >
      {/* ── Search ── */}
      <TextField
        size="small"
        placeholder="Search records..."
        value={filters.indentNumber}
        onChange={fi('indentNumber')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ ...INPUT_SX, width: 220 }}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* ── Status ── */}
      <TextField
        select size="small" label="Status"
        value={filters.status} onChange={fi('status')}
        sx={{ ...INPUT_SX, width: 145 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="Pending Approval">Pending Approval</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Fully Completed">Fully Completed</MenuItem>
      </TextField>

      {/* ── From Date ── */}
      <TextField
        size="small" type="date" label="From"
        value={filters.dateFrom} onChange={fi('dateFrom')}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ ...INPUT_SX, width: 148 }}
      />

      {/* ── To Date ── */}
      <TextField
        size="small" type="date" label="To"
        value={filters.dateTo} onChange={fi('dateTo')}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ ...INPUT_SX, width: 148 }}
      />

      {/* ── Supplier ── */}
      <TextField
        size="small" label="Supplier"
        value={filters.partyName} onChange={fi('partyName')}
        sx={{ ...INPUT_SX, width: 140 }}
      />

      {/* ── Company ── */}
      <TextField
        size="small" label="Company"
        value={filters.companyName} onChange={fi('companyName')}
        sx={{ ...INPUT_SX, width: 140 }}
      />

      {/* ── Reset ── */}
      <Tooltip title="Reset Filters" arrow>
        <IconButton
          size="small"
          onClick={handleReset}
          sx={{
            width: 34,
            height: 34,
            borderRadius: '8px',
            border: 1,
            borderColor: hasActiveFilter ? 'error.300' : 'divider',
            color: hasActiveFilter ? 'error.main' : 'text.secondary',
            bgcolor: hasActiveFilter
              ? (isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)')
              : 'transparent',
            '&:hover': {
              bgcolor: 'rgba(239,68,68,0.1)',
              borderColor: 'error.main',
              color: 'error.main',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <FilterAltOffIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
