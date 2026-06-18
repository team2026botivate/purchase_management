import { Box, Typography, Button, Stack, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * Compact single-row page header.
 * Left: title + subtitle  |  Right: action buttons
 * Max height ~56px — no breadcrumbs, no excessive padding.
 */
export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        maxHeight: 72,
        py: 1,
        px: 0,
        mb: 0,
      }}
    >
      {/* Left — Title + subtitle */}
      <Box>
        <Typography
          variant="h6"
          fontWeight={700}
          letterSpacing="-0.02em"
          color="text.primary"
          sx={{ lineHeight: 1.25 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Right — action slot */}
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Box>
  );
}
