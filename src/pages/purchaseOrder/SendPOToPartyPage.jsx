import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { ViewBtn, PrintBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { completeStage } from '../../store/slices/workflowSlice';
import WorkflowTable, { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import { printTable } from '../../utils/exportUtils';

export default function SendPOToPartyPage() {
  const dispatch = useDispatch();
  const records = useSelector((s) => s.workflow.records);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(r => r.workflowStage.sendPO === 'Pending');
    } else {
      return records.filter(r => r.workflowStage.sendPO === 'Completed');
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

  const handleSendPO = (row) => {
    dispatch(completeStage({ id: row.id, currentStage: 'sendPO', nextStageOverride: 'followUp' }));
    toast.success(`Purchase Order ${row.indentNumber} sent to party! Moved to Follow-Up.`);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button 
          key="send" 
          size="small" 
          variant="contained" 
          color="primary" 
          startIcon={<SendIcon />} 
          onClick={() => handleSendPO(row)}
          sx={{ minWidth: '110px', fontSize: '0.7rem' }}
        >
          Send to Party
        </Button>
      ];
    } else {
      return [
        <ViewBtn key="view" onClick={() => {}} />,
        <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `Sent PO for ${row.indentNumber}`)} />
      ];
    }
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Send PO To Party"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Send PO To Party' }]}
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      
      <WorkflowFilters 
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable 
        rows={filtered} 
        title={tabValue === 0 ? "Pending Send" : "Sent History"} 
        actions={actions} 
      />
    </Box>
  );
}
