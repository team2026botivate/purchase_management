import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button } from '@mui/material';
import { ViewBtn, PrintBtn } from '../../components/common/ActionButtons';
import DescriptionIcon from '@mui/icons-material/Description';
import GeneratePOForm from '../../components/po/GeneratePOForm';
import { toast } from 'react-toastify';
import { completeStage } from '../../store/slices/workflowSlice';
import WorkflowTable, { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import { printTable } from '../../utils/exportUtils';

export default function PurchaseOrderPage() {
  const dispatch = useDispatch();
  const records = useSelector((s) => s.workflow.records);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  const [generatePOOpen, setGeneratePOOpen] = useState(false);
  
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(r => r.workflowStage.purchaseOrder === 'Pending');
    } else {
      return records.filter(r => r.workflowStage.purchaseOrder === 'Completed');
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
    dispatch(completeStage({ id: row.id, currentStage: 'purchaseOrder' }));
    toast.success(`Purchase Order generated for Indent ${row.indentNumber} and moved to Follow-Up.`);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <ViewBtn key="view" onClick={() => {}} />
      ];
    } else {
      return [
        <ViewBtn key="view" onClick={() => {}} />,
        <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `PO for ${row.indentNumber}`)} />
      ];
    }
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Generate Purchase PO"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Purchase Order' }]}
        actions={
          <Button variant="contained" color="secondary" startIcon={<DescriptionIcon />} onClick={() => setGeneratePOOpen(true)}>
            Generate Purchase Order
          </Button>
        }
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      
      <WorkflowFilters 
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable 
        rows={filtered} 
        title={tabValue === 0 ? "Pending PO Generation" : "PO Generation History"} 
        actions={actions} 
      />

      {generatePOOpen && <GeneratePOForm open={generatePOOpen} onClose={() => setGeneratePOOpen(false)} />}
    </Box>
  );
}
