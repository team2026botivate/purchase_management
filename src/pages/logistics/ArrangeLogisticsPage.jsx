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

export default function ArrangeLogisticsPage() {
  const dispatch = useDispatch();
  const records  = useSelector((s) => s.workflow.records);

  const [tabValue,       setTabValue]       = useState(0); // 0: Pending, 1: History
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  // Pending = logistics stage is active
  // History = logistics stage completed
  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(
        (r) => r.workflowStage.logistics === 'Pending'
      );
    }
    return records.filter((r) => r.workflowStage.logistics === 'Completed');
  }, [records, tabValue]);

  const filtered = useMemo(() =>
    stageRecords.filter((i) => {
      const f = appliedFilters;
      return (
        (!f.indentNumber || i.indentNumber.toLowerCase().includes(f.indentNumber.toLowerCase())) &&
        (!f.itemName     || i.itemName.toLowerCase().includes(f.itemName.toLowerCase()))         &&
        (!f.partyName    || i.partyName.toLowerCase().includes(f.partyName.toLowerCase()))       &&
        (!f.companyName  || i.companyName.toLowerCase().includes(f.companyName.toLowerCase()))   &&
        (!f.status       || i.status === f.status)                                               &&
        (!f.dateFrom     || i.createdDate >= f.dateFrom)                                         &&
        (!f.dateTo       || i.createdDate <= f.dateTo)
      );
    }), [stageRecords, appliedFilters]);

  const handleArrangeLogistics = (row) => {
    dispatch(completeStage({ id: row.id, currentStage: 'logistics' }));
    toast.success(`Logistics completed for Indent ${row.indentNumber} — moved to Receive Material.`);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      // Show the correct action based on which sub-stage the record is in
      return [
        <Button
          key="logistics" size="small" variant="contained" color="success"
          onClick={() => handleArrangeLogistics(row)}
          sx={{ minWidth: 145, fontSize: '0.7rem' }}
        >
          Arrange & Get Lifting
        </Button>,
      ];
    }
    return [
      <ViewBtn key="view" onClick={() => {}} />,
      <PrintBtn
        key="print"
        onClick={() =>
          printTable(
            [row],
            WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })),
            `Logistics & Lifting — ${row.indentNumber}`
          )
        }
      />,
    ];
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Arrange Logistics & Get Lifting"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Arrange Logistics & Get Lifting' },
        ]}
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />

      <WorkflowFilters
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable
        rows={filtered}
        title={tabValue === 0 ? 'Pending — Logistics & Lifting' : 'History — Logistics & Lifting'}
        actions={actions}
      />
    </Box>
  );
}
