import { addDays, subDays, format } from 'date-fns';

const today = new Date();
const fmt = (d) => format(d, 'yyyy-MM-dd');

export const USERS = [
  { id: 1, name: 'Admin User', email: 'admin@pms.com', password: 'admin123', role: 'admin', department: 'Management', status: 'active', lastLogin: fmt(subDays(today, 1)) },
  { id: 2, name: 'John Smith', email: 'user@pms.com', password: 'user123', role: 'user', department: 'Procurement', status: 'active', lastLogin: fmt(subDays(today, 2)) },
  { id: 3, name: 'Sarah Johnson', email: 'sarah@pms.com', password: 'sarah123', role: 'user', department: 'Logistics', status: 'active', lastLogin: fmt(subDays(today, 3)) },
  { id: 4, name: 'Mike Wilson', email: 'mike@pms.com', password: 'mike123', role: 'user', department: 'Warehouse', status: 'inactive', lastLogin: fmt(subDays(today, 10)) },
  { id: 5, name: 'Emma Davis', email: 'emma@pms.com', password: 'emma123', role: 'admin', department: 'Finance', status: 'active', lastLogin: fmt(today) },
];

export const COMPANIES = [
  { id: 1, name: 'Acemark Stationers' },
  { id: 2, name: 'Alpha Industries Ltd' },
  { id: 3, name: 'Beta Manufacturing Co.' },
  { id: 4, name: 'Gamma Enterprises' },
  { id: 5, name: 'Delta Corp Ltd' },
  { id: 6, name: 'Epsilon Solutions' },
];

export const VENDORS = [
  { id: 1, name: 'Vidadri Paper Raipur', contact: 'Manager', phone: '9000000000', email: 'vidadri@example.com' },
  { id: 2, name: 'Raj Suppliers', contact: 'Rajesh Kumar', phone: '9876543210', email: 'raj@suppliers.com' },
  { id: 3, name: 'Sharma Traders', contact: 'Vikram Sharma', phone: '9876543211', email: 'sharma@traders.com' },
  { id: 4, name: 'Patel Enterprises', contact: 'Suresh Patel', phone: '9876543212', email: 'patel@enterprises.com' },
];

export const GROUPS = ['Raw Materials', 'Electrical', 'Mechanical', 'Civil', 'IT Equipment', 'Safety', 'Consumables', 'Chemicals', 'Tools', 'Office Supplies'];
export const UNITS = ['KG', 'Litre', 'Meter', 'Piece', 'Box', 'Ton', 'Set', 'Roll', 'Bag', 'Drum'];

export const STATUSES = [
  'Pending Approval',
  'In Progress',
  'Fully Completed'
];

export const ORDER_BY = [
  'Admin User',
  'John Smith',
  'Sarah Johnson',
  'Emma Davis'
];

const ITEMS = [
  { name: 'Vidadri Paper Eco 86Cm, 44Gsm', code: '8644VE', group: 'Raw Materials' },
  { name: 'Vidadri Paper Eco 52Cm, 44Gsm', code: '5244VE', group: 'Raw Materials' },
  { name: 'Vidadri Paper Eco 77Cm, 44Gsm', code: '7744VE', group: 'Raw Materials' },
  { name: 'Vidadri Paper Eco 57.5Cm, 44Gsm', code: '57544VE', group: 'Raw Materials' },
  { name: 'VIDADRI PAPER ECO 86CM X 42CM, 44GSM', code: '864244VE', group: 'Raw Materials' },
  { name: 'Steel Rod 12mm', code: 'ITM001', group: 'Raw Materials' },
  { name: 'MS Plate 10mm', code: 'ITM002', group: 'Raw Materials' },
  { name: 'PVC Cable 4 Core', code: 'ITM003', group: 'Electrical' },
  { name: 'Electric Motor 5HP', code: 'ITM004', group: 'Electrical' },
  { name: 'Bearing 6205', code: 'ITM005', group: 'Mechanical' },
  { name: 'Hydraulic Jack 5T', code: 'ITM006', group: 'Mechanical' },
];

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

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

