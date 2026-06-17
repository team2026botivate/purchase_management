import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, MenuItem, Typography, Divider, Chip, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ViewBtn, EditBtn, DeleteBtn, PrintBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { addRecord, updateRecord, deleteRecord, completeStage } from '../../store/slices/workflowSlice';
import WorkflowTable, { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import GeneratePOForm from '../../components/po/GeneratePOForm';
import { formatCurrency, formatDate, statusColor, generateNumber } from '../../utils/formatters';
import { COMPANIES, VENDORS, GROUPS, UNITS } from '../../data/mockData';
import { printTable } from '../../utils/exportUtils';

const ORDER_BY = ['Admin User', 'John Smith', 'Sarah Johnson', 'Emma Davis', 'Mike Wilson'];

function IndentForm({ open, onClose, editItem, records }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: editItem || {
      indentNumber: generateNumber('IND', records, 'indentNumber'),
      serialNo: records.length + 1, orderBy: '', partyName: '', groupName: '', itemName: '',
      itemCode: '', description: '', quantity: '', unit: '', rate: '', gst: 18,
      discount: 0, leadDays: '', companyName: '',
    },
  });

  const qty = parseFloat(watch('quantity')) || 0;
  const rate = parseFloat(watch('rate')) || 0;
  const gst = parseFloat(watch('gst')) || 0;
  const disc = parseFloat(watch('discount')) || 0;
  const amount = (qty * rate * (1 + gst / 100) * (1 - disc / 100)).toFixed(2);

  const onSubmit = (data) => {
    const item = { 
      ...data, 
      amount: parseFloat(amount), 
      quantity: Number(data.quantity), 
      rate: Number(data.rate), 
      gst: Number(data.gst), 
      discount: Number(data.discount), 
      leadDays: Number(data.leadDays), 
      createdDate: editItem?.createdDate || new Date().toISOString().slice(0, 10),
      status: 'Pending Approval' // Initial state
    };
    if (editItem) { 
      dispatch(updateRecord(item)); 
      toast.success('Indent updated successfully!'); 
    } else { 
      dispatch(addRecord(item)); 
      toast.success('Indent created successfully!'); 
    }
    onClose();
  };

  /* Shared sx for every TextField so they never resize */
  const INPUT_SX = {
    width: '100%',
    '& .MuiInputBase-root': { width: '100%' },
    '& .MuiSelect-select': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };

  const field = (name, label, opts = {}) => (
    <TextField
      fullWidth size="small" label={label} sx={INPUT_SX}
      {...register(name, { required: opts.required !== false ? `${label} is required` : false })}
      error={!!errors[name]} helperText={errors[name]?.message}
      type={opts.type || 'text'} inputProps={opts.inputProps}
    />
  );

  /* CSS-grid row helpers — columns never flex-shrink */
  const gridRow = (cols, children) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: cols.map(() => '1fr').join(' '),
        },
        gap: 2,
        mb: 2,
        '& > *': { minWidth: 0 },   /* prevents overflow-driven shrink */
      }}
    >
      {children}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        {editItem ? 'Edit Indent' : 'Create New Indent'}
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>

          {/* Row 1: Indent Number | Serial No. | Order By — 3 equal columns */}
          {gridRow([1,1,1], [
            field('indentNumber', 'Indent Number'),
            field('serialNo', 'Serial No.', { type: 'number' }),
            <Controller key="orderBy" name="orderBy" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
              <TextField {...f} select fullWidth size="small" label="Order By" sx={INPUT_SX}
                error={!!errors.orderBy} helperText={errors.orderBy?.message}>
                {ORDER_BY.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            )} />,
          ])}

          {/* Row 2: Party Name | Group Name — 2 equal columns */}
          {gridRow([1,1], [
            <Controller key="partyName" name="partyName" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
              <TextField {...f} select fullWidth size="small" label="Party Name" sx={INPUT_SX}
                error={!!errors.partyName} helperText={errors.partyName?.message}>
                {VENDORS.map((v) => <MenuItem key={v.id} value={v.name}>{v.name}</MenuItem>)}
              </TextField>
            )} />,
            <Controller key="groupName" name="groupName" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
              <TextField {...f} select fullWidth size="small" label="Group Name" sx={INPUT_SX}
                error={!!errors.groupName} helperText={errors.groupName?.message}>
                {GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            )} />,
          ])}

          {/* Row 3: Item Name | Item Code — 2 equal columns */}
          {gridRow([1,1], [
            field('itemName', 'Item Name'),
            field('itemCode', 'Item Code'),
          ])}

          {/* Row 4: Description — full width */}
          {gridRow([1], [field('description', 'Description', { required: false })])}

          {/* Row 5: Quantity | Unit | Rate — 3 equal columns */}
          {gridRow([1,1,1], [
            field('quantity', 'Quantity', { type: 'number', inputProps: { min: 0, step: 0.01 } }),
            <Controller key="unit" name="unit" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
              <TextField {...f} select fullWidth size="small" label="Unit" sx={INPUT_SX}
                error={!!errors.unit} helperText={errors.unit?.message}>
                {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            )} />,
            field('rate', 'Rate (₹)', { type: 'number', inputProps: { min: 0, step: 0.01 } }),
          ])}

          {/* Row 6: GST % | Discount % | Amount (Auto) — 3 equal columns */}
          {gridRow([1,1,1], [
            <Controller key="gst" name="gst" control={control} render={({ field: f }) => (
              <TextField {...f} select fullWidth size="small" label="GST %" sx={INPUT_SX}>
                {[0, 5, 12, 18, 28].map((g) => <MenuItem key={g} value={g}>{g}%</MenuItem>)}
              </TextField>
            )} />,
            field('discount', 'Discount %', { type: 'number', required: false, inputProps: { min: 0, max: 100 } }),
            <TextField key="amount" fullWidth size="small" label="Amount (Auto)" sx={INPUT_SX}
              value={formatCurrency(parseFloat(amount))} disabled />,
          ])}

          {/* Row 7: Lead Days | Company Name — 2 equal columns */}
          {gridRow([1,1], [
            field('leadDays', 'Lead Days', { type: 'number', inputProps: { min: 1 } }),
            <Controller key="companyName" name="companyName" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
              <TextField {...f} select fullWidth size="small" label="Company Name" sx={INPUT_SX}
                error={!!errors.companyName} helperText={errors.companyName?.message}>
                {COMPANIES.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
              </TextField>
            )} />,
          ])}

        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}
        >
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained">
            {editItem ? 'Update' : 'Create'} Indent
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function ViewDialog({ open, onClose, item }) {
  if (!item) return null;
  const fields = [
    ['Indent Number', item.indentNumber], ['Serial No.', item.serialNo], ['Order By', item.orderBy],
    ['Party Name', item.partyName], ['Group Name', item.groupName], ['Item Name', item.itemName],
    ['Item Code', item.itemCode], ['Description', item.description], ['Quantity', item.quantity],
    ['Unit', item.unit], ['Rate', formatCurrency(item.rate)], ['GST %', `${item.gst}%`],
    ['Discount %', `${item.discount}%`], ['Amount', formatCurrency(item.amount)],
    ['Lead Days', `${item.leadDays} days`], ['Company', item.companyName],
    ['Status', item.status], ['Created Date', formatDate(item.createdDate)],
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>Indent Details — {item.indentNumber}</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={1}>
          {fields.map(([label, value]) => (
            <Grid item xs={6} key={label}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={500}>{label === 'Status' ? <Chip label={value} size="small" color={statusColor(value)} /> : value || '—'}</Typography>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export default function IndentManagementPage() {
  const dispatch = useDispatch();
  const records = useSelector((s) => s.workflow.records);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(r => r.workflowStage.indent === 'Pending');
    } else {
      return records.filter(r => r.workflowStage.indent === 'Completed');
    }
  }, [records, tabValue]);

  const filtered = useMemo(() => stageRecords.filter((i) => {
    const f = appliedFilters;
    return (
      (!f.indentNumber || i.indentNumber.toLowerCase().includes(f.indentNumber.toLowerCase())) &&
      (!f.itemName || i.itemName.toLowerCase().includes(f.itemName.toLowerCase())) &&
      (!f.partyName || i.partyName.toLowerCase().includes(f.partyName.toLowerCase())) &&
      (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
      (!f.status || i.status === f.status) &&
      (!f.dateFrom || i.createdDate >= f.dateFrom) &&
      (!f.dateTo || i.createdDate <= f.dateTo)
    );
  }), [stageRecords, appliedFilters]);

  const handleDelete = () => {
    dispatch(deleteRecord(selected.id));
    toast.success('Indent deleted successfully!');
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleCompleteProcess = (row) => {
    dispatch(completeStage({ id: row.id, currentStage: 'indent' }));
    toast.success(`Indent ${row.indentNumber} completed and moved to Purchase Order.`);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <ViewBtn key="view" onClick={() => { setSelected(row); setViewOpen(true); }} />,
        <EditBtn key="edit" onClick={() => { setSelected(row); setFormOpen(true); }} />,
        <Button key="complete" size="small" variant="contained" color="success" onClick={() => handleCompleteProcess(row)} sx={{ ml: 1, minWidth: '130px', fontSize: '0.7rem' }}>
          Complete Process
        </Button>,
        <DeleteBtn key="delete" onClick={() => { setSelected(row); setDeleteOpen(true); }} />
      ];
    } else {
      return [
        <ViewBtn key="view" onClick={() => { setSelected(row); setViewOpen(true); }} />,
        <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `Indent ${row.indentNumber}`)} />
      ];
    }
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Indent Management"
        subtitle={`${filtered.length} indents found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Indent' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelected(null); setFormOpen(true); }}>Create Indent</Button>}
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      
      <WorkflowFilters 
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable 
        rows={filtered} 
        title={tabValue === 0 ? "Pending Indents" : "Indent History"} 
        actions={actions} 
      />

      {formOpen && <IndentForm open={formOpen} onClose={() => { setFormOpen(false); setSelected(null); }} editItem={selected} records={records} />}
      <ViewDialog open={viewOpen} onClose={() => setViewOpen(false)} item={selected} />
      <ConfirmDialog open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} message={`Delete indent ${selected?.indentNumber}?`} />
    </Box>
  );
}
