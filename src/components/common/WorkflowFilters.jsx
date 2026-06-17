import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, Button, Stack, Typography } from '@mui/material';
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

const FIELD_SX = {
  width: '100%',
  '& .MuiInputBase-root': { width: '100%' },
  '& .MuiSelect-select': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.8rem',
  },
  '& .MuiInputBase-input': {
    fontSize: '0.8rem',
  }
};

export default function WorkflowFilters({ appliedFilters, onApply, onReset }) {
  const [filters, setFilters] = useState(defaultFilters);

  // Sync state when reset
  useEffect(() => {
    setFilters(appliedFilters);
  }, [appliedFilters]);

  const fi = (key) => (e) => {
    const newFilters = { ...filters, [key]: e.target.value };
    setFilters(newFilters);
    onApply(newFilters);
  };

  const handleReset = () => { setFilters(defaultFilters); onReset(); };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
        
        <TextField
          select size="small" label="Status" sx={{ ...FIELD_SX, minWidth: 150 }}
          value={filters.status} onChange={fi('status')}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="Pending Approval">Pending Approval</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Fully Completed">Fully Completed</MenuItem>
        </TextField>

        <TextField
          size="small" type="date" label="From Date" sx={{ ...FIELD_SX, minWidth: 150 }}
          value={filters.dateFrom} onChange={fi('dateFrom')}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          size="small" type="date" label="To Date" sx={{ ...FIELD_SX, minWidth: 150 }}
          value={filters.dateTo} onChange={fi('dateTo')}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          size="small" label="Supplier / Party" sx={{ ...FIELD_SX, minWidth: 150 }}
          value={filters.partyName} onChange={fi('partyName')}
        />

        <TextField
          size="small" label="Company" sx={{ ...FIELD_SX, minWidth: 150 }}
          value={filters.companyName} onChange={fi('companyName')}
        />

        <Button
          variant="outlined" size="small" color="inherit"
          startIcon={<FilterAltOffIcon sx={{ fontSize: 15 }} />}
          onClick={handleReset}
          sx={{ height: 40, whiteSpace: 'nowrap' }}
        >
          Reset
        </Button>
      </Stack>
    </Box>
  );
}