export const generateRecords = () => {
  return Array.from({ length: 150 }, (_, i) => {
    const item = ITEMS[i % ITEMS.length];
    const qty = randomInt(10, 500);
    const rate = randomFloat(50, 5000);
    const gst = randomFrom([5, 12, 18, 28]);
    const discount = randomFrom([0, 2, 5, 10]);
    const amount = parseFloat((qty * rate * (1 + gst / 100) * (1 - discount / 100)).toFixed(2));
    const date = subDays(today, randomInt(0, 180));
    const company = randomFrom(COMPANIES);
    const vendor = randomFrom(VENDORS);
    
    // Randomly assign a current active stage (0 to STAGES.length - 1)
    // 0 = Indent, 7 = TallyEntry. If it passed TallyEntry, it's fully complete.
    const currentStageIndex = randomInt(0, STAGES.length); // STAGES.length means fully completed all
    
    const workflowStage = {};
    for (let s = 0; s < STAGES.length; s++) {
      if (s < currentStageIndex) {
        workflowStage[STAGES[s]] = 'Completed';
      } else if (s === currentStageIndex) {
        workflowStage[STAGES[s]] = 'Pending';
      } else {
        workflowStage[STAGES[s]] = null;
      }
    }

    // For Indent, if it's completed, its status is 'Approved'. 
    // Wait, the workflow uses standard Pending/Completed for internal logic, but we also have a display 'Status'.
    // We'll map the display status based on the current stage if needed, or keep it generic 'Active', 'Completed'.
    let status = 'In Progress';
    if (currentStageIndex === 0) status = 'Pending Approval';
    if (currentStageIndex === STAGES.length) status = 'Fully Completed';

    // If it's one of the specific items, hardcode it to Vidadri and Acemark to guarantee it shows up properly in the demo!
    let finalVendor = vendor;
    let finalCompany = company;
    let currentStageIndexToUse = currentStageIndex;

    if (item.name.includes('Vidadri')) {
      finalVendor = VENDORS[0]; // Vidadri Paper
      finalCompany = COMPANIES[0]; // Acemark Stationers
      // Force them to be Pending in Purchase Order so they get batched
      currentStageIndexToUse = 1; 
      status = 'In Progress';
      for (let s = 0; s < STAGES.length; s++) {
        if (s < currentStageIndexToUse) {
          workflowStage[STAGES[s]] = 'Completed';
        } else if (s === currentStageIndexToUse) {
          workflowStage[STAGES[s]] = 'Pending';
        } else {
          workflowStage[STAGES[s]] = null;
        }
      }
    }

    return {
      id: i + 1,
      indentNumber: `IND-2024-${String(i + 1).padStart(4, '0')}`,
      date: fmt(date),
      createdDate: fmt(date),
      orderBy: randomFrom(['Admin User', 'John Smith', 'Sarah Johnson', 'Emma Davis']),
      partyName: finalVendor.name,
      groupName: item.group,
      itemName: item.name,
      itemCode: item.code,
      description: item.name,
      quantity: qty,
      unit: item.name.includes('Vidadri') ? 'KGS' : randomFrom(UNITS),
      rate: item.name.includes('Vidadri') ? 46.5 : rate,
      gst: item.name.includes('Vidadri') ? 12 : gst,
      discount: item.name.includes('Vidadri') ? 0 : discount,
      amount: item.name.includes('Vidadri') ? qty * 46.5 : amount,
      leadDays: randomInt(3, 45),
      companyName: finalCompany.name,
      status: status, // global status display
      image: null,
      
      workflowStage // the core state machine tracker
    };
  });
};

const records = generateRecords();

export default {
  users: USERS,
  companies: COMPANIES,
  vendors: VENDORS,
  records,
};

