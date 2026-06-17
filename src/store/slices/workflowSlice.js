import { createSlice } from '@reduxjs/toolkit';
import mockData from '../../data/mockData';

const STAGES = [
  'indent',
  'purchaseOrder',
  'approvalPO',
  'sendPO',
  'followUp',
  'logistics',
  'receiveMaterial',
  'liftReceiver',
  'tallyEntry'
];

const initialState = {
  records: mockData.records,
  loading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    addRecord: (state, action) => {
      // New indent added
      const newRecord = {
        ...action.payload,
        id: state.records.length + 1,
        workflowStage: {
          indent: 'Pending',
          purchaseOrder: null,
          approvalPO: null,
          sendPO: null,
          followUp: null,
          logistics: null,
          receiveMaterial: null,
          liftReceiver: null,
          tallyEntry: null,
        }
      };
      state.records.push(newRecord);
    },
    updateRecord: (state, action) => {
      // General update (used in Indent Management primarily)
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = { ...state.records[index], ...action.payload };
      }
    },
    deleteRecord: (state, action) => {
      state.records = state.records.filter((r) => r.id !== action.payload);
    },
    completeStage: (state, action) => {
      const { id, currentStage, nextStageOverride } = action.payload;
      const index = state.records.findIndex((r) => r.id === id);
      if (index !== -1) {
        const record = state.records[index];
        const currentStageIndex = STAGES.indexOf(currentStage);
        
        if (currentStageIndex !== -1) {
          // Mark current stage as Completed
          record.workflowStage[currentStage] = 'Completed';
          
          // Determine next stage
          let nextStage = null;
          if (nextStageOverride && STAGES.includes(nextStageOverride)) {
            nextStage = nextStageOverride;
          } else if (currentStageIndex + 1 < STAGES.length) {
            nextStage = STAGES[currentStageIndex + 1];
          }

          if (nextStage) {
            record.workflowStage[nextStage] = 'Pending';
          } else {
            // Reached the end or no next stage defined
            record.status = 'Fully Completed';
          }
        }
      }
    }
  },
});

export const { addRecord, updateRecord, deleteRecord, completeStage } = workflowSlice.actions;

// Selectors
export const selectRecords = (state) => state.workflow.records;
export const selectPendingByStage = (stage) => (state) =>
  state.workflow.records.filter((r) => r.workflowStage[stage] === 'Pending');
export const selectHistoryByStage = (stage) => (state) =>
  state.workflow.records.filter((r) => r.workflowStage[stage] === 'Completed');

export default workflowSlice.reducer;
