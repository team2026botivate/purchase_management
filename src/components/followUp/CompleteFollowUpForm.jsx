import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Divider, Typography
} from '@mui/material';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import { completeStage, updateRecord } from '../../store/slices/workflowSlice';
import { toast } from 'react-toastify';

/* ── Shared INPUT_SX matches the pattern used across all app forms ── */
const INPUT_SX = {
  width: '100%',
  '& .MuiInputBase-root': { width: '100%' },
  '& .MuiSelect-select': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

/* ── CSS-grid row helper — same as IndentManagementPage ── */
const GridRow = ({ cols = [1], children, sx = {} }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: cols.map(() => '1fr').join(' '),
      },
      gap: 2,
      mb: 2,
      '& > *': { minWidth: 0 },
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default function CompleteFollowUpForm({ open, onClose, selectedRow }) {
  const dispatch = useDispatch();

  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      followUpStatus: '',
      followUpBy: '',
      expectedArrivalDate: '',
      nextFollowDate: '',
      remarks: '',
    },
  });

  const followUpStatus = watch('followUpStatus');

  const onSubmit = (data) => {
    if (!selectedRow) return;

    dispatch(updateRecord({ id: selectedRow.id, followUpDetails: data }));

    if (data.followUpStatus === 'Arrange Logistics') {
      dispatch(completeStage({ id: selectedRow.id, currentStage: 'followUp', nextStageOverride: 'logistics' }));
      toast.success('Follow-up completed! Record moved to Arrange Logistics.');
      onClose();
    } else if (data.followUpStatus === 'Direct Receiving') {
      dispatch(completeStage({ id: selectedRow.id, currentStage: 'followUp', nextStageOverride: 'receiveMaterial' }));
      toast.success('Follow-up completed! Record moved to Receive Material.');
      onClose();
    } else if (data.followUpStatus === 'Next Follow Up') {
      toast.success('Next Follow-up scheduled. Record remains in Pending.');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 2,
            bgcolor: 'primary.50',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <PhoneCallbackIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        </Box>
        Complete Follow-Up
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>

          {/* ── Row 1: Follow Up Status (full width) ── */}
          <GridRow cols={[1]} sx={{ mb: followUpStatus ? 2 : 0 }}>
            <Controller
              name="followUpStatus"
              control={control}
              rules={{ required: 'Follow Up Status is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  size="small"
                  label="Follow Up Status *"
                  sx={INPUT_SX}
                  error={!!errors.followUpStatus}
                  helperText={errors.followUpStatus?.message}
                >
                  <MenuItem value="Arrange Logistics">Arrange Logistics</MenuItem>
                  <MenuItem value="Direct Receiving">Direct Receiving</MenuItem>
                  <MenuItem value="Next Follow Up">Next Follow Up</MenuItem>
                </TextField>
              )}
            />
          </GridRow>

          {/* ── Dynamic fields — only shown once a status is selected ── */}
          {followUpStatus && (
            <>
              {/* Follow Up By — always shown */}
              <GridRow cols={[1]}>
                <TextField
                  fullWidth
                  size="small"
                  label="Follow Up By *"
                  sx={INPUT_SX}
                  {...register('followUpBy', { required: 'Follow Up By is required' })}
                  error={!!errors.followUpBy}
                  helperText={errors.followUpBy?.message}
                />
              </GridRow>

              {/* Expected Arrival Date — Arrange Logistics only */}
              {followUpStatus === 'Arrange Logistics' && (
                <GridRow cols={[1]}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Expected Arrival Date *"
                    sx={INPUT_SX}
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register('expectedArrivalDate', { required: 'Expected Arrival Date is required' })}
                    error={!!errors.expectedArrivalDate}
                    helperText={errors.expectedArrivalDate?.message}
                  />
                </GridRow>
              )}

              {/* Next Follow Date — Direct Receiving only */}
              {followUpStatus === 'Direct Receiving' && (
                <GridRow cols={[1]}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Next Follow Date *"
                    sx={INPUT_SX}
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register('nextFollowDate', { required: 'Next Follow Date is required' })}
                    error={!!errors.nextFollowDate}
                    helperText={errors.nextFollowDate?.message}
                  />
                </GridRow>
              )}

              {/* Remarks — always shown once status is selected */}
              <GridRow cols={[1]} sx={{ mb: 0 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Remarks *"
                  sx={INPUT_SX}
                  {...register('remarks', { required: 'Remarks are required' })}
                  error={!!errors.remarks}
                  helperText={errors.remarks?.message}
                />
              </GridRow>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Submit Follow-Up
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
