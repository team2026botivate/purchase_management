import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { ViewBtn, PrintBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { completeStage, updateRecord } from '../../store/slices/workflowSlice';
import WorkflowTable, { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import { printTable } from '../../utils/exportUtils';

export default function ApprovalPurchasePOPage() {
  const dispatch = useDispatch();
  const records = useSelector((s) => s.workflow.records);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(r => r.workflowStage.approvalPO === 'Pending');
    } else {
      return records.filter(r => r.workflowStage.approvalPO === 'Completed');
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

  const handleOpenConfirm = (row) => {
    setSelectedRow(row);
    setConfirmOpen(true);
  };

  const handleApprove = () => {
    if (!selectedRow) return;
    dispatch(updateRecord({ id: selectedRow.id, status: 'Approved' }));
    dispatch(completeStage({ id: selectedRow.id, currentStage: 'approvalPO', nextStageOverride: 'sendPO' }));
    toast.success(`Purchase Order ${selectedRow.indentNumber} Approved!`);
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  const handleReject = () => {
    if (!selectedRow) return;
    dispatch(updateRecord({ id: selectedRow.id, status: 'Rejected' }));
    toast.error(`Purchase Order ${selectedRow.indentNumber} Rejected.`);
    setConfirmOpen(false);
    setSelectedRow(null);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button 
          key="approve" 
          size="small" 
          variant="contained" 
          color="success" 
          startIcon={<ThumbUpIcon />} 
          onClick={() => handleOpenConfirm(row)}
          sx={{ minWidth: '110px', fontSize: '0.7rem' }}
        >
          Approve PO
        </Button>
      ];
    } else {
      return [
        <ViewBtn key="view" onClick={() => {}} />,
        <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `Approved PO for ${row.indentNumber}`)} />
      ];
    }
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Approval Purchase PO"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Approval Purchase PO' }]}
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      
      <WorkflowFilters 
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable 
        rows={filtered} 
        title={tabValue === 0 ? "Pending Approvals" : "Approval History"} 
        actions={actions} 
      />

      {/* Approval Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
            Approve Purchase Order
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '0 !important' }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Do you want to approve this Purchase Order?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} variant="outlined" color="error">
            Reject
          </Button>
          <Button onClick={handleApprove} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
