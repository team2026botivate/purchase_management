import { useState, useMemo } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TablePagination, Paper, IconButton, Tooltip, Chip,
  TextField, InputAdornment, Stack, Menu, MenuItem, Checkbox,
  FormControlLabel, Typography, Skeleton, alpha, useTheme, Button,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon        from '@mui/icons-material/Print';
import ViewColumnIcon   from '@mui/icons-material/ViewColumn';
import TableRowsIcon    from '@mui/icons-material/TableRows';
import { exportToExcel, exportToPDF, printTable } from '../../utils/exportUtils';
import { statusColor } from '../../utils/formatters';

/* ── empty state ─────────────────────────────────────── */
function EmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 8,
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 4,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
        }}
      >
        <TableRowsIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
      </Box>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
        No records found
      </Typography>
      <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={300}>
        Try adjusting the search or filter to find what you're looking for.
      </Typography>
    </Box>
  );
}

/* ── toolbar icon button ─────────────────────────────── */
function ToolBtn({ title, onClick, children, color }) {
  return (
    <Tooltip title={title} arrow>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          color: color || 'text.secondary',
          border: 1,
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled', transform: 'scale(1.05)' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

/* ── main component ──────────────────────────────────── */
export default function DataTable({
  columns,
  rows,
  loading,
  title = 'Data',
  searchKey,
  actions,
  density = 'medium',
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [order, setOrder]           = useState('desc');
  const [orderBy, setOrderBy]       = useState(columns[0]?.key || '');
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch]         = useState('');
  const [visibleCols, setVisibleCols] = useState(() => new Set(columns.map((c) => c.key)));
  const [colMenuAnchor, setColMenuAnchor] = useState(null);

  /* ── filtering + sorting ── */
  const filtered = useMemo(() => {
    let data = [...(rows || [])];
    if (search && searchKey) {
      const q = search.toLowerCase();
      data = data.filter((r) =>
        (Array.isArray(searchKey) ? searchKey : [searchKey]).some((k) =>
          String(r[k] ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (orderBy) {
      data.sort((a, b) => {
        const av = a[orderBy] ?? '';
        const bv = b[orderBy] ?? '';
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return order === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, search, searchKey, order, orderBy]);

  const paginated      = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const visibleColumns = columns.filter((c) => visibleCols.has(c.key));
  const exportCols     = visibleColumns.map((c) => ({ key: c.key, header: c.label }));

  const handleSort = (key) => {
    setOrder(orderBy === key && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(key);
  };

  const rowPy = density === 'compact' ? '8px' : '12px';

  /* ─────────────────────────────────────────────────── */
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Toolbar ── */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(241,245,249,.02)' : 'rgba(15,23,42,.01)',
          minHeight: 56,
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search records…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: '100%', sm: 240 },
            '& .MuiOutlinedInput-root': { height: 36, fontSize: '0.875rem' },
          }}
        />

        {/* spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Count */}
        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ whiteSpace: 'nowrap' }}>
          {filtered.length} records
        </Typography>

        {/* Tool buttons */}
        <Stack direction="row" spacing={0.5}>
          <ToolBtn
            title="Export Excel"
            color="#059669"
            onClick={() => exportToExcel(filtered, exportCols, title)}
          >
            <FileDownloadIcon sx={{ fontSize: 16 }} />
          </ToolBtn>
          <ToolBtn
            title="Export PDF"
            color="#dc2626"
            onClick={() => exportToPDF(filtered, exportCols, title, title)}
          >
            <PictureAsPdfIcon sx={{ fontSize: 16 }} />
          </ToolBtn>
          <ToolBtn
            title="Print"
            onClick={() => printTable(filtered, exportCols, title)}
          >
            <PrintIcon sx={{ fontSize: 16 }} />
          </ToolBtn>
          <ToolBtn
            title="Toggle columns"
            onClick={(e) => setColMenuAnchor(e.currentTarget)}
          >
            <ViewColumnIcon sx={{ fontSize: 16 }} />
          </ToolBtn>
        </Stack>
      </Box>

      {/* Column toggle menu */}
      <Menu
        anchorEl={colMenuAnchor}
        open={Boolean(colMenuAnchor)}
        onClose={() => setColMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 180, py: 0.5 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        disableScrollLock
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Columns
        </Typography>
        {columns.map((c) => (
          <MenuItem
            key={c.key}
            dense
            onClick={() =>
              setVisibleCols((prev) => {
                const next = new Set(prev);
                next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                return next;
              })
            }
            sx={{ py: 0.5, mx: 0.5, borderRadius: 1 }}
          >
            <FormControlLabel
              control={<Checkbox checked={visibleCols.has(c.key)} size="small" sx={{ py: 0 }} />}
              label={<Typography variant="body2">{c.label}</Typography>}
              sx={{ m: 0, width: '100%' }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* ── Table ── */}
      <TableContainer sx={{ flex: 1, maxHeight: 520, overflowX: 'auto' }}>
        <Table
          stickyHeader
          size={density === 'compact' ? 'small' : 'medium'}
          sx={{ minWidth: 600 }}
        >
          <TableHead>
            <TableRow>
              {/* Index col */}
              <TableCell
                sx={{
                  width: 48,
                  minWidth: 48,
                  py: '10px',
                  px: 2,
                  zIndex: 3,
                }}
              >
                #
              </TableCell>

              {visibleColumns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    minWidth: col.minWidth || 100,
                    py: '10px',
                    px: 2,
                    whiteSpace: 'nowrap',
                    zIndex: 3,
                  }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.key}
                      direction={orderBy === col.key ? order : 'asc'}
                      onClick={() => handleSort(col.key)}
                      sx={{
                        '& .MuiTableSortLabel-icon': { fontSize: 14 },
                        '&.Mui-active': { color: 'primary.main' },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}

              {actions && (
                <TableCell
                  align="center"
                  sx={{ 
                    width: 120, minWidth: 120, py: '10px', px: 2, 
                    position: 'sticky', right: 0, 
                    bgcolor: isDark ? 'grey.900' : 'grey.100', 
                    zIndex: 4,
                    boxShadow: '-2px 0 5px rgba(0,0,0,0.05)'
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Loading */}
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: visibleColumns.length + (actions ? 2 : 1) }).map((_, j) => (
                    <TableCell key={j} sx={{ py: rowPy }}>
                      <Skeleton animation="wave" height={20} sx={{ borderRadius: 1 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Empty */}
            {!loading && paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (actions ? 2 : 1)}
                  sx={{ border: 0, p: 0 }}
                >
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!loading &&
              paginated.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  hover
                  sx={{
                    transition: 'background 0.1s ease',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.03) },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  {/* Row number */}
                  <TableCell
                    sx={{
                      py: rowPy,
                      px: 2,
                      color: 'text.disabled',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      width: 48,
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>

                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{
                        py: rowPy,
                        px: 2,
                        maxWidth: col.maxWidth || 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: col.wrap ? 'normal' : 'nowrap',
                      }}
                    >
                      {col.render ? (
                        col.render(row[col.key], row)
                      ) : col.type === 'status' ? (
                        <Chip
                          label={row[col.key]}
                          size="small"
                          color={statusColor(row[col.key])}
                          sx={{ fontWeight: 600 }}
                        />
                      ) : col.type === 'currency' ? (
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          ₹{Number(row[col.key] || 0).toLocaleString('en-IN')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.primary">
                          {String(row[col.key] ?? '')}
                        </Typography>
                      )}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell 
                      align="center" 
                      sx={{ 
                        py: rowPy, px: 1.5,
                        position: 'sticky', right: 0,
                        bgcolor: isDark ? '#1e293b' : '#fff', // Match row bg or use solid color
                        zIndex: 2,
                        boxShadow: '-2px 0 5px rgba(0,0,0,0.02)'
                      }}
                    >
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                        {actions(row)}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          sx={{
            '& .MuiTablePagination-toolbar': { minHeight: 48, px: 2 },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.8rem',
              color: 'text.secondary',
            },
          }}
        />
      </Box>
    </Paper>
  );
}
