import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button } from '@mui/material';
import { ViewBtn, PrintBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { completeStage } from '../../store/slices/workflowSlice';
import WorkflowTable, { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import { printTable } from '../../utils/exportUtils';

export default function ReceiveMaterialPage() {
  const dispatch = useDispatch();
  const records = useSelector((s) => s.workflow.records);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(r => r.workflowStage.receiveMaterial === 'Pending');
    } else {
      return records.filter(r => r.workflowStage.receiveMaterial === 'Completed');
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

  const handleCompleteProcess = (row) => {
    dispatch(completeStage({ id: row.id, currentStage: 'receiveMaterial' }));
    toast.success(`Material received for Indent ${row.indentNumber} and moved to Lift Receiver.`);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="complete" size="small" variant="contained" color="success" onClick={() => handleCompleteProcess(row)} sx={{ minWidth: '130px', fontSize: '0.7rem' }}>
          Receive Material
        </Button>
      ];
    } else {
      return [
        <ViewBtn key="view" onClick={() => {}} />,
        <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `Receive Material for ${row.indentNumber}`)} />
      ];
    }
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Receive Material"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Receive Material' }]}
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      
      <WorkflowFilters 
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable 
        rows={filtered} 
        title={tabValue === 0 ? "Pending Receive" : "Receive History"} 
        actions={actions} 
      />
    </Box>
  );
}
