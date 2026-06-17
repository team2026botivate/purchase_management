import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import {
  Dialog, DialogContent, Box, Typography, TextField, MenuItem, Button, IconButton, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import { updateRecord, completeStage } from '../../store/slices/workflowSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import aceLogo from '../../assets/ace-logo.png';

const generatePONumber = () => `ACE/PO/25-26-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// Styled transparent input for seamless integration into the printed form
const TransparentInput = ({ ...props }) => (
  <TextField
    variant="standard"
    fullWidth
    InputProps={{ disableUnderline: true, style: { fontSize: '0.7rem', fontWeight: 600, padding: 0 } }}
    sx={{ '& .MuiInputBase-input': { padding: 0, height: 'auto' } }}
    {...props}
  />
);

export default function GeneratePOForm({ open, onClose }) {
  const dispatch = useDispatch();
  const vendors = useSelector((state) => state.vendorMaster.items) || [];
  const companies = useSelector((state) => state.companies.items) || [];
  const allRecords = useSelector((state) => state.workflow.records) || [];

  const { control, register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      poNumber: generatePONumber(),
      poDate: new Date().toISOString().slice(0, 10),
      supplierId: '',
      vendorName: '',
      vendorGst: '',
      vendorAddress: '',
      companyId: '',
      companyName: 'Acemark Stationers',
      companyGst: '',
      companyPan: '',
      billingAddress: '',
      destinationAddress: '',
      items: [],
      priceBasis: 'F.O.R. Destination',
      taxesDuties: 'GST Extra as applicable',
      delivery: 'Within 2-3 Weeks from PO date',
      transport: 'By Supplier',
      paymentTerms: '30 Days credit',
      dispatchDate: '',
    }
  });

  const { replace } = useFieldArray({ control, name: 'items' });

  // Auto-fetch data when supplier is selected
  const selectedSupplierId = watch('supplierId');
  useEffect(() => {
    if (selectedSupplierId && vendors.length > 0) {
      const ven = vendors.find(v => v.id === selectedSupplierId);
      if (ven) {
        setValue('vendorName', ven.vendorName || '');
        setValue('vendorGst', ven.gstNumber || '');
        setValue('vendorAddress', ven.vendorLocation ? ven.vendorLocation : 'Not available');

        // Batch pending indents specifically for Purchase Order stage
        const matchedIndents = allRecords.filter(r => 
          r.partyName === ven.vendorName && r.workflowStage?.purchaseOrder === 'Pending'
        );

        if (matchedIndents.length > 0) {
          toast.info(`Batched ${matchedIndents.length} items for ${ven.vendorName}`);
          
          // Auto-fill company
          const comp = companies.find(c => c.companyName === matchedIndents[0].companyName);
          if (comp) {
            setValue('companyId', comp.id);
            setValue('companyName', comp.companyName);
            setValue('companyGst', comp.gstNumber || '');
            setValue('companyPan', comp.panNumber || '');
            setValue('billingAddress', comp.billingAddress || '');
            setValue('destinationAddress', comp.destination || '');
          }

          replace(matchedIndents.map((ind, idx) => ({
            sno: idx + 1,
            itemCode: ind.itemCode || '',
            description: ind.itemName ? `${ind.itemName} - ${ind.description || ''}` : '',
            quantity: ind.quantity || 0,
            unit: ind.unit || '',
            rate: ind.rate || 0,
            discount: ind.discount || 0,
            gst: ind.gst || 0,
          })));
        } else {
          toast.warning(`No pending indents found for ${ven.vendorName}`);
          replace([]);
        }
      }
    } else {
      replace([]);
    }
  }, [selectedSupplierId, vendors, allRecords, companies, setValue, replace]);

  const watchItems = useWatch({ control, name: 'items' });
  const [totals, setTotals] = useState({ grandTotal: 0 });

  useEffect(() => {
    let sub = 0;
    let gstAmt = 0;
    (watchItems || []).forEach((item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      const d = parseFloat(item.discount) || 0;
      const g = parseFloat(item.gst) || 0;
      const lineBase = q * r - d;
      sub += lineBase;
      gstAmt += lineBase * (g / 100);
    });
    setTotals({ grandTotal: sub + gstAmt });
  }, [watchItems]);

  const data = watch();
  const emptyRowsCount = Math.max(15 - (data.items?.length || 0), 5);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const onSubmit = () => {
    const data = watch();
    if (!data.supplierId) {
      toast.error('Please select a supplier first.');
      return;
    }
    
    // Find exactly which records were batched
    const matchedIndents = allRecords.filter(r => 
      r.partyName === data.vendorName && r.workflowStage?.purchaseOrder === 'Pending'
    );

    if (matchedIndents.length === 0) {
      toast.error('No pending indents to process.');
      return;
    }

    // Process all batched records: attach PO info and mark as completed for this stage
    matchedIndents.forEach(indent => {
      // Save PO details back to the indent
      dispatch(updateRecord({
        id: indent.id,
        poNumber: data.poNumber,
        poDate: data.poDate,
      }));
      // Move to next stage (History for PO, Pending for Follow-Up)
      dispatch(completeStage({ id: indent.id, currentStage: 'purchaseOrder' }));
    });

    toast.success(`Purchase Order Generated! ${matchedIndents.length} items moved to History.`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 0, minHeight: '90vh' } }}>
      {/* Top Action Bar (Non-Printable) */}
      <Box className="no-print" sx={{ p: 1.5, bgcolor: 'grey.200', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700}>Purchase Order Form</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
          <Button variant="contained" size="small" color="primary" startIcon={<SaveIcon />} onClick={handleSubmit(onSubmit)}>Save & Submit PO</Button>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
      </Box>

      {/* Printable PO Template as the Form */}
      <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fff', '@media print': { p: 0 } }}>
        <Box sx={{ 
          maxWidth: '900px', mx: 'auto', border: '2px solid #000', 
          fontFamily: '"Arial", sans-serif', color: '#000',
          '& *': { borderColor: '#000 !important' } 
        }}>
          
          {/* 1. Header */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #000' }}>
            <Box sx={{ width: '150px', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid #000' }}>
              <img src={aceLogo} alt="ACE Logo" style={{ maxWidth: '100%', maxHeight: '70px', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ bgcolor: '#4A90E2', color: '#fff', py: 1.5, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: 1 }}>{data.companyName}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', py: 0.5, borderBottom: '1px solid #000' }}>
                <Typography variant="body2" fontWeight={600}>Changurabhata, Raipur, Chhattisgarh</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="body2" fontWeight={700}>Purchase Order</Typography>
              </Box>
            </Box>
          </Box>

          {/* 2. Supplier & PO Info */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #000', minHeight: '80px' }}>
            <Box sx={{ flex: 1, p: 1, borderRight: '2px solid #000' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>Supplier:- </Typography>
                <Controller name="supplierId" control={control} render={({ field }) => (
                  <TextField 
                    {...field} select variant="standard" 
                    SelectProps={{ disableUnderline: true, style: { fontSize: '0.75rem', fontWeight: 600, color: '#1976d2' } }}
                    sx={{ flex: 1, '& .MuiSelect-select': { p: 0 } }}
                  >
                    <MenuItem value="" disabled>Select Supplier...</MenuItem>
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.vendorName}</MenuItem>)}
                  </TextField>
                )} />
              </Box>
              <Box sx={{ display: 'flex', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>Address:- </Typography>
                <Typography variant="caption" sx={{ flex: 1 }}>{data.vendorAddress}</Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>GSTIN :- </Typography>
                <Typography variant="caption" sx={{ flex: 1 }}>{data.vendorGst}</Typography>
              </Box>
            </Box>
            <Box sx={{ width: '300px', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>PO No : </Typography>
                <TransparentInput {...register('poNumber')} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>PO Date : </Typography>
                <TransparentInput type="date" {...register('poDate')} />
              </Box>
            </Box>
          </Box>

          {/* 3. Commercial Details */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '2px solid #000' }}>
            <Box sx={{ textAlign: 'center', borderRight: '1px solid #000' }}>
              <Typography variant="caption" fontWeight={700} sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', py: 0.5, borderBottom: '1px solid #000' }}>Our Commercial Details</Typography>
              <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px', borderRight: '1px solid #000', p: 0.5 }}>GSTIN</Typography>
                <Box sx={{ flex: 1, p: 0.5 }}><TransparentInput {...register('companyGst')} /></Box>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px', borderRight: '1px solid #000', p: 0.5 }}>PAN No.</Typography>
                <Box sx={{ flex: 1, p: 0.5 }}><TransparentInput {...register('companyPan')} /></Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" fontWeight={700} sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', py: 0.5, borderBottom: '1px solid #000' }}>Billing Address</Typography>
              <Box sx={{ p: 0.5, borderBottom: '1px solid #000' }}><TransparentInput {...register('companyName')} inputProps={{ style: { textAlign: 'center', fontWeight: 600 } }} /></Box>
              <Box sx={{ p: 0.5, flex: 1 }}><TransparentInput multiline {...register('billingAddress')} inputProps={{ style: { textAlign: 'center' } }} /></Box>
            </Box>
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" fontWeight={700} sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', py: 0.5, borderBottom: '1px solid #000' }}>Destination Address</Typography>
              <Box sx={{ p: 0.5, borderBottom: '1px solid #000' }}><TransparentInput {...register('companyName')} inputProps={{ style: { textAlign: 'center', fontWeight: 600 } }} /></Box>
              <Box sx={{ p: 0.5, flex: 1 }}><TransparentInput multiline {...register('destinationAddress')} inputProps={{ style: { textAlign: 'center' } }} /></Box>
            </Box>
          </Box>

          <Box sx={{ p: 1, borderBottom: '1px solid #000' }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1 }}>Dear Sir,</Typography>
            <Typography variant="caption" fontWeight={700}>We Are Pleased To Place Our Purchase Order With You, As Per The Following Details.</Typography>
          </Box>

          {/* 4. Items Table */}
          <Box component="table" sx={{ 
            width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
            '& th': { bgcolor: '#4A90E2', color: '#fff', fontWeight: 700, py: 0.5, px: 0.5, borderBottom: '1px solid #000', borderRight: '1px solid #000', fontSize: '0.65rem', textAlign: 'center' },
            '& td': { borderBottom: '1px solid #000', borderRight: '1px solid #000', py: 0.5, px: 0.5, fontSize: '0.65rem', textAlign: 'center' },
            '& th:last-child, & td:last-child': { borderRight: 0 }
          }}>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>S/N</th>
                <th style={{ width: '80px' }}>Product Code</th>
                <th>Product</th>
                <th style={{ width: '120px' }}>Description</th>
                <th style={{ width: '50px' }}>Qty</th>
                <th style={{ width: '50px' }}>Unit</th>
                <th style={{ width: '50px' }}>Rate</th>
                <th style={{ width: '50px' }}>Discount<br/>Amount</th>
                <th style={{ width: '40px' }}>Gst (%)</th>
                <th style={{ width: '70px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => {
                const q = parseFloat(item.quantity) || 0;
                const r = parseFloat(item.rate) || 0;
                const d = parseFloat(item.discount) || 0;
                const g = parseFloat(item.gst) || 0;
                const amt = (q * r) - d;
                const totalWithGst = amt + (amt * g / 100);
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><TransparentInput {...register(`items.${idx}.itemCode`)} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td style={{ textAlign: 'left' }}><TransparentInput {...register(`items.${idx}.description`)} /></td>
                    <td></td> {/* Description split handled implicitly above or blank for simplicity */}
                    <td><TransparentInput type="number" {...register(`items.${idx}.quantity`)} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput {...register(`items.${idx}.unit`)} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.rate`)} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.discount`)} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.gst`)} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td style={{ fontWeight: 600 }}>{Math.round(totalWithGst)}</td>
                  </tr>
                );
              })}
              {/* Empty Rows */}
              {emptyRows.map((_, idx) => (
                <tr key={`empty-${idx}`} style={{ height: '22px' }}>
                  <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                <td colSpan={9} style={{ textAlign: 'center' }}>Grand Total</td>
                <td>{Math.round(totals.grandTotal)}</td>
              </tr>
              <tr style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                <td colSpan={9} style={{ textAlign: 'right', borderBottom: 0 }}></td>
                <td style={{ borderBottom: 0 }}>{Math.round(totals.grandTotal)}</td>
              </tr>
            </tbody>
          </Box>

          {/* 5. Terms Area */}
          <Box sx={{ borderTop: '2px solid #000' }}>
            <Typography variant="caption" sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', px: 1, py: 0.25, fontWeight: 700, textTransform: 'uppercase' }}>The Above</Typography>
            <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: '15px 80px 1fr', gap: 0.5, alignItems: 'center', '& p': { m: 0, fontSize: '0.65rem', fontWeight: 600 } }}>
              <p>1</p><p>Price Basis :</p><TransparentInput {...register('priceBasis')} />
              <p>2</p><p>Taxes & Duties :</p><TransparentInput {...register('taxesDuties')} />
              <p>3</p><p>Delivery :</p><TransparentInput {...register('delivery')} />
              <p>4</p><p>Transport :</p><TransparentInput {...register('transport')} />
              <p>5</p><p>Payment :</p><TransparentInput {...register('paymentTerms')} />
              <p>6</p><p>Dispatch Date :</p><TransparentInput type="date" {...register('dispatchDate')} />
            </Box>
            
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', p: 1, mt: 1 }}>
              Kindly Acknowledge Receipt Of This Purchase Order Along With Its Enclosures, And Ensure Timely Execution Of The Ordered Material.
            </Typography>
          </Box>

          {/* 6. Signatures */}
          <Box sx={{ display: 'flex', bgcolor: '#4A90E2', color: '#fff', '& div': { flex: 1, py: 0.5, px: 2, fontSize: '0.65rem', fontWeight: 700 } }}>
            <Box textAlign="left">Prepared By</Box>
            <Box textAlign="center">Purchase Head</Box>
            <Box textAlign="right"></Box>
          </Box>

        </Box>
      </DialogContent>
    </Dialog>
  );
}
